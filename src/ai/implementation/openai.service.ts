import { ConfigService } from '@nestjs/config';
import { AIRequest, AIService } from '../ai.service';

export class OpenAIService implements AIService {
  constructor(configService: ConfigService) {
    const apiKey = configService.getOrThrow<string>('AI_API_KEY');
    console.log(`OpenAI API Key: ${apiKey}`);
  }

  generateText(request: AIRequest): Promise<string> {
    console.log(request);
    throw new Error('Method not implemented.');
  }
}
