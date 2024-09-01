document.getElementById("btn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tab) => {
    const isPurifying = localStorage.getItem("isPurifying") === "true";
    const button = document.getElementById("btn");

    if (isPurifying) {
      chrome.tabs.sendMessage(tab.id, { action: "stopPurifying" });
      button.textContent = "Start Purification";
    } else {
      chrome.tabs.sendMessage(tab.id, { action: "startPurifying" });
      button.textContent = "Stop Purification";
    }

    localStorage.setItem("isPurifying", !isPurifying);
  });
});
