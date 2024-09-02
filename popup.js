document.getElementById("btn").addEventListener("click", () => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tab) => {
    const isPurifying = localStorage.getItem("isPurifying") === "true";
    const button = document.getElementById("btn");

    if (isPurifying) {
      button.textContent = "START PURIFICATION";
      button.style.backgroundColor = "rgb(57, 115, 202)";
      chrome.tabs.sendMessage(tab[0].id, { action: "stopPurifying" });
    } else {
      button.textContent = "STOP PURIFICATION";
      button.style.backgroundColor = "red";
      chrome.tabs.sendMessage(tab[0].id, { action: "startPurifying" });
    }

    localStorage.setItem("isPurifying", !isPurifying);
  });
});
