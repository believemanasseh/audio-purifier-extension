let audioContext;
let stream;

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === "popup" && message.action === "startPurifying") {
    chrome.runtime.sendMessage({ action: "startWebSocketConnection" });
    await startPurification();
    sendResponse({ status: "Purification started" });
  }

  if (message.type === "popup" && message.action === "stopPurifying") {
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
  audioContext = new AudioContext();

  await audioContext.audioWorklet.addModule("processor.js");

  // Get audio stream from the microphone
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const source = audioContext.createMediaStreamSource(stream);
  const filter = audioContext.createBiquadFilter();

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1000, audioContext.currentTime);
  filter.gain.setValueAtTime(25, audioContext.currentTime);

  const workletNode = new AudioWorkletNode(audioContext, "audio-processor");

  source.connect(filter);
  filter.connect(workletNode);
  workletNode.connect(audioContext.destination);

  localStorage.setItem("isPurifying", true);

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

  localStorage.setItem("isPurifying", false);

  console.log("Purification stopped");
}

function playProcessedAudio(data) {
  const blob = new Blob([data], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
}
