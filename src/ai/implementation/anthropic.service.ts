import Anthropic from '@anthropic-ai/sdk';
import { AIRequest, AIService } from '../ai.service';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

export class AnthropicService implements AIService {
  private readonly anthropic: Anthropic;

  constructor(
    private readonly configService: ConfigService,
    @InjectPinoLogger(AnthropicService.name)
    private readonly logger: PinoLogger,
  ) {
    const apiKey = configService.getOrThrow<string>('AI_API_KEY');
    this.anthropic = new Anthropic({ apiKey });
  }

  async generateText({
    model,
    prompt,
    temperature,
    maxTokens,
    systemInstructions,
  }: AIRequest): Promise<string> {
    this.logger.debug({
      msg: 'Calling Anthropic API',
      model,
      temperature,
      maxTokens,
      promptLength: prompt.length,
    });

    const response = await this.anthropic.messages.create({
      model,
      system: systemInstructions,
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
      this.logger.error({
        msg: 'Invalid response type from Anthropic API',
        response,
      });
      throw new Error('Invalid response type');
    }

    this.logger.debug({
      msg: 'Received Anthropic response',
      responseLength: response.content[0].text.length,
    });

    return response.content[0].text;
  }
}
