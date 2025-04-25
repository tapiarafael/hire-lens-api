import { Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIProvider } from './types/ai-provider.enum';
import { AnthropicService } from './implementation/anthropic.service';
import { OpenAIService } from './implementation/openai.service';

const AI_SERVICE = Symbol('AI_SERVICE');

const aiProvider: Provider = {
  provide: AI_SERVICE,
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const provider = configService.get<AIProvider>('AI_PROVIDER');
    switch (provider) {
      case AIProvider.OPENAI:
        return new OpenAIService(configService);
      case AIProvider.ANTHROPIC:
        return new AnthropicService(configService);
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
