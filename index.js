document.getElementById("btn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tab) => {
    const isPurifying = localStorage.getItem("isPurifying") === "true";
    const button = document.getElementById("btn");

    if (isPurifying) {
      chrome.tabs.sendMessage(tab.id, { action: "stopPurifying" });
      button.textContent = "START PURIFICATION";
    } else {
      chrome.tabs.sendMessage(tab.id, { action: "startPurifying" });
      button.textContent = "STOP PURIFICATION";
    }

    localStorage.setItem("isPurifying", !isPurifying);
  });
});
