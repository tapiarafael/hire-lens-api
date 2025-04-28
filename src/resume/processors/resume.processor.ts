import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AI_SERVICE } from 'src/ai/ai.module';
import { AIService } from 'src/ai/ai.service';
import { AIProvider } from 'src/ai/types/ai-provider.enum';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { resumes } from 'src/drizzle/schema';
import { DrizzleDB } from 'src/drizzle/types/drizzle';

export const RESUME_QUEUE = 'RESUME_QUEUE';

@Processor(RESUME_QUEUE)
export class ResumeProcessor extends WorkerHost {
  constructor(
    @InjectPinoLogger(ResumeProcessor.name) private readonly logger: PinoLogger,
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
    @Inject(AI_SERVICE)
    private readonly aiService: AIService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  async process(job: Job<{ resumeId: string }>): Promise<void> {
    this.logger.info({
      msg: 'Processing job from RESUME_QUEUE',
      jobId: job.id,
      resumeId: job.data.resumeId,
    });

    const [{ rawContent }] = await this.db
      .select({ rawContent: resumes.rawContent })
      .from(resumes)
      .where(eq(resumes.id, job.data.resumeId))
      .limit(1);

    if (!rawContent) {
      this.logger.error(
        `No raw content found for resume ID ${job.data.resumeId}`,
      );
      return;
    }

    // This params could be loaded from DB or even .env to be more flexible
    const provider = this.configService.get<AIProvider>('AI_PROVIDER');
    const llmParams = {
      model:
        provider === AIProvider.OPENAI
          ? 'gpt-4o-mini-2024-07-18'
          : 'claude-3-5-haiku-20241022',
      temperature: 0.2,
      maxTokens: 2000,
      systemInstructions: `You're a resume analyzer. Analyze the resume and provide some insight based on user request. All response should be in the following JSON format: {score: number, suggestions: string[]}. Do not include any other text.`,
      prompt: `You are an advanced resume analyzer with expertise in evaluating resumes and providing constructive feedback. Your task is to analyze a given resume, assign a score, and suggest improvements.

              Here is the resume content you need to analyze:

              <resume>
              ${rawContent}
              </resume>

              Please follow these steps to complete your analysis:

              1. Carefully read and analyze the resume content.
              2. Assign a score from 0 to 100 based on the overall quality of the resume. Consider factors such as formatting, content relevance, clarity, and impact.
              3. Generate specific and actionable suggestions for improving the resume. These should be direct and clearly explain what could be improved and how.

              Before providing your final output, wrap your thought process in <resume_evaluation> tags. In this section:

              1. Evaluate the resume in these specific categories:
                a. Formatting
                b. Content relevance
                c. Clarity
                d. Impact
                For each category, list 2-3 specific observations and assign a sub-score out of 25.

              2. Summarize the main strengths of the resume.

              3. Summarize the main weaknesses of the resume.

              4. Explain your reasoning for the final overall score, considering the sub-scores and your observations.

              Your final output must be in the following JSON format:
              {
                "score": number,
                "suggestions": string[]
              }

              Where:
              - "score" is a number between 0 and 100
              - "suggestions" is an array of strings, each containing a specific improvement suggestion

              Example of the expected output structure (do not use this content in your actual analysis):
              {
                "score": 75,
                "suggestions": [
                  "Add more quantifiable achievements in your work experience section",
                  "Include relevant keywords from the job description you're targeting",
                  "Improve the formatting for better readability"
                ]
              }

              Remember to be specific and actionable in your suggestions, focusing on how the resume can be improved to make a stronger impact.`,
    };

    // Save the params used for the LLM to the database
    // It could be useful for auditing or debugging purposes
    await this.db
      .update(resumes)
      .set({ status: 'PROCESSING', llmParams: llmParams })
      .where(eq(resumes.id, job.data.resumeId));

    // The prompt is hard coded here, but could be loaded from DB or a file
    const result = await this.aiService.generateText(llmParams);

    const [rawEvaluation, rawJson] = result.split('</resume_evaluation>');
    const summary = rawEvaluation.replace('<resume_evaluation>', '').trim();
    const parsedJson = JSON.parse(rawJson) as {
      score: number;
      suggestions: string[];
    };
    const { score, suggestions } = parsedJson;

    this.logger.info(`Finished processing job ${job.id}`);
    await this.db
      .update(resumes)
      .set({
        status: 'COMPLETED',
        suggestions: suggestions,
        score: score,
        summary: summary,
      })
      .where(eq(resumes.id, job.data.resumeId));
  }
}
