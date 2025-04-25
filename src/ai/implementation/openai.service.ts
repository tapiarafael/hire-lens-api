import { ConfigService } from '@nestjs/config';
import { AIRequest, AIService } from '../ai.service';
import OpenAI from 'openai';

export class OpenAIService implements AIService {
  private readonly openai: OpenAI;
  constructor(configService: ConfigService) {
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
    const response = await this.openai.responses.create({
      model,
      instructions: systemInstructions,
      input: prompt,
      max_output_tokens: maxTokens,
      temperature,
    });

    return response.output_text;
  }
}
