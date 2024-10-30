let socket = null;
let isPurifying = false;
let popupPort = null;
let contentPort = null;
let visualisationData = { dataArray: [], bufferLength: 0 };

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
  if (!isPurifying && message.action === "startWebSocketConnection") {
    startWebSocketConnection();
    isPurifying = true;
  }

  if (isPurifying && socket && message.action === "stopWebSocketConnection") {
    socket.close();
    isPurifying = false;
  }

  if (
    message.action === "sendAudioData" &&
    socket &&
    socket.readyState === WebSocket.OPEN
  ) {
    socket.send(JSON.stringify({ noisy_audio: message.audioData }));
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

function startWebSocketConnection() {
  socket = new WebSocket("ws://localhost:8000/ws");

  socket.onopen = () => {
    console.log("WebSocket connection opened");
  };

  socket.onmessage = (event) => {
    const processedAudio = event.data;
    const denoisedAudio = JSON.parse(processedAudio).denoisedAudio;

    if (contentPort) {
      contentPort.postMessage({
        action: "playAudio",
        audioData: denoisedAudio,
      });
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket Error: ", error);
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };
}
