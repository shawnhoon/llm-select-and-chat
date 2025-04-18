import { ThemeProps } from './utils/theme';

// Check if the file exists first and create it if it doesn't
/**
 * Message represents a single message in a conversation
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  selection?: Selection; // Store selection context with messages
  attachments?: Attachment[];
}

export interface Conversation {
  id: string;
  title?: string;
  messages: Message[];
  annotations?: Annotation[];
  attachments?: Attachment[];
  context?: Selection;
  createdAt: number;
  updatedAt: number;
}

export interface Selection {
  text: string;
  contextBefore?: string;
  contextAfter?: string;
  url?: string;
  location?: string;
  fullDocument?: string;
}

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  url?: string;
  data?: Blob | string;
  mimeType?: string;
}

export interface Annotation {
  id: string;
  text: string;
  startOffset: number;
  endOffset: number;
  type: 'highlight' | 'comment' | 'correction';
  comment?: string;
}

export interface LLMProvider {
  type: 'openai' | 'gemini' | 'claude' | 'custom';
  id?: string;
  name?: string;
  apiKey: string;
  baseUrl?: string;
  models?: Array<{ id: string; name: string; maxTokens: number }>;
  defaultParams: {
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  systemPrompt?: {
    template: string;
    useSearch?: boolean;
    contextLevels?: {
      primary?: boolean;
      immediate?: boolean;
      local?: boolean;
      broader?: boolean;
      conversational?: boolean;
      external?: boolean;
    };
  };
}

export interface UserPreferences {
  showTimestamps?: boolean;
  darkMode?: boolean;
  fontSize?: 'small' | 'medium' | 'large';
  useSystemTheme?: boolean;
  codeHighlighting?: boolean;
  maxContextLength?: number;
  historyLength?: number;
  theme?: 'light' | 'dark' | 'system';
  selectedProvider?: string;
  position?: string;
}

export interface SelectChatProps {
  apiKey?: string;
  provider?: LLMProvider;
  theme?: 'light' | 'dark' | 'system';
  customTheme?: ThemeProps | Partial<ThemeProps>;
  userPreferences?: UserPreferences;
  systemPromptConfig?: string | {
    template: string;
    useSearch?: boolean;
    contextLevels?: {
      primary?: boolean;
      immediate?: boolean;
      local?: boolean;
      broader?: boolean;
      conversational?: boolean;
      external?: boolean;
    };
  };
  onSelectionCapture?: (selection: Selection) => void;
  onConversationUpdate?: (conversation: Conversation) => void;
  onError?: (error: Error) => void;
} 