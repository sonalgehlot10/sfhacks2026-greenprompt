/**
 * PERSON 2: SIMPLE PROMPT OPTIMIZER - GEMMA 3 FIXED VERSION
 * 
 * Works with Gemma 3 by putting system instruction in user message
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-3-12b-it:generateContent';

const SYSTEM_INSTRUCTION = `You are a world-class prompt engineer and technical writer.

Your mission: Transform ambiguous, verbose user prompts into crystal-clear, execution-ready instructions that maximize clarity while minimizing token waste.

OPTIMIZATION PRINCIPLES:

Clarity Enhancement:
- Replace vague language with specific, measurable terms
- Define what "success" looks like if ambiguous
- Highlight constraints and edge cases
- Use active voice exclusively
- Order information by importance/dependency

Token Efficiency:
- Eliminate redundancy without losing meaning
- Remove meta-commentary and self-referential language
- Consolidate related ideas
- Use precise terminology (avoid circumlocution)

Structure Improvement:
- Add step numbers for sequential tasks
- Use bullet points for lists or options
- Group related requirements together
- Separate "what" from "how" when needed

Examples of fixes:
✗ "I was wondering if you could maybe help me understand how to write better prompts?"
✓ "Explain prompt engineering best practices with 5 concrete examples"

✗ "Could you possibly tell me about machine learning? I'm kind of new to it."
✓ "Introduce machine learning with 3 key concepts, assuming no prior knowledge"

CRITICAL: Output ONLY valid JSON. No explanations, no code blocks, no markdown.
{
  "optimized_prompt": "Optimized instruction here"
}`;

// ============================================================================
// MAIN FUNCTION
// ============================================================================

async function optimizePrompt(userPrompt) {
  try {
    if (!userPrompt || userPrompt.trim().length === 0) {
      return { error: 'Empty prompt provided' };
    }

    console.log('[Optimizer] Processing prompt...');

    // Get API key from storage
    const apiKey = await getApiKeyFromStorage();
    if (!apiKey) {
      return { error: 'API key not configured' };
    }

    console.log('[Optimizer] API key found');

    // Call Gemini API directly (REST API)
    const result = await callGeminiAPI(userPrompt, apiKey);
    
    if (result.error) {
      return { error: result.error };
    }

    // Parse JSON response
    const parsed = parseJSON(result.text);
    
    if (parsed.error) {
      return { error: parsed.error };
    }

    console.log('[Optimizer] Success');
    return parsed;

  } catch (error) {
    console.error('[Optimizer] Error:', error.message);
    return { error: error.message };
  }
}

// ============================================================================
// Get API Key from Storage
// ============================================================================

function getApiKeyFromStorage() {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get('geminiApiKey', (result) => {
        if (chrome.runtime.lastError) {
          console.error('[Optimizer] Storage error:', chrome.runtime.lastError);
          resolve('');
        } else {
          const apiKey = result.geminiApiKey || '';
          resolve(apiKey);
        }
      });
    } catch (error) {
      console.error('[Optimizer] Exception reading storage:', error);
      resolve('');
    }
  });
}

// ============================================================================
// Call Gemma 3 API
// ============================================================================

async function callGeminiAPI(userPrompt, apiKey) {
  try {
    const url = `${GEMINI_API_URL}?key=${apiKey}`;

    console.log('[Optimizer] Calling Gemma 3 API...');

    // For Gemma 3: Put system instruction in user message (not systemInstruction field)
    const fullPrompt = `${SYSTEM_INSTRUCTION}\n\nUser prompt to optimize: ${userPrompt}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: fullPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 500
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || response.statusText;
      console.error('[Optimizer] API error:', errorMsg);
      return { error: `API error: ${errorMsg}`, text: null };
    }

    const responseData = await response.json();
    const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      console.error('[Optimizer] No text in response');
      return { error: 'No response from API', text: null };
    }

    console.log('[Optimizer] API call successful');
    console.log('[Optimizer] Response:', text.substring(0, 200));
    
    return { error: null, text };

  } catch (error) {
    console.error('[Optimizer] Network error:', error.message);
    return { error: `Network error: ${error.message}`, text: null };
  }
}

// ============================================================================
// Parse JSON Response
// ============================================================================

function parseJSON(responseText) {
  // Strategy 1: Direct parse
  try {
    const parsed = JSON.parse(responseText);
    
    if (parsed.optimized_prompt && typeof parsed.optimized_prompt === 'string') {
      console.log('[Optimizer] JSON parsed successfully');
      return parsed;
    }
  } catch (e) {
    console.log('[Optimizer] Direct parse failed, trying extraction...');
  }

  // Strategy 2: Extract JSON from markdown
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      
      if (parsed.optimized_prompt && typeof parsed.optimized_prompt === 'string') {
        console.log('[Optimizer] JSON extracted from markdown');
        return parsed;
      }
    }
  } catch (e) {
    console.log('[Optimizer] JSON extraction failed');
  }

  console.error('[Optimizer] JSON parse failed. Response:', responseText.substring(0, 200));
  return { error: 'Failed to parse API response as JSON' };
}

// ============================================================================
// Message Listener
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'optimizePrompt') {
    console.log('[Optimizer] Request received');

    optimizePrompt(request.prompt)
      .then((result) => {
        console.log('[Optimizer] Sending response');
        sendResponse(result);
      })
      .catch((error) => {
        console.error('[Optimizer] Error:', error);
        sendResponse({ error: error.message });
      });

    return true;
  }
});

console.log('[Optimizer] Background script loaded (Gemma 3 version)');
