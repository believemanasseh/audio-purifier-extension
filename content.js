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

async function startPurification() {
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

  // Handle messages from the AudioWorkletNode
  workletNode.port.onmessage = (event) => {
    const processedAudio = event.data;

    visualise(); // visualise spectrogram

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

function visualise() {
  requestAnimationFrame(visualise);

  analyser.getByteFrequencyData(dataArray);

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

    canvasCtx.fillStyle = "rgb(" + (barHeight + 100) + ",50,50)";
    canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth, barHeight / 2);

    x += barWidth + 1;
  }
}
