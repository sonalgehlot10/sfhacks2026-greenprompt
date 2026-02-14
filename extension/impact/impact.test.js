import { calculateImpactSummary } from "./impact.js";

const original =
  "Please carefully analyze the following and provide an extremely detailed explanation including all steps, edge cases, and multiple examples. " +
  "Also explain assumptions, provide citations if applicable, and format the response with headings, bullet points, and a conclusion.";

const optimized =
  "Analyze the following and explain clearly with key steps, edge cases, and one example. Use headings and bullets.";

console.log(calculateImpactSummary(original, optimized, 1000));
