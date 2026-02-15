console.log("[Optimizer] Gemma 3 optimized version loaded");

// ============================================================================
// CONFIG
// ============================================================================

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemma-3-12b-it:generateContent";

const GEMINI_API_KEY = "";

const SYSTEM_INSTRUCTION = `
Rewrite the user prompt to be shorter, clearer, and specific.
Remove redundancy.
Keep original meaning.
Return ONLY JSON:
{"optimized_prompt": "..."}
`;

// ============================================================================
// MAIN OPTIMIZER
// ============================================================================

async function optimizePrompt(userPrompt) {
  try {
    if (!userPrompt || !userPrompt.trim()) {
      return { error: "Empty prompt provided" };
    }

    if (!GEMINI_API_KEY) {
      return { error: "API key not configured" };
    }

    const result = await callGemmaAPI(userPrompt, GEMINI_API_KEY);
    if (result.error) return { error: result.error };

    return parseJSON(result.text);

  } catch (error) {
    return { error: error.message };
  }
}

// ============================================================================
// GEMMA CALL
// ============================================================================

async function callGemmaAPI(userPrompt, apiKey) {
  try {
    const fullPrompt =
      `${SYSTEM_INSTRUCTION}\nUser prompt:\n${userPrompt}`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: fullPrompt }]
          }
        ],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 150
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || response.statusText;
      return { error: `API error: ${errorMsg}`, text: null };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return { error: "No response from API", text: null };
    }

    return { error: null, text };

  } catch (error) {
    return { error: `Network error: ${error.message}`, text: null };
  }
}

// ============================================================================
// JSON PARSER (Stable)
// ============================================================================

function parseJSON(responseText) {
  try {
    const parsed = JSON.parse(responseText);
    if (parsed.optimized_prompt) return parsed;
  } catch (_) {}

  const match = responseText.match(/\{[\s\S]*?\}/);
  if (match) {
    try {
      const parsed = JSON.parse(match[0]);
      if (parsed.optimized_prompt) return parsed;
    } catch (_) {}
  }

  return { error: "Failed to parse API response as JSON" };
}

// ============================================================================
// MESSAGE LISTENER
// ============================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "optimizePrompt") {
    optimizePrompt(request.prompt)
      .then(sendResponse)
      .catch((err) => sendResponse({ error: err.message }));
    return true;
  }
});