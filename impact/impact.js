// impact.js

/**
 * Hackathon-safe token estimate.
 * Rule of thumb: 1 token ~= 4 characters (English average).
 */
export function estimateTokens(text) {
  const cleaned = (text || "").trim();
  if (!cleaned) return 0;
  return Math.ceil(cleaned.length / 4);
}

export function computeTokenStats(originalText, optimizedText) {
  const originalTokens = estimateTokens(originalText);
  const optimizedTokens = estimateTokens(optimizedText);

  const tokensSaved = Math.max(0, originalTokens - optimizedTokens);
  const reductionPct =
    originalTokens === 0 ? 0 : (tokensSaved / originalTokens) * 100;

  return { originalTokens, optimizedTokens, tokensSaved, reductionPct };
}

// Conservative placeholder estimates (label as "estimated" in UI)
export const ENERGY_WH_PER_1K_TOKENS = 0.1;
export const COST_USD_PER_1K_TOKENS = 0.002;

export function computeImpact(tokensSaved) {
  const energySavedWh = (tokensSaved / 1000) * ENERGY_WH_PER_1K_TOKENS;
  const costSavedUsd = (tokensSaved / 1000) * COST_USD_PER_1K_TOKENS;

  return { energySavedWh, costSavedUsd };
}

export function scaleImpact(tokensSaved, runs = 1000) {
  const safeRuns = Math.max(1, runs || 1);

  const scaledTokensSaved = tokensSaved * safeRuns;
  const energySavedWh = (scaledTokensSaved / 1000) * ENERGY_WH_PER_1K_TOKENS;
  const costSavedUsd = (scaledTokensSaved / 1000) * COST_USD_PER_1K_TOKENS;

  return { runs: safeRuns, tokensSaved: scaledTokensSaved, energySavedWh, costSavedUsd };
}

export function calculateImpactSummary(originalText, optimizedText, runs = 1000) {
  const { originalTokens, optimizedTokens, tokensSaved, reductionPct } =
    computeTokenStats(originalText, optimizedText);

  const { energySavedWh, costSavedUsd } = computeImpact(tokensSaved);

  return {
    originalTokens,
    optimizedTokens,
    tokensSaved,
    reductionPct,
    energySavedWh,
    costSavedUsd,
    scaled: scaleImpact(tokensSaved, runs),
  };
}

