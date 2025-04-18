# Using Custom System Prompts with SelectChat

The SelectChat component allows you to customize how the AI assistant interprets and responds to text selections through configurable system prompts. This guide explains how to use this feature effectively.

## Overview

A system prompt provides instructions to the language model about how it should respond to the user's input. In SelectChat, system prompts are particularly focused on how the AI should interpret and analyze selected text with its surrounding context.

## Usage Options

### 1. Using a Named Template

The simplest approach is to use one of the built-in templates:

```jsx
<SelectChat
  apiKey="your-api-key"
  systemPromptConfig="standard" // Use the built-in 'standard' template
/>
```

Available built-in templates:
- `"standard"`: Comprehensive context analysis with detailed guidelines
- `"concise"`: Shorter, more focused instructions for concise responses
- `"code_analysis"`: Specialized template for analyzing code selections

### 2. Custom Inline Template

You can provide a custom template directly:

```jsx
<SelectChat
  apiKey="your-api-key"
  systemPromptConfig={{
    template: `
      Analyze the selected text and respond to the user's question.
      Focus on the specific content the user has selected.
      Be concise and direct in your responses.
      ${useSearch ? 'Use search to verify factual claims when appropriate.' : ''}
    `,
    useSearch: false,
    contextLevels: {
      primary: true,
      immediate: true,
      local: false,
      broader: false,
      conversational: true
    }
  }}
/>
```

### 3. Loading from Configuration File

For more complex applications, you can load system prompts from a configuration file:

```jsx
import { useState, useEffect } from 'react';
import { SelectChat } from 'llm-select-and-chat';

function App() {
  const [systemPrompt, setSystemPrompt] = useState(null);
  
  useEffect(() => {
    // Load system prompt configuration from JSON file
    fetch('/config/system-prompts.json')
      .then(response => response.json())
      .then(data => {
        setSystemPrompt(data.standard); // Use a specific prompt from the config
      });
  }, []);
  
  return (
    <SelectChat
      apiKey="your-api-key"
      systemPromptConfig={systemPrompt}
    />
  );
}
```

## Template Variables

The system prompt templates support special variables that allow for conditional content:

### useSearch Variable

The `useSearch` variable controls whether the system prompt includes instructions for using web search:

```
${useSearch ? `
  - Always search for factual verification
  - Cite your sources using [1], [2], etc.
` : 'Stick to the content from the document only.'}
```

### Context Level Variables

Context level variables control which levels of context the AI should use:

```
${primary ? `Focus primarily on the selected text.` : ''}
${immediate ? `Use immediate surrounding context to clarify meaning.` : ''}
${broader ? `Consider the broader document when necessary.` : ''}
```

## Configuration Options

The `systemPromptConfig` prop accepts:

1. A string with a template name (e.g., `"standard"`, `"concise"`)
2. An object with the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `template` | string | The prompt template text with optional template variables |
| `useSearch` | boolean | Whether to enable search instructions in the template |
| `contextLevels` | object | Configuration for different context levels |

The `contextLevels` object can include:

| Level | Description |
|-------|-------------|
| `primary` | The specifically selected text |
| `immediate` | Text immediately before and after selection |
| `local` | The surrounding paragraph or section |
| `broader` | The entire document or chapter |
| `conversational` | Previous conversation history |
| `external` | External information from search |

## Examples

### Fact-Checking System Prompt

```jsx
<SelectChat
  systemPromptConfig={{
    template: `
      You are analyzing selected text for factual accuracy.
      1. First, understand what the selected text is claiming.
      2. Use search to verify any factual claims.
      3. Present the facts as stated in the selected text.
      4. Compare with the most current information from search.
      5. Clearly indicate any discrepancies or updates.
      Always cite your sources using [1], [2] format.
    `,
    useSearch: true,
    contextLevels: {
      primary: true,
      immediate: true,
      external: true
    }
  }}
/>
```

### Literary Analysis Prompt

```jsx
<SelectChat
  systemPromptConfig={{
    template: `
      You are a literary analysis assistant.
      When the user selects text from a literary work:
      1. Analyze the themes, motifs, and literary devices
      2. Consider the text in context of the surrounding passages
      3. Provide insights into character development and symbolism
      4. Relate to broader literary movements when relevant
      Be specific and reference the text directly in your analysis.
    `,
    useSearch: false,
    contextLevels: {
      primary: true,
      immediate: true,
      local: true,
      broader: true
    }
  }}
/>
```

## Best Practices

1. **Be specific**: Provide clear instructions about how the AI should analyze the selected text
2. **Consider context levels**: Enable only the context levels needed for your use case
3. **Use template variables**: Leverage conditional sections to create flexible prompts
4. **Test with users**: Refine your system prompts based on actual user interactions
5. **Focus on the task**: Tailor prompts to your specific application domain

By customizing system prompts, you can significantly improve the relevance and quality of AI responses to selected text in your application. 