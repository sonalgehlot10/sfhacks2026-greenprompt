// GreenPrompt Content Script
// Injects UI into Gemini and handles DOM detection

console.log('GreenPrompt: Content script loaded');

// State management
let isOptimized = false;
let originalPrompt = '';
let optimizedPrompt = '';
let optimizationData = null;

// Initialize the extension
function initializeExtension() {
  console.log('GreenPrompt: Initializing extension');
  setupMutationObserver();
  injectButtonNearInput();
}

// Setup MutationObserver to detect changes
function setupMutationObserver() {
  const config = {
    childList: true,
    subtree: true,
    attributes: true
  };

  const observer = new MutationObserver((mutations) => {
    // Check if we need to re-inject the button
    if (!document.querySelector('#greenprompt-icon-btn')) {
      console.log('GreenPrompt: Button missing, re-injecting');
      injectButtonNearInput();
    }
  });

  observer.observe(document.body, config);
  console.log('GreenPrompt: MutationObserver setup complete');
}

// Inject button near the input
function injectButtonNearInput() {
  // Check if button already exists
  if (document.querySelector('#greenprompt-icon-btn')) {
    return;
  }

  console.log('GreenPrompt: Injecting button near input');
  
  // Find the contenteditable input
  const inputElement = document.querySelector('div[contenteditable="true"]');
  if (!inputElement) {
    console.log('GreenPrompt: Input not found yet');
    return;
  }

  // Create toggle button
  const btn = document.createElement('button');
  btn.id = 'greenprompt-icon-btn';
  btn.textContent = '🌱';
  btn.title = 'Toggle GreenPrompt Optimization';
  btn.dataset.optimized = 'false';
  btn.style.cssText = `
    position: absolute;
    width: 36px;
    height: 36px;
    min-width: 36px;
    min-height: 36px;
    border-radius: 50%;
    border: 2px solid #34a853;
    background: white;
    color: #34a853;
    font-size: 18px;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(52, 168, 83, 0.3);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    margin: 0;
    line-height: 1;
    text-align: center;
    z-index: 9999;
  `;
  
  btn.addEventListener('mouseenter', () => {
    if (btn.dataset.optimized === 'true') {
      btn.style.background = 'linear-gradient(135deg, #1e8449 0%, #166534 100%)';
    } else {
      btn.style.background = '#f0fdf4';
    }
  });
  
  btn.addEventListener('mouseleave', () => {
    if (btn.dataset.optimized === 'true') {
      btn.style.background = 'linear-gradient(135deg, #34a853 0%, #1e8449 100%)';
    } else {
      btn.style.background = 'white';
    }
  });
  
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    handleToggleClick(btn);
  });
  
  // Get input's parent and position button relatively
  const inputParent = inputElement.parentElement;
  
  // Make parent relatively positioned if not already
  if (getComputedStyle(inputParent).position === 'static') {
    inputParent.style.position = 'relative';
  }
  
  // Position button at bottom-right of input
  btn.style.bottom = '-4px';
  btn.style.right = '8px';
  
  inputParent.appendChild(btn);
  console.log('GreenPrompt: Button injected near input');
}

// Handle toggle button click
function handleToggleClick(btn) {
  console.log('GreenPrompt: Toggle button clicked');
  
  // Get the contenteditable input
  const inputElement = document.querySelector('div[contenteditable="true"]');
  
  if (!inputElement) {
    showToast('⚠️ Input not found');
    return;
  }

  if (isOptimized) {
    // Revert to original
    inputElement.textContent = originalPrompt;
    isOptimized = false;
    
    // Update button to inactive state
    btn.dataset.optimized = 'false';
    btn.style.background = 'white';
    btn.style.borderColor = '#34a853';
    btn.style.color = '#34a853';
    btn.title = 'Toggle GreenPrompt Optimization';
    
    showToast('✅ Reverted to original');
  } else {
    // Get current prompt text
    const promptText = inputElement.textContent.trim();
    
    if (!promptText) {
      return; // Silently do nothing if no text
    }

    // Store original
    originalPrompt = promptText;

    // Calculate optimization
    optimizationData = calculateOptimization(promptText);
    optimizedPrompt = optimizationData.optimizedPrompt;

    // Apply optimization
    inputElement.textContent = optimizedPrompt;
    isOptimized = true;

    // Update button to active state
    btn.dataset.optimized = 'true';
    btn.style.background = 'linear-gradient(135deg, #34a853 0%, #1e8449 100%)';
    btn.style.borderColor = '#34a853';
    btn.style.color = 'white';
    btn.title = 'Click to revert to original';

    // Save optimization stats
    saveOptimization(optimizationData);

    // Send JSON to API
    const payload = {
      original_prompt: originalPrompt,
      optimized_prompt: optimizedPrompt,
      metrics: {
        original_tokens: optimizationData.originalTokens,
        optimized_tokens: optimizationData.optimizedTokens,
        tokens_saved: optimizationData.reduction,
        clarity_score: optimizationData.afterClarity,
        energy_saved: optimizationData.energySaved
      }
    };

    // Send to your backend (update the URL as needed)
    fetch('http://localhost:5000/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.log('GreenPrompt: API call sent', err));

    showToast(`✨ Optimized! Saved ${optimizationData.reduction} tokens`);
  }
}

// Calculate optimization metrics
function calculateOptimization(prompt) {
  // Simulate optimization (in real scenario, this would call an API)
  const optimizedPrompt = optimizePromptText(prompt);
  
  // Use the impact calculation library from teammate
  const impactData = window.GreenPromptImpact.calculateImpactSummary(prompt, optimizedPrompt, 1);
  
  const beforeClarity = calculateClarity(prompt);
  const afterClarity = calculateClarity(optimizedPrompt);
  const clarityImprovement = afterClarity - beforeClarity;
  
  return {
    originalPrompt: prompt,
    optimizedPrompt: optimizedPrompt,
    originalTokens: impactData.originalTokens,
    optimizedTokens: impactData.optimizedTokens,
    reduction: impactData.tokensSaved,
    reductionPercentage: impactData.reductionPct,
    beforeClarity: beforeClarity,
    afterClarity: afterClarity,
    clarityImprovement: clarityImprovement,
    energySaved: impactData.energySavedWh.toFixed(4),
    costSaved: impactData.costSavedUsd.toFixed(6),
    millionTokens: (impactData.tokensSaved * 10000 / 1000000).toFixed(1)
  };
}

// Estimate token count (rough estimate: ~4 chars per token)
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Calculate clarity score (0-100)
function calculateClarity(text) {
  const words = text.split(/\s+/).length;
  const sentences = text.split(/[.!?]+/).length;
  const avgWordLength = text.length / words;
  const avgWordsPerSentence = words / sentences;
  
  let score = 50;
  
  // Prefer moderate word length (5-7 chars)
  if (avgWordLength >= 5 && avgWordLength <= 7) {
    score += 15;
  }
  
  // Prefer moderate sentence length (10-20 words)
  if (avgWordsPerSentence >= 10 && avgWordsPerSentence <= 20) {
    score += 15;
  }
  
  // Bonus for punctuation use
  if (text.includes(':') || text.includes('-') || text.includes(',')) {
    score += 10;
  }
  
  // Penalty for very long sentences
  if (avgWordsPerSentence > 30) {
    score -= 10;
  }
  
  return Math.min(100, Math.max(0, score));
}

// Optimize prompt text
function optimizePromptText(prompt) {
  // Simple optimization strategies
  let optimized = prompt
    .replace(/\s+/g, ' ') // Remove extra spaces
    .replace(/\b(very|really|extremely|quite|just)\s+/gi, '') // Remove intensifiers
    .replace(/\b(please|kindly|would you mind|could you)\s+/gi, '') // Remove politeness markers
    .replace(/\b(like|you know|honestly|basically)\s+/gi, '') // Remove filler words
    .replace(/\?\s*$/, '?'); // Ensure single punctuation at end
  
  // Split into sentences and remove redundant ones
  const sentences = optimized.split(/(?<=[.!?])\s+/);
  const uniqueSentences = [];
  const seen = new Set();
  
  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase().trim();
    if (!seen.has(normalized) && sentence.trim()) {
      uniqueSentences.push(sentence.trim());
      seen.add(normalized);
    }
  }
  
  optimized = uniqueSentences.join(' ').trim();
  
  return optimized;
}

// Save optimization to storage
function saveOptimization(data) {
  chrome.storage.local.get(['optimizations'], (result) => {
    const optimizations = result.optimizations || [];
    
    optimizations.push({
      timestamp: Date.now(),
      tokensSaved: data.reduction,
      energySaved: parseFloat(data.energySaved),
      clarityImprovement: data.clarityImprovement,
      originalTokens: data.originalTokens,
      optimizedTokens: data.optimizedTokens
    });
    
    chrome.storage.local.set({ optimizations }, () => {
      console.log('GreenPrompt: Optimization saved');
      
      // Notify popup to refresh
      chrome.runtime.sendMessage({ type: 'STATS_UPDATED' });
    });
  });
}

// Show toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.id = 'greenprompt-toast';
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: linear-gradient(135deg, #34a853 0%, #1e8449 100%);
    color: white;
    padding: 16px 24px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 600;
    animation: toastSlideIn 0.3s ease-out;
  `;
  toast.textContent = message;
  
  // Add animation
  if (!document.querySelector('#greenprompt-toast-style')) {
    const style = document.createElement('style');
    style.id = 'greenprompt-toast-style';
    style.innerHTML = `
      @keyframes toastSlideIn {
        from {
          opacity: 0;
          transform: translateX(100px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes toastSlideOut {
        from {
          opacity: 1;
          transform: translateX(0);
        }
        to {
          opacity: 0;
          transform: translateX(100px);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  // Remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'toastSlideOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Start extension when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
}

console.log('GreenPrompt: Content script ready');
