export interface AIRequest {
  prompt: string;
  model: string;
  temperature?: number;
  systemInstructions?: string;
  maxTokens?: number;
}

export interface AIService {
  generateText(request: AIRequest): Promise<string>;
}
