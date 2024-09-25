let socket = null;
let isPurifying = false;
let audioContext;
let workletNode;
let stream;

chrome.runtime.onInstalled.addListener(() => {
  console.log("Background script installed successfully!");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "content" && message.action === "startPurifying") {
    if (!isPurifying) {
      startPurification();
      isPurifying = true;
      sendResponse({ status: "Purification started" });
    }
  }

  if (message.type === "content" && message.action === "stopPurifying") {
    if (isPurifying) {
      stopPurification();
      isPurifying = false;
      sendResponse({ status: "Purification stopped" });
    }
  }
});

function startWebSocketConnection() {
  socket = new WebSocket("ws://cloud-api-server");

  socket.onopen = () => {
    console.log("WebSocket connection opened");
  };

  socket.onmessage = (event) => {
    const processedAudio = event.data;
    console.log("Received denoised audio data");
    playProcessedAudio(processedAudio);
  };

  socket.onerror = (error) => {
    console.error("WebSocket Error: ", error);
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };
}

async function startPurification() {
  audioContext = new AudioContext();

  startWebSocketConnection();

  await audioContext.audioWorklet.addModule("processor.js");

  // Get audio stream from the microphone
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(stream);
  const filter = audioContext.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1000, audioContext.currentTime);
  filter.gain.setValueAtTime(25, audioContext.currentTime);

  workletNode = new AudioWorkletNode(audioContext, "audio-processor");

  source.connect(filter);
  filter.connect(workletNode);
  workletNode.connect(audioContext.destination);

  // Handle messages from the AudioWorkletNode
  workletNode.port.onmessage = (event) => {
    const processedAudio = event.data;

    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(processedAudio);
    }
  };
}

function stopPurification() {
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }

  console.log("Purification stopped");
}

function playProcessedAudio(data) {
  const blob = new Blob([data], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
}
