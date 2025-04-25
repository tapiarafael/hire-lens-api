import { ConfigService } from '@nestjs/config';
import { AIRequest, AIService } from '../ai.service';
import OpenAI from 'openai';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

export class OpenAIService implements AIService {
  private readonly openai: OpenAI;
  constructor(
    configService: ConfigService,
    @InjectPinoLogger(OpenAIService.name)
    private readonly logger: PinoLogger,
  ) {
    const apiKey = configService.getOrThrow<string>('AI_API_KEY');
    this.openai = new OpenAI({ apiKey });
  }

  async generateText({
    model,
    prompt,
    maxTokens,
    systemInstructions,
    temperature,
  }: AIRequest): Promise<string> {
    this.logger.debug({
      msg: 'Calling OpenAI API',
      model,
      temperature,
      maxTokens,
      promptLength: prompt.length,
    });

    const response = await this.openai.responses.create({
      model,
      instructions: systemInstructions,
      input: prompt,
      max_output_tokens: maxTokens,
      temperature,
    });

    this.logger.debug({
      msg: 'Received OpenAI response',
      responseLength: response.output_text.length,
    });

    return response.output_text;
  }
}
