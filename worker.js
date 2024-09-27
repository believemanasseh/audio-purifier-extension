let socket = null;
let isPurifying = false;

chrome.runtime.onInstalled.addListener(() => {
  console.log("Background script installed successfully!");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startWebSocketConnection" && !isPurifying) {
    startWebSocketConnection(sendResponse);
    isPurifying = true;
  }

  if (message.action === "stopWebSocketConnection" && isPurifying) {
    if (socket) {
      socket.close();
      isPurifying = false;
    }
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
  socket = new WebSocket("wss://echo.websocket.org");

  socket.onopen = () => {
    console.log("WebSocket connection opened");
  };

  socket.onmessage = (event) => {
    const processedAudio = event.data;
    sendResponse({ action: "playAudio", audioData: processedAudio });
  };

  socket.onerror = (error) => {
    console.error("WebSocket Error: ", error);
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };
}
