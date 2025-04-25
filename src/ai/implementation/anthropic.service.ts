import Anthropic from '@anthropic-ai/sdk';
import { AIRequest, AIService } from '../ai.service';
import { ConfigService } from '@nestjs/config';

export class AnthropicService implements AIService {
  private readonly anthropic: Anthropic;

  constructor(private readonly configService: ConfigService) {
    const apiKey = configService.getOrThrow<string>('AI_API_KEY');
    this.anthropic = new Anthropic({ apiKey });
  }

  async generateText({
    model,
    prompt,
    temperature,
    maxTokens,
    system,
  }: AIRequest): Promise<string> {
    const response = await this.anthropic.messages.create({
      model,
      system,
      max_tokens:
        maxTokens ||
        this.configService.getOrThrow<number>('AI_MAX_TOKENS_DEFAULT'),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
      temperature,
    });

    // This could be better handled. At the moment
    // is mostly to satisfy the type checker
    if (response.content[0].type !== 'text') {
      throw new Error('Invalid response type');
    }

    return response.content[0].text;
  }
}
