if (audioContext === "undefined") {
  var audioContext;
  var stream;
  var analyser;
  var dataArray;
  var bufferLength;
  var workletNode;
  var isPurifying = false;
}

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "startPurifying") {
    if (!isPurifying) {
      isPurifying = true;
      chrome.runtime.sendMessage({ action: "startWebSocketConnection" });
      await startPurification();
      sendResponse({ status: "Purification started" });
    }
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

  if (!audioContext) {
    audioContext = new AudioContext();
  }

  // Add input audio node
  const source = audioContext.createMediaStreamSource(stream);

  // Add filter audio node
  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1000, audioContext.currentTime);
  filter.gain.setValueAtTime(25, audioContext.currentTime);

  // Create analyser audio node
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  // Load processor module
  const moduleURL = chrome.runtime.getURL("processor.js");
  await audioContext.audioWorklet.addModule(moduleURL);

  workletNode = new AudioWorkletNode(audioContext, "audio-processor");

  source.connect(filter);
  filter.connect(analyser);
  analyser.connect(workletNode);

  updateVisualisationData();

  // Handle messages from the AudioWorkletNode
  workletNode.port.onmessage = (event) => {
    const processedAudio = event.data;
    const audioBuffer = new AudioBuffer({
      length: processedAudio.length,
      sampleRate: 44100,
      numberOfChannels: 1,
    });

    audioBuffer.copyToChannel(processedAudio, 0);

    const wavBlob = window.utils.convertBufferToWav(audioBuffer);
    const reader = new FileReader();

    reader.onload = (event) => {
      const arrayBuffer = event.target.result;
      const base64AudioMessage =
        window.utils.convertBufferToBase64String(arrayBuffer);

      chrome.runtime.sendMessage({
        action: "sendAudioData",
        audioData: base64AudioMessage,
      });
    };

    reader.readAsArrayBuffer(wavBlob);
  };
}

async function stopPurification() {
  if (audioContext && audioContext.state !== "closed") {
    await audioContext.close();
    audioContext = null;
    workletNode = null;
  }

  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  isPurifying = false;
}

function playProcessedAudio(data) {
  const blob = new Blob([data], { type: "audio/wav" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.play();
}

function updateVisualisationData() {
  if (analyser) {
    analyser.getByteFrequencyData(dataArray);
    chrome.runtime.sendMessage({
      action: "visualise",
      dataArray: Array.from(dataArray),
      bufferLength: bufferLength,
    });
    requestAnimationFrame(updateVisualisationData);
  }
}
