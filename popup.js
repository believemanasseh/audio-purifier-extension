const START_TEXT = "START PURIFICATION";
const STOP_TEXT = "STOP PURIFICATION";
const START_BTN_COLOR = "rgb(57, 115, 202)";
const STOP_BTN_COLOR = "red";
let btn;

checkPurificationStatus();

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
        if (isPurifying) {
          btn.textContent = START_TEXT;
          btn.style.backgroundColor = START_BTN_COLOR;
          chrome.tabs.sendMessage(tabId, { action: action });
        } else {
          btn.textContent = STOP_TEXT;
          btn.style.backgroundColor = STOP_BTN_COLOR;
          chrome.tabs.sendMessage(tabId, { action: action });
        }
        localStorage.setItem("isPurifying", !isPurifying);
      }
    );
  });
});

function checkPurificationStatus() {
  btn = document.getElementById("btn");
  const isPurifying = localStorage.getItem("isPurifying") === "true";
  if (isPurifying) {
    btn.textContent = STOP_TEXT;
    btn.style.backgroundColor = STOP_BTN_COLOR;
  } else {
    btn.textContent = START_TEXT;
    btn.style.backgroundColor = START_BTN_COLOR;
  }
}
