const START_TEXT = "START PURIFICATION";
const STOP_TEXT = "STOP PURIFICATION";
const START_BTN_COLOR = "rgb(57, 115, 202)";
const STOP_BTN_COLOR = "red";

const btn = document.getElementById("btn");

let isPurifying = localStorage.getItem("isPurifying") === "true";

if (isPurifying) {
  btn.textContent = STOP_TEXT;
  btn.style.backgroundColor = STOP_BTN_COLOR;
} else {
  btn.textContent = START_TEXT;
  btn.style.backgroundColor = START_BTN_COLOR;
}

btn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
    const tabId = tabs[0].id;
    const isPurifying = localStorage.getItem("isPurifying") === "true";
    const action = isPurifying ? "stopPurifying" : "startPurifying";

    chrome.scripting.executeScript(
      {
        target: { tabId: tabId },
        files: ["content.js"],
      },
      () => {
        localStorage.setItem("tabId", tabId);

        if (isPurifying) {
          btn.textContent = START_TEXT;
          btn.style.backgroundColor = START_BTN_COLOR;
          chrome.tabs.sendMessage(tabId, {
            type: "popup",
            action: action,
          });
        } else {
          btn.textContent = STOP_TEXT;
          btn.style.backgroundColor = STOP_BTN_COLOR;
          chrome.tabs.sendMessage(tabId, {
            type: "popup",
            action: action,
          });
        }
      }
    );
  });
});
