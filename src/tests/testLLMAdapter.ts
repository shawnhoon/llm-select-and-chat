import { LLMAdapterFactory } from '../components/LLMProviderAdapter';
import { LLMProvider, Message } from '../types';

/**
 * Simple test script to demonstrate the use of LLM adapters
 */
async function testLLMAdapters() {
  // Sample messages
  const messages: Message[] = [
    {
      id: '1',
      role: 'user',
      content: 'Tell me about the solar system in 3 sentences.',
      timestamp: Date.now()
    }
  ];

  // OpenAI provider config - replace with your API key
  const openaiProvider: LLMProvider = {
    apiKey: 'your-openai-api-key-here', // Replace with your actual API key
    type: 'openai',
    defaultParams: {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 150
    }
  };

  // Gemini provider config - replace with your API key
  const geminiProvider: LLMProvider = {
    apiKey: 'your-gemini-api-key-here', // Replace with your actual API key
    type: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
    defaultParams: {
      model: 'gemini-1.5-flash',
      temperature: 0.7,
      maxTokens: 150
    }
  };

  console.log('🧪 Testing LLM Adapters');
  console.log('------------------------');

  // Test OpenAI adapter if API key is provided
  if (openaiProvider.apiKey !== 'your-openai-api-key-here') {
    try {
      console.log('📝 Testing OpenAI text completion...');
      const openaiAdapter = LLMAdapterFactory.createAdapter(openaiProvider);
      const openaiResponse = await openaiAdapter.sendMessages(messages, null);
      console.log('✅ OpenAI Response:');
      console.log(openaiResponse);
      console.log('\n');

      // Test structured JSON response
      console.log('🔍 Testing OpenAI structured JSON response...');
      const planetSchema = {
        type: 'json',
        schema: {
          type: 'object',
          properties: {
            planets: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  diameter: { type: 'number' },
                  interestingFact: { type: 'string' }
                }
              }
            }
          }
        }
      };
      
      const jsonMessages: Message[] = [
        {
          id: '2',
          role: 'user',
          content: 'List the 3 smallest planets in our solar system with their diameter in km and one interesting fact about each.',
          timestamp: Date.now()
        }
      ];

      const openaiJsonResponse = await openaiAdapter.sendMessagesForStructuredResponse(
        jsonMessages,
        null,
        planetSchema
      );
      console.log('✅ OpenAI JSON Response:');
      console.log(JSON.stringify(openaiJsonResponse, null, 2));
      console.log('\n');
    } catch (error) {
      console.error('❌ OpenAI Test Error:', error);
    }
  } else {
    console.log('⚠️ Skipping OpenAI tests. Please add your OpenAI API key to run these tests.');
  }

  // Test Gemini adapter if API key is provided
  if (geminiProvider.apiKey !== 'your-gemini-api-key-here') {
    try {
      console.log('📝 Testing Gemini text completion...');
      const geminiAdapter = LLMAdapterFactory.createAdapter(geminiProvider);
      const geminiResponse = await geminiAdapter.sendMessages(messages, null);
      console.log('✅ Gemini Response:');
      console.log(geminiResponse);
      console.log('\n');

      // Test structured JSON response
      console.log('🔍 Testing Gemini structured JSON response...');
      const moonSchema = {
        type: 'json',
        schema: {
          type: 'object',
          properties: {
            moons: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  planet: { type: 'string' },
                  interestingFact: { type: 'string' }
                }
              }
            }
          }
        }
      };
      
      const jsonMessages: Message[] = [
        {
          id: '3',
          role: 'user',
          content: 'List 3 interesting moons in our solar system, which planet they orbit, and one interesting fact about each.',
          timestamp: Date.now()
        }
      ];

      const geminiJsonResponse = await geminiAdapter.sendMessagesForStructuredResponse(
        jsonMessages,
        null,
        moonSchema
      );
      console.log('✅ Gemini JSON Response:');
      console.log(JSON.stringify(geminiJsonResponse, null, 2));
      console.log('\n');
    } catch (error) {
      console.error('❌ Gemini Test Error:', error);
    }
  } else {
    console.log('⚠️ Skipping Gemini tests. Please add your Gemini API key to run these tests.');
  }
  
  console.log('------------------------');
  console.log('🏁 Testing completed');
}

// Run the test
testLLMAdapters().catch(console.error);

// Export the test function
export { testLLMAdapters }; 