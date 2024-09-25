chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "popup" && message.action === "startPurifying") {
    chrome.runtime.sendMessage({
      type: "content",
      action: "startPurifying",
    });
    sendResponse({ status: "Purification started" });
    localStorage.setItem("isPurifying", true);
  } else if (message.type === "popup" && message.action === "stopPurifying") {
    chrome.runtime.sendMessage({
      type: "content",
      action: "stopPurifying",
    });
    sendResponse({ status: "Purification stopped" });
    localStorage.setItem("isPurifying", false);
  }
  return true;
});
