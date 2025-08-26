import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from 'ai';
import { openai } from '@ai-sdk/openai';
import {
  artifactModel,
  chatModel,
  reasoningModel,
  titleModel,
} from './models.test';
import { isTestEnvironment } from '../constants';

export const myProvider = isTestEnvironment
  ? customProvider({
    languageModels: {
      'chat-model': chatModel,
      'chat-model-reasoning': reasoningModel,
      'title-model': titleModel,
      'artifact-model': artifactModel,
    },
  })
  : customProvider({
    languageModels: {
      'gpt-4o': openai('gpt-4o'),
      'gpt-4.1-mini': openai('gpt-4o-mini'), // Map to available model until gpt-4.1-mini is released
      'gpt-4.1': openai('gpt-4o'), // Map to available model until gpt-4.1 is released
      'title-model': openai('gpt-4o-mini'),
      'artifact-model': openai('gpt-4o'),
    },
    imageModels: {
      'small-model': openai.image('dall-e-3'),
    },
  });
