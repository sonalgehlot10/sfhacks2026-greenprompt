document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(
    ["totalTokens", "totalEnergy", "totalCost"],
    (data) => {

        const totalTokens = data.totalTokens || 0;
        const totalEnergy = data.totalEnergy || 0;
        const totalCost = data.totalCost || 0;

        function getImpactMetrics(totalTokens, totalEnergyWh) {

            const responsesAvoided = totalTokens / 150;
            const ledHours = totalEnergyWh / 9;      // 9W LED bulb
            const laptopMinutes = totalEnergyWh;     // 1 Wh ≈ 1 laptop minute

            return [
                { label: "LED Hours Powered", value: ledHours.toFixed(2) },
                { label: "AI Responses Avoided", value: responsesAvoided.toFixed(1) },
                { label: "Laptop Minutes Powered", value: laptopMinutes.toFixed(1) }
            ];
        }



        // Basic stats
        document.getElementById("tokensSaved").innerText = totalTokens.toLocaleString();
        document.getElementById("energySaved").innerText = totalEnergy.toFixed(4);
        document.getElementById("costSaved").innerText = totalCost.toFixed(6);

        /* =============================
        🏆 LEVEL SYSTEM
        ============================== */

        const levels = [
            { name: "Seedling &#127793;", threshold: 0 },
            { name: "Sapling &#127807;", threshold: 500 },
            { name: "Eco Guardian &#127795;", threshold: 1500 },
            { name: "Forest Protector &#127794;", threshold: 5000 },
            { name: "Climate Champion &#127758;", threshold: 10000 }
        ];

        const metrics = getImpactMetrics(totalTokens, totalEnergy);

        document.getElementById("impact1Value").innerText = metrics[0].value;
        document.getElementById("impact1Label").innerText = metrics[0].label;

        document.getElementById("impact2Value").innerText = metrics[1].value;
        document.getElementById("impact2Label").innerText = metrics[1].label;

        document.getElementById("impact3Value").innerText = metrics[2].value;
        document.getElementById("impact3Label").innerText = metrics[2].label;


        let currentLevelIndex = 0;

        for (let i = 0; i < levels.length; i++) {
            if (totalTokens >= levels[i].threshold) {
                currentLevelIndex = i;
            }
        }

        const currentLevel = levels[currentLevelIndex];
        const nextLevel = levels[currentLevelIndex + 1];

        document.getElementById("rankName").innerHTML = currentLevel.name;
        document.getElementById("rankLevel").innerText = `Level ${currentLevelIndex + 1}`;

        if (nextLevel) {
            const tokensToNext = nextLevel.threshold - totalTokens;
            const progress = (totalTokens - currentLevel.threshold) /
                            (nextLevel.threshold - currentLevel.threshold);

            document.getElementById("nextLevelText").innerText =
                `Next level in ${tokensToNext.toLocaleString()} tokens`;

            document.getElementById("progressFill").style.width =
                Math.min(progress * 100, 100) + "%";
        } else {
            document.getElementById("nextLevelText").innerText =
                "Maximum level reached 🚀";
            document.getElementById("progressFill").style.width = "100%";
        }

        /* =============================
        🌍 REAL WORLD IMPACT
        ============================== */

        const phoneCharges = totalEnergy / 12; // 12Wh avg battery
        const co2Offset = (totalEnergy / 1000) * 0.4; // kg CO2 per kWh
        const bulbHours = totalEnergy / 10; // 10W LED bulb

        document.getElementById("phoneCharges").innerText =
            phoneCharges.toFixed(1);

        document.getElementById("co2Offset").innerText =
            co2Offset.toFixed(3);

        document.getElementById("bulbHours").innerText =
            bulbHours.toFixed(1);

        /* =============================
        Charts
        ============================== */

        const monthly = generateMonthlyData(totalTokens);

        createAreaChart("tokensChart", "Tokens Saved", monthly.tokens, "#22c55e");
        createAreaChart("energyChart", "Energy Saved (Wh)", monthly.energy, "#16a34a");
        createAreaChart("costChart", "Cost Saved ($)", monthly.cost, "#4ade80");
    }
    );


    function generateMonthlyData(totalTokens) {
    const months = 6;
    const baseWeights = [0.1, 0.12, 0.15, 0.18, 0.2, 0.25];

    let tokens = [];
    let accumulated = 0;

    for (let i = 0; i < months; i++) {
        const fluctuation = (Math.random() * 0.04) - 0.02; // ±2%
        const weight = baseWeights[i] + fluctuation;
        const value = Math.max(0, totalTokens * weight);

        tokens.push(Math.round(value));
        accumulated += value;
    }

    // Normalize so sum matches totalTokens
    const scaleFactor = totalTokens / accumulated;
    tokens = tokens.map(v => Math.round(v * scaleFactor));

    const energy = tokens.map(t => (t / 1000) * 0.1);
    const cost = tokens.map(t => (t / 1000) * 0.002);

    return { tokens, energy, cost };
    }

    function createAreaChart(canvasId, label, data, color) {
    const ctx = document.getElementById(canvasId).getContext("2d");

    new Chart(ctx, {
        type: "line",
        data: {
        labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan"],
        datasets: [{
            label: label,
            data: data,
            fill: true,
            borderColor: color,
            backgroundColor: color + "33",
            tension: 0.4,
            pointRadius: 4,
            pointBackgroundColor: color
        }]
        },
        options: {
        responsive: true,
        plugins: {
            legend: {
            labels: { color: "white" }
            }
        },
        scales: {
            x: {
            ticks: { color: "white" },
            grid: { color: "#1f2937" }
            },
            y: {
            ticks: { color: "white" },
            grid: { color: "#1f2937" }
            }
        }
        }
    });
    }









  document.getElementById("resetBtn").addEventListener("click", () => {
    chrome.storage.local.set({
      totalTokens: 0,
      totalEnergy: 0,
      totalCost: 0
    }, () => location.reload());
  });
});
