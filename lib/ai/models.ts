export const DEFAULT_CHAT_MODEL: string = 'gpt-4o';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable model for complex tasks',
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    description: 'Fast and efficient for most conversations',
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    description: 'Latest model with enhanced capabilities',
  },
];
