console.log("GreenPrompt content script loaded");

function injectButton() {
    const editor = document.querySelector('.ql-editor');

    if (!editor) return;

    // Prevent duplicate button
    if (document.getElementById('greenprompt-btn')) return;

    const button = document.createElement('button');
    button.id = 'greenprompt-btn';
    button.innerText = '🌱 Optimize';
    button.style.marginLeft = '10px';
    button.style.padding = '6px 10px';
    button.style.borderRadius = '6px';
    button.style.border = 'none';
    button.style.cursor = 'pointer';
    button.style.backgroundColor = '#2ecc71';
    button.style.color = 'white';
    button.style.fontWeight = 'bold';

    button.addEventListener("click", () => {
        const editor = document.querySelector('.ql-editor');
        if (!editor) return;

        const originalText = editor.innerText;

        const optimizedText = "Short version."; // temporary placeholder

        const impact = window.GreenPromptImpact.calculateImpactSummary(
            originalText,
            optimizedText,
            1000
        );

        console.log("Saving impact:", impact);

        chrome.storage.local.get(["totalTokens", "totalEnergy", "totalCost"], (data) => {
            console.log("Previous totals:", data);

            const newTotals = {
                totalTokens: (data.totalTokens || 0) + impact.tokensSaved,
                totalEnergy: (data.totalEnergy || 0) + impact.energySavedWh,
                totalCost: (data.totalCost || 0) + impact.costSavedUsd
            };

            chrome.storage.local.set(newTotals, () => {
                console.log("New totals saved:", newTotals);
            });
        });



        showImpactModal(impact);
    });


    // Append button next to editor container
    editor.parentElement.appendChild(button);

    console.log("GreenPrompt button injected");
}



function injectFloatingAssistant() {
    if (document.getElementById("greenprompt-assistant")) return;

    const container = document.createElement("div");
    container.id = "greenprompt-assistant";
    container.style.position = "fixed";
    container.style.bottom = "40px";
    container.style.right = "40px";
    container.style.zIndex = "9999";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.gap = "8px";

    // Expandable panel
    const panel = document.createElement("div");
    panel.style.display = "flex";
    panel.style.gap = "6px";
    panel.style.opacity = "0";
    panel.style.transform = "translateX(20px)";
    panel.style.transition = "all 0.25s ease";
    panel.style.pointerEvents = "none";

    // Optimize button
    const optimizeBtn = document.createElement("div");
    optimizeBtn.innerText = "Optimize";
    optimizeBtn.style.background = "#2ecc71";
    optimizeBtn.style.color = "white";
    optimizeBtn.style.padding = "6px 12px";
    optimizeBtn.style.borderRadius = "20px";
    optimizeBtn.style.cursor = "pointer";

    optimizeBtn.onclick = () => {
        const editor = document.querySelector('.ql-editor');
        if (!editor) return;

        const originalText = editor.innerText;
        const optimizedText = "Short version.";

        const impact = window.GreenPromptImpact.calculateImpactSummary(
            originalText,
            optimizedText,
            1000
        );

        showImpactModal(impact);

        // Save totals
        chrome.storage.local.get(
            ["totalTokens", "totalEnergy", "totalCost"],
            (data) => {
            const newTotals = {
                totalTokens: (data.totalTokens || 0) + impact.tokensSaved,
                totalEnergy: (data.totalEnergy || 0) + impact.energySavedWh,
                totalCost: (data.totalCost || 0) + impact.costSavedUsd
            };
            chrome.storage.local.set(newTotals);
            }
        );
    };

    // Dashboard button
    const dashBtn = document.createElement("div");
    dashBtn.innerText = "Dashboard";
    dashBtn.style.background = "#1e1e1e";
    dashBtn.style.color = "white";
    dashBtn.style.padding = "6px 12px";
    dashBtn.style.borderRadius = "20px";
    dashBtn.style.cursor = "pointer";

    dashBtn.onclick = () => {
        chrome.runtime.sendMessage({ action: "openDashboard" });
    };

    panel.appendChild(optimizeBtn);
    panel.appendChild(dashBtn);

    // Circular leaf
    const leaf = document.createElement("div");
    leaf.innerText = "🌿";
    leaf.style.width = "48px";
    leaf.style.height = "48px";
    leaf.style.borderRadius = "50%";
    leaf.style.background = "#2ecc71";
    leaf.style.display = "flex";
    leaf.style.alignItems = "center";
    leaf.style.justifyContent = "center";
    leaf.style.fontSize = "20px";
    leaf.style.cursor = "pointer";
    leaf.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)";

    container.onmouseenter = () => {
        panel.style.opacity = "1";
        panel.style.transform = "translateX(0)";
        panel.style.pointerEvents = "auto";
    };

    container.onmouseleave = () => {
        panel.style.opacity = "0";
        panel.style.transform = "translateX(20px)";
        panel.style.pointerEvents = "none";
    };

    container.appendChild(panel);
    container.appendChild(leaf);
    document.body.appendChild(container);
}





function showImpactModal(impact) {
    // Remove existing modal if any
    const existing = document.getElementById("greenprompt-modal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "greenprompt-modal";

    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.background = "#1e1e1e";
    modal.style.color = "white";
    modal.style.padding = "20px";
    modal.style.borderRadius = "12px";
    modal.style.boxShadow = "0 10px 30px rgba(0,0,0,0.4)";
    modal.style.zIndex = "9999";
    modal.style.width = "320px";
    modal.style.fontFamily = "Arial, sans-serif";

    modal.innerHTML = `
        <h3 style="margin-top:0;">🌱 Prompt Optimization</h3>
        <p><strong>Original Tokens:</strong> ${impact.originalTokens}</p>
        <p><strong>Optimized Tokens:</strong> ${impact.optimizedTokens}</p>
        <p><strong>Reduction:</strong> ${impact.reductionPct}%</p>
        <hr style="border-color:#444;" />
        <p><strong>Energy Saved:</strong> ${impact.energySavedWh} Wh</p>
        <p><strong>Cost Saved:</strong> $${impact.costSavedUsd}</p>
        <p style="font-size:12px; opacity:0.8;">
        If used ${impact.scaled.runs} times:
        ${impact.scaled.tokensSaved} tokens saved
        </p>
        <button id="greenprompt-close" style="
        margin-top:10px;
        padding:6px 10px;
        border:none;
        border-radius:6px;
        cursor:pointer;
        background:#2ecc71;
        color:white;
        font-weight:bold;
        ">Close</button>
    `;

    document.body.appendChild(modal);

    document.getElementById("greenprompt-close").onclick = () => {
        modal.remove();
    };
}

injectFloatingAssistant();

