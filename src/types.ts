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
  createdAt: number;
  updatedAt: number;
}

export interface Selection {
  text: string;
  contextBefore?: string;
  contextAfter?: string;
  url?: string;
  location?: string;
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
  apiKey: string;
  baseUrl?: string;
  defaultParams: {
    model: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
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
}

export interface SelectChatProps {
  apiKey?: string;
  provider?: LLMProvider;
  theme?: 'light' | 'dark' | 'system';
  userPreferences?: UserPreferences;
  onSelectionCapture?: (selection: Selection) => void;
  onConversationUpdate?: (conversation: Conversation) => void;
  onError?: (error: Error) => void;
} 