/**
 * PERSON 2: SIMPLE PROMPT OPTIMIZER - GEMMA 3 FIXED VERSION
 * 
 * Works with Gemma 3 by putting system instruction in user message
 */

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemma-3-12b-it:generateContent';

const SYSTEM_INSTRUCTION = `You are an expert prompt optimizer.

Your task: Optimize the user's prompt for clarity and efficiency.

Rules:
1. Keep the exact same meaning
2. Remove unnecessary words
3. Make it clearer and more concise
4. Keep all important details

CRITICAL: Output ONLY valid JSON. No markdown, no explanations, no extra text.
Return EXACTLY this structure:
{
  "optimized_prompt": "the optimized version here"
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