let socket = null;
let isPurifying = false;

chrome.runtime.onInstalled.addListener(() => {
  console.log("Background script installed successfully!");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startPurifying" && !isPurifying) {
    startWebSocketConnection(sendResponse);
    isPurifying = true;
    sendResponse({ status: "Purification started" });
  }

  if (message.action === "stopPurifying" && isPurifying) {
    if (socket) {
      socket.close();
    }
    stopPurification();
    isPurifying = false;
    sendResponse({ status: "Purification stopped" });
  }

  if (
    message.action === "sendAudioData" &&
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(message.audioData);
  }
});

function startWebSocketConnection(sendResponse) {
  socket = new WebSocket("ws://cloud-api-server");

  socket.onopen = () => {
    console.log("WebSocket connection opened");
  };

  socket.onmessage = (event) => {
    const processedAudio = event.data;
    console.log("Received denoised audio data");
    sendResponse({ action: "playAudio", audioData: processedAudio });
  };

  socket.onerror = (error) => {
    console.error("WebSocket Error: ", error);
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };
}
