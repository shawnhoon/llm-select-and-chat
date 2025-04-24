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
  attachments?: Attachment[]; // Allow image attachments within selections
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
  extractFullDocument?: boolean;
  onSelectionCapture?: (selection: Selection) => Selection | void;
  onConversationUpdate?: (conversation: Conversation) => void;
  onError?: (error: Error) => void;
  /**
   * Callback that receives an API object with methods to control the component programmatically.
   * @param api Object containing methods to control the SelectChat component.
   */
  onInit?: (api: {
    setSelection: (selection: Selection) => void;
    clearSelection: () => void;
    focusInput: () => void;
    isReady: () => boolean;
  }) => void;
  /**
   * Callback that is triggered when the selection changes, either programmatically or through user interaction.
   * @param selection The current selection object, or null if selection is cleared.
   */
  onSelectionChange?: (selection: Selection | null) => void;
  /**
   * Callback that is triggered when a new message is received or sent.
   * @param message The message that was received or sent.
   */
  onMessage?: (message: Message) => void;
} 