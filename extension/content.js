let port = chrome.runtime.connect({ name: "content" });

let audioContext;
let stream;
let analyser;
let dataArray;
let bufferLength;
let workletNode;
let channelCount;
let audioChunks = [];
let isPurifying = false;

let FFT_SIZE = 2048;
let BATCH_SIZE = 10;
let BUFFER_LENGTH = 4800;
let SAMPLE_RATE = 48000;

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

  return true;
});

port.onMessage.addListener((message) => {
  if (message.action === "playAudio") {
    playProcessedAudio(message.audioData);
  }
});

async function startPurification() {
  // Get audio stream from the microphone
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // Get the audio tracks from the stream
  const audioTracks = stream.getAudioTracks();

  if (audioTracks.length) {
    const trackSettings = audioTracks[0].getSettings();
    channelCount = trackSettings.channelCount || 1; // Use detected channel count or default to 1
    console.log(`Detected number of channels: ${channelCount}`);
  }

  await createNodes();

  updateVisualisationData();

  // Handle messages from the AudioWorkletNode
  workletNode.port.onmessage = (event) => {
    const channelData = event.data;

    const processedChannels = [];
    channelData.forEach((channel) => {
      const processedChannelData = processChannelData(channel);
      processedChannels.push(processedChannelData);
    });

    audioChunks.push(processedChannels);

    if (audioChunks.length >= BATCH_SIZE) {
      processChunks();
      audioChunks.length = 0;
    }
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
  analyser = null;
}

async function createNodes() {
  // Create audio-processing graph
  audioContext = new AudioContext();

  // Create input audio node
  const source = audioContext.createMediaStreamSource(stream);

  // Create filter audio node
  const filter = audioContext.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1000, audioContext.currentTime);
  filter.gain.setValueAtTime(25, audioContext.currentTime);

  // Create analyser audio node
  analyser = audioContext.createAnalyser();
  analyser.fftSize = FFT_SIZE;
  bufferLength = analyser.frequencyBinCount;
  dataArray = new Uint8Array(bufferLength);

  // Load processor module
  const moduleURL = chrome.runtime.getURL("processor.js");
  await audioContext.audioWorklet.addModule(moduleURL);

  workletNode = new AudioWorkletNode(audioContext, "audio-processor", {
    outputChannelCount: [channelCount],
  });

  source.connect(filter);
  filter.connect(analyser);
  analyser.connect(workletNode);
}

function playProcessedAudio(base64Audio) {
  // Decode Base64 string to ArrayBuffer
  const binaryString = window.atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);

  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Create an AudioBuffer and play it
  audioContext.decodeAudioData(bytes.buffer, (buffer) => {
    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination); // Connect to speakers
    source.start(0); // Play immediately
  });
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

function processChannelData(channelData) {
  const output = new Float32Array(BUFFER_LENGTH);

  // If incoming channel data is shorter than BUFFER_LENGTH,
  // do zero-padding. Otherwise, truncate it
  if (channelData.length < BUFFER_LENGTH) {
    output.set(channelData);
  } else {
    output.set(channelData.subarray(0, BUFFER_LENGTH));
  }

  return output;
}

function processChunks() {
  const audioBuffer = new AudioBuffer({
    length: BUFFER_LENGTH,
    sampleRate: SAMPLE_RATE,
    numberOfChannels: channelCount,
  });

  // Copy each chunk into the AudioBuffer for both channels
  for (let i = 0; i < audioChunks.length; i++) {
    const processedChannels = audioChunks[i];

    // Copy each channel into the AudioBuffer
    for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
      if (processedChannels[channelIndex]) {
        const channelData = processedChannels[channelIndex];
        audioBuffer.copyToChannel(channelData, channelIndex);
      }
    }
  }

  const wavBlob = window.utils.convertAudioBufferToWav(audioBuffer);

  const reader = new FileReader();

  reader.onload = (event) => {
    const arrayBuffer = event.target.result;
    const base64AudioMessage =
      window.utils.convertArrayBufferToBase64String(arrayBuffer);

    chrome.runtime.sendMessage({
      action: "sendAudioData",
      audioData: base64AudioMessage,
    });
  };

  reader.readAsArrayBuffer(wavBlob);
}
