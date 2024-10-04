let socket = null;
let isPurifying = false;
let popupPort = null;
let visualisationData = { dataArray: [], bufferLength: 0 };

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    popupPort = port;

    // Send the stored visualisation data to the popup when it opens
    if (visualisationData.dataArray.length > 0) {
      popupPort.postMessage({
        action: "visualise",
        dataArray: visualisationData.dataArray,
        bufferLength: visualisationData.bufferLength,
      });
    }

    port.onDisconnect.addListener(() => {
      popupPort = null;
    });
  }
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

  if (message.action === "visualise") {
    visualisationData = {
      dataArray: message.dataArray,
      bufferLength: message.bufferLength,
    };

    if (popupPort) {
      popupPort.postMessage({
        action: "visualise",
        dataArray: visualisationData.dataArray,
        bufferLength: visualisationData.bufferLength,
      });
    }
  }
});

function startWebSocketConnection(sendResponse) {
  socket = new WebSocket("ws://localhost:8000/ws");

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
