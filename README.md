🌱 GreenPrompt
GreenPrompt is a Chrome extension that optimizes user prompts in real time to reduce token usage, energy consumption, and API cost when interacting with Large Language Models (LLMs).
The extension integrates directly into Gemini, enabling one-click prompt refinement and transparent tracking of sustainability impact through a dedicated dashboard.

🎥 Demo

[![Watch the demo](https://img.youtube.com/vi/laMa_EsvABE/0.jpg)](https://youtu.be/laMa_EsvABE?si=B6usvMQF5xknjFVY)

📌 Problem
Large Language Models are widely used for productivity and automation, but prompts are often verbose or inefficient. At scale, unnecessary tokens translate to:
* Higher API costs
* Increased energy consumption
* Larger carbon footprint
* Reduced clarity in AI interactions
There is currently no built-in mechanism that helps users measure or optimize the sustainability impact of their AI usage.

💡 Solution
GreenPrompt introduces a real-time optimization layer that:
* Refines prompts to reduce token count
* Calculates estimated energy savings (Wh)
* Estimates cost savings ($)
* Translates technical metrics into understandable real-world equivalents
The system provides immediate feedback and long-term tracking through a sustainability dashboard.

🚀 Key Features

One-Click Prompt Optimization

* Injected directly into Gemini via Chrome Extension (Manifest V3)
* Rewrites user prompts to improve clarity and reduce verbosity
* Supports revert-to-original functionality

Impact Calculation Engine

For each optimization, GreenPrompt computes:

* Tokens saved
* Energy saved (Wh)
* Estimated API cost saved

Impact is accumulated using chrome.storage.local.

Sustainability Dashboard

The dashboard includes:

* Total Tokens Saved
* Total Energy Saved (Wh)
* Total Cost Saved
* Monthly trend visualization (area charts via Chart.js)
* Gamified sustainability levels (Seedling → Climate Champion)
* Real-world equivalents such as:
    * LED lighting hours powered
    * AI responses avoided
    * Laptop minutes powered

🧠 How It Works
Token Estimation
Token reduction is calculated by comparing the original and optimized prompt lengths.

Energy Estimation
Energy usage is estimated based on token count and an assumed energy-per-token constant. Savings are converted to watt-hours (Wh).

Cost Estimation
Cost savings are derived using a per-token API pricing approximation.

Real-World Translation
Energy savings are mapped to tangible equivalents, such as:
* LED lighting duration
* Laptop runtime
* AI responses avoided
This makes abstract energy metrics easier to understand.

🏗 Architecture
* Chrome Extension (Manifest V3)
    * Content Script (UI injection & prompt capture)
    * Background Script (API communication)
    * Dashboard (HTML/CSS/JS + Chart.js)
* Local Storage
    * Persistent tracking using chrome.storage.local
* Impact Engine
    * Client-side token and energy estimation logic

📊 Example Impact Metrics
For accumulated usage, the dashboard displays:
* Sustainability rank and progress toward next level
* Energy equivalents (e.g., LED hours powered)
* Monthly breakdown of impact
* Real-time progress visualization

🔮 Future Improvements
* Server-side analytics with MongoDB
* Organizational dashboards
* Model-specific energy benchmarks
* Enterprise sustainability reporting

🛠 Tech Stack
* JavaScript
* Chrome Extension APIs (Manifest V3)
* Chart.js
* HTML/CSS
* Gemini API
