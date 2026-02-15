console.log("GreenPrompt background running");

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemma-3-12b-it:generateContent";
const GEMINI_API_KEY = "";

const SYSTEM_INSTRUCTION =`
Rewrite the user prompt to be shorter, clearer, and specific.
Remove redundancy.
Keep original meaning.
Return ONLY JSON:
{"optimized_prompt": "..."}
`;

async function optimizePrompt(userPrompt) {
  try {
    if (!userPrompt || userPrompt.trim().length === 0) {
      return { error: "Empty prompt provided" };
    }

    const apiKey = GEMINI_API_KEY;
    if (!apiKey) {
      return { error: "API key not configured" };
    }

    const result = await callGeminiAPI(userPrompt, apiKey);
    if (result.error) {
      return { error: result.error };
    }

    const parsed = parseJSON(result.text);
    if (parsed.error) {
      return { error: parsed.error };
    }

    return parsed;
  } catch (error) {
    return { error: error.message };
  }
}

async function callGeminiAPI(userPrompt, apiKey) {
  try {
    const url = `${GEMINI_API_URL}?key=${apiKey}`;

    const fullPrompt = `${SYSTEM_INSTRUCTION}\n\nUser prompt to optimize: ${userPrompt}`;

    const response = await fetch(url, {
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
          temperature:0.1,  
          maxOutputTokens: 150
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || response.statusText;
      return { error: `API error: ${errorMsg}`, text: null };
    }

    const responseData = await response.json();
    const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return { error: "No response from API", text: null };
    }

    return { error: null, text };
  } catch (error) {
    return { error: `Network error: ${error.message}`, text: null };
  }
}

function parseJSON(responseText) {
  try {
    const parsed = JSON.parse(responseText);

    if (parsed.optimized_prompt && typeof parsed.optimized_prompt === "string") {
      return parsed;
    }
  } catch (e) {
    // Fall through to extraction strategy.
  }

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      if (parsed.optimized_prompt && typeof parsed.optimized_prompt === "string") {
        return parsed;
      }
    }
  } catch (e) {
    // Fall through to error.
  }

  return { error: "Failed to parse API response as JSON" };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "openDashboard") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("dashboard.html")
    });
    return;
  }

  if (request.action === "optimizePrompt") {
    optimizePrompt(request.prompt)
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ error: error.message }));

    return true;
  }
});