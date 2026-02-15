console.log("GreenPrompt background running");

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemma-3-12b-it:generateContent";
const GEMINI_API_KEY = "";

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
          temperature: 0.3,
          maxOutputTokens: 500
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
