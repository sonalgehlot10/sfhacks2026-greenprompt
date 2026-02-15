document.addEventListener("DOMContentLoaded", () => {
//   chrome.storage.local.get(
//     ["totalTokens", "totalEnergy", "totalCost"],
//     (data) => {

//       const tokens = data.totalTokens || 0;
//       const energy = data.totalEnergy || 0;
//       const cost = data.totalCost || 0;

//       document.getElementById("totalTokens").innerText =
//         tokens.toLocaleString();

//       document.getElementById("totalEnergy").innerText =
//         energy.toFixed(4);

//       document.getElementById("totalCost").innerText =
//         "$" + cost.toFixed(6);
//     }
//   );

    chrome.storage.local.get(
    ["totalTokens", "totalEnergy", "totalCost"],
    (data) => {

        const totalTokens = data.totalTokens || 0;
        const totalEnergy = data.totalEnergy || 0;
        const totalCost = data.totalCost || 0;

        document.getElementById("tokensSaved").innerText = totalTokens;
        document.getElementById("energySaved").innerText = totalEnergy.toFixed(4);
        document.getElementById("costSaved").innerText = totalCost.toFixed(6);

        // Generate realistic monthly data
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
