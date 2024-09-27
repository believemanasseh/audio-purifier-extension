let audioContext;
let stream;

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "startPurifying") {
    chrome.runtime.sendMessage({ action: "startWebSocketConnection" });
    await startPurification();
    sendResponse({ status: "Purification started" });
  }

  if (message.action === "stopPurifying") {
    chrome.runtime.sendMessage({ action: "stopWebSocketConnection" });
    stopPurification();
    sendResponse({ status: "Purification stopped" });
  }

  if (message.action === "playAudio") {
    playProcessedAudio(message.audioData);
  }

  return true;
});

async function startPurification() {
  // Get audio stream from the microphone
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  audioContext = new AudioContext();

  const moduleURL = chrome.runtime.getURL("processor.js");
  await audioContext.audioWorklet.addModule(moduleURL);

  const source = audioContext.createMediaStreamSource(stream);
  const filter = audioContext.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1000, audioContext.currentTime);
  filter.gain.setValueAtTime(25, audioContext.currentTime);

  const workletNode = new AudioWorkletNode(audioContext, "audio-processor");

  source.connect(filter);
  filter.connect(workletNode);
  workletNode.connect(audioContext.destination);

  // Handle messages from the AudioWorkletNode
  workletNode.port.onmessage = (event) => {
    const processedAudio = event.data;
    chrome.runtime.sendMessage({
      action: "sendAudioData",
      audioData: processedAudio,
    });
  };
}

function stopPurification() {
  if (audioContext) {
    audioContext.close();
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

function playProcessedAudio(data) {
  const blob = new Blob([data], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
}
