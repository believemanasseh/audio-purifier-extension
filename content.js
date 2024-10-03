if (typeof audioContext === "undefined") {
  var audioContext;
  var stream;
  var analyser;
  var dataArray;
  var bufferLength;
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "startPurifying") {
    chrome.runtime.sendMessage({ action: "startWebSocketConnection" });
    await startPurification();
    sendResponse({ status: "Purification started" });
  }

  if (message.action === "stopPurifying") {
    chrome.runtime.sendMessage({ action: "stopWebSocketConnection" });
    await stopPurification();
    sendResponse({ status: "Purification stopped" });
  }

  if (message.action === "playAudio") {
    playProcessedAudio(message.audioData);
  }

  return true;
});

async function startPurification(canvas) {
  // Get audio stream from the microphone
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  audioContext = new AudioContext();

  const moduleURL = chrome.runtime.getURL("processor.js");
  await audioContext.audioWorklet.addModule(moduleURL);

  // Create input, effect and analyser audio nodes
  const source = audioContext.createMediaStreamSource(stream);

  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1000, audioContext.currentTime);
  filter.gain.setValueAtTime(25, audioContext.currentTime);

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  const workletNode = new AudioWorkletNode(audioContext, "audio-processor");

  source.connect(filter);
  filter.connect(workletNode);
  workletNode.connect(audioContext.destination);

  chrome.runtime.sendMessage({
    action: "visualise",
    dataArray: dataArray,
    bufferLength: bufferLength,
  });

  // Handle messages from the AudioWorkletNode
  workletNode.port.onmessage = (event) => {
    const processedAudio = event.data;

    chrome.runtime.sendMessage({
      action: "sendAudioData",
      audioData: processedAudio,
    });
  };
}

async function stopPurification() {
  if (audioContext.state !== "closed") {
    await audioContext.close();
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
