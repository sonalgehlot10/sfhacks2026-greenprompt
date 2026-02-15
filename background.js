console.log("GreenPrompt background running");

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "openDashboard") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("dashboard.html")
    });
  }
});
