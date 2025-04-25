import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider } from './types/ai-provider.enum';
import { AnthropicService } from './implementation/anthropic.service';
import { OpenAIService } from './implementation/openai.service';
import { PinoLogger } from 'nestjs-pino';

export const AI_SERVICE = Symbol('AI_SERVICE');

const aiProvider: Provider = {
  provide: AI_SERVICE,
  inject: [ConfigService, PinoLogger],
  useFactory: (configService: ConfigService, logger: PinoLogger) => {
    const provider = configService.get<AIProvider>('AI_PROVIDER');
    switch (provider) {
      case AIProvider.OPENAI:
        return new OpenAIService(configService, logger);
      case AIProvider.ANTHROPIC:
        return new AnthropicService(configService, logger);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  },
};
@Module({
  providers: [aiProvider],
  exports: [AI_SERVICE],
})
export class AiModule {}
