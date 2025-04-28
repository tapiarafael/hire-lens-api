import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DRIZZLE } from 'src/drizzle/drizzle.module';
import { DrizzleDB } from 'src/drizzle/types/drizzle';
import { Inject } from '@nestjs/common';
import { jobs, jobsResumes, resumes } from 'src/drizzle/schema';
import { and, eq } from 'drizzle-orm';
import { AIService } from 'src/ai/ai.service';
import { AI_SERVICE } from 'src/ai/ai.module';
import { AIProvider } from 'src/ai/types/ai-provider.enum';

export const JOB_RESUME_QUEUE = 'JOB_RESUME_QUEUE';

export interface JobResumePayload {
  jobId: string;
  resumeId: string;
}

@Processor(JOB_RESUME_QUEUE)
export class JobResumeProcessor extends WorkerHost {
  constructor(
    private readonly configService: ConfigService,
    @InjectPinoLogger(JobResumeProcessor.name)
    private readonly logger: PinoLogger,
    @Inject(DRIZZLE)
    private readonly db: DrizzleDB,
    @Inject(AI_SERVICE)
    private readonly aiService: AIService,
  ) {
    super();
  }
  async process(job: Job<JobResumePayload>): Promise<any> {
    const { jobId, resumeId } = job.data;
    this.logger.info({ msg: 'Processing job resume', jobId, resumeId });

    await this.db.update(jobsResumes).set({
      status: 'processing',
    });

    const jobDescription = await this.getJobData(jobId);

    this.logger.info({
      msg: 'Generating job compatibility analysis',
      jobId,
      resumeId,
    });
    const jobRawSummary = await this.getJobCompatibility(
      resumeId,
      jobDescription,
    );
    this.logger.info({
      msg: 'Job compatibility analysis completed',
      jobId,
      resumeId,
    });

    const [rawEvaluation, rawJson] = jobRawSummary.split('</resume_analysis>');
    const summary = rawEvaluation.replace('<resume_analysis>', '').trim();
    const parsedJson = JSON.parse(rawJson) as {
      score: number;
      suggestions: string[];
    };
    const { score, suggestions } = parsedJson;

    await this.db
      .update(jobsResumes)
      .set({
        status: 'completed',
        score,
        suggestions,
        summary,
      })
      .where(
        and(eq(jobsResumes.resumeId, resumeId), eq(jobsResumes.jobId, jobId)),
      );

    this.logger.info({
      msg: 'Job resume processing completed',
      resumeId,
      jobId,
    });
  }

  private async getJobData(jobId: string): Promise<string> {
    this.logger.info({ msg: 'Fetching job data', jobId });
    const [jobData] = await this.db
      .select({
        id: jobs.id,
        jobUrl: jobs.url,
        description: jobs.description,
      })
      .from(jobs)
      .where(eq(jobs.id, jobId));

    if (jobData.description) {
      this.logger.info({ msg: 'Job already exists', jobId });
      return jobData.description;
    }

    const jobRawPage = await this.extractJobInfo(jobData.jobUrl);

    this.logger.info({ msg: 'Job raw page fetched', jobId });

    await this.db
      .update(jobs)
      .set({
        title: jobRawPage.match(/^Title:\s*(.+)$/m)?.[1] || null,
        rawPage: jobRawPage,
      })
      .where(eq(jobs.id, jobId));

    this.logger.info({ msg: 'Generating job description', jobId });
    const jobDescription = await this.getJobDescription(jobRawPage);
    this.logger.info({ msg: 'Job description generated', jobId });

    await this.db
      .update(jobs)
      .set({
        description: jobDescription,
      })
      .where(eq(jobs.id, jobId));

    return jobDescription;
  }

  private async extractJobInfo(jobUrl: string): Promise<string> {
    const url = `https://r.jina.ai/${jobUrl}`;
    const token = this.configService.get<string>('JINA_API_TOKEN');

    try {
      this.logger.info({ msg: 'Fetching job information', url });
      const { data } = await axios.get<string>(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return data;
    } catch (error: unknown) {
      this.logger.error({ msg: 'Error fetching job information', error });
      throw error;
    }
  }

  private async getJobCompatibility(
    resumeId: string,
    jobDescription: string,
  ): Promise<string> {
    const [{ rawContent: resumeContent }] = await this.db
      .select({
        id: resumes.id,
        rawContent: resumes.rawContent,
      })
      .from(resumes)
      .where(eq(resumes.id, resumeId));

    const provider = this.configService.get<AIProvider>('AI_PROVIDER');
    const llmParams = {
      model:
        provider === AIProvider.OPENAI
          ? 'gpt-4o-mini-2024-07-18'
          : 'claude-3-5-haiku-20241022',
      temperature: 0.2,
      maxTokens: 2000,
      prompt: `You are an advanced AI resume analyzer with expertise in evaluating resumes and providing constructive feedback. Your task is to analyze a given resume and job description, assign a compatibility score, and suggest points of strength and areas for improvement.

              Here is the job description you will be using as a reference:

              <job_description>
              ${jobDescription}
              </job_description>

              And here is the resume you will be analyzing:

              <resume>
              ${resumeContent}
              </resume>

              Please follow these steps to complete your analysis:

              1. Carefully read and analyze both the job description and the resume.

              2. Compare the resume to the job description, noting areas of alignment and discrepancy.

              3. Assign a compatibility score from 0 to 100, where 0 indicates no match and 100 indicates a perfect match.

              4. Identify specific strengths in the resume that align well with the job requirements.

              5. Identify areas where the user could improve to better match the job description. Put as action items inside the suggestions.

              6. Compile your findings into a JSON object with the following structure:
                {
                  "score": number,
                  "suggestions": string[]
                  ]
                }

              Before providing your final output, wrap your analysis inside <resume_analysis> tags. This should include:

              1. A list of matching skills and experiences identified in the resume.
              2. Your calculation of the compatibility score based on these matches.
              3. A brainstorming section for specific strengths and areas for improvement.

              After your analysis, provide only the JSON object as your final output. Do not include any additional text or explanations outside of the JSON structure.`,
    };

    const result = await this.aiService.generateText(llmParams);

    return result;
  }

  private async getJobDescription(rawDescription: string): Promise<string> {
    const provider = this.configService.get<AIProvider>('AI_PROVIDER');
    const llmParams = {
      model:
        provider === AIProvider.OPENAI
          ? 'gpt-4o-mini-2024-07-18'
          : 'claude-3-5-haiku-20241022',
      temperature: 0.2,
      maxTokens: 2000,
      prompt: `You are an advanced AI job description generator. Your task is to analyze a given raw job description and generate a clear, concise, and structured job description.
              Here is the raw job description you will be using as a reference:
              <raw_description>
              ${rawDescription}
              </raw_description>
              Please follow these steps to complete your analysis:
              1. Carefully read and analyze the raw job description.
              2. Extract key information such as job title, responsibilities, qualifications, and any other relevant details.
              3. Organize this information into a well-structured job description format.
              4. Ensure that the final output is clear, concise, and easy to understand.
              5. Provide the final job description in a text format containing only the job title, responsibilities, and qualifications.
              6. Do not include any additional text or explanations outside of the job description format.`,
    };

    const result = await this.aiService.generateText(llmParams);
    return result;
  }
}
