const START_TEXT = "START PURIFICATION";
const STOP_TEXT = "STOP PURIFICATION";
const START_BTN_COLOR = "rgb(57, 115, 202)";
const STOP_BTN_COLOR = "red";

let btn;
let dataArray;
let bufferLength;

const port = chrome.runtime.connect({ name: "popup" });

port.onMessage.addListener((message) => {
  if (message.action === "visualise") {
    dataArray = message.dataArray;
    bufferLength = message.bufferLength;
    visualise();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  checkPurificationStatus();
  btn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      const isPurifying = localStorage.getItem("isPurifying") === "true";
      const action = isPurifying ? "stopPurifying" : "startPurifying";

      chrome.scripting.executeScript(
        {
          target: { tabId: activeTab.id },
          files: ["utils.js", "content.js"],
        },
        () => {
          if (isPurifying) {
            btn.textContent = START_TEXT;
            btn.style.backgroundColor = START_BTN_COLOR;
            chrome.tabs.sendMessage(activeTab.id, { action: action });
          } else {
            btn.textContent = STOP_TEXT;
            btn.style.backgroundColor = STOP_BTN_COLOR;
            chrome.tabs.sendMessage(activeTab.id, { action: action });
          }

          localStorage.setItem("isPurifying", !isPurifying);
        }
      );
    });
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

function visualise() {
  const isPurifying = localStorage.getItem("isPurifying") === "true";

  if (!isPurifying) return;

  const canvas = document.getElementById("spectrogram");
  const canvasCtx = canvas.getContext("2d");
  const HEIGHT = canvas.height;
  const WIDTH = canvas.width;

  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
  canvasCtx.fillStyle = "rgb(0, 0, 0)";
  canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

  const barWidth = (WIDTH / bufferLength) * 2.5;

  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    const barHeight = dataArray[i];
    const red = barHeight + 100;
    canvasCtx.fillStyle = `rgb(${red}, 50, 50)`;
    canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

    x += barWidth + 1;
  }
}
