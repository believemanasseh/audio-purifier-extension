let socket = null;
let isPurifying = false;
let popupPort = null;
let contentPort = null;
let visualisationData = { dataArray: [], bufferLength: 0 };
const WS_URL = "ws://localhost:8001/ws";
const RECONNECT_DELAY = 3000;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "popup") {
    popupPort = port;

    // Send the stored visualisation data to the popup when it opens
    if (visualisationData.dataArray.length) {
      popupPort.postMessage({
        action: "visualise",
        dataArray: visualisationData.dataArray,
        bufferLength: visualisationData.bufferLength,
      });
    }

    popupPort.onDisconnect.addListener(() => {
      popupPort = null;
    });
  } else if (port.name === "content") {
    contentPort = port;

    contentPort.onDisconnect.addListener(() => {
      contentPort = null;
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "startWebSocketConnection":
      if (!isPurifying) {
        startWebSocketConnection();
        isPurifying = true;
      }
      break;
    case "stopWebSocketConnection":
      if (isPurifying && socket) {
        socket.close();
        isPurifying = false;
      }
      break;
    case "sendAudioData":
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ noisy_audio: message.audioData }));
      }
    case "visualise":
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
      break;
    default:
      console.log("Invalid message");
  }
});

function startWebSocketConnection() {
  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.log("WebSocket connection opened");
  };

  socket.onmessage = (event) => {
    try {
      const processedAudio = event.data;
      const denoisedAudio = JSON.parse(processedAudio).denoisedAudio;

      if (contentPort) {
        contentPort.postMessage({
          action: "playAudio",
          audioData: denoisedAudio,
        });
      }
    } catch (err) {
      console.error("Error processing websocket message: ", err);
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket Error: ", error);
    reconnectWebSocket();
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };
}

function reconnectWebSocket() {
  if (isPurifying) {
    setTimeout(() => {
      console.log("Attempting to reconnect WebSocket...");
      startWebSocketConnection();
    }, RECONNECT_DELAY);
  }
}
