chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  let socket;
  let analyser;
  let dataArray;

  if (message.action === "startPurifying") {
    const audioContext = new AudioContext();
    audioContext.createAnalyser();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    // Create input, effect and analyser audio nodes
    const source = audioContext.createMediaStreamSource(stream);
    const filter = audioContext.createBiquadFilter();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);

    visualise();

    // Configure Biquad filter
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, audioContext.currentTime);
    filter.gain.setValueAtTime(25, audioContext.currentTime);

    // Connect nodes
    source.connect(filter);
    filter.connect(audioContext.destination);
    analyser.connect(audioContext.destination);

    socket = new WebSocket("ws://cloud-api-server");

    let outputData;

    socket.onopen = () => {
      filter.onaudioprocess = (audioProcessingEvent) => {
        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
        outputData = audioProcessingEvent.outputBuffer.getChannelData(0);
        const audioInput = Array.from(inputData);
        socket.send({ audioInput });
      };
    };

    socket.onmessage = (event) => {
      outputData[0] = event.data.audioOutput;
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed");
    };
  } else if (message.action === "stopPurifying") {
    socket.close();
  }

  const visualise = () => {
    analyser.getByteFrequencyData(dataArray);

    const canvas = document.getElementById("spectrogram");
    const canvasCtx = canvas.getContext("2d");
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw spectrogram
    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = (dataArray[i] / 255) * canvas.height;
      const barWidth = canvas.width / dataArray.length;
      const x = i * barWidth;
      const y = canvas.height - barHeight;

      canvasCtx.fillStyle = `rgb(${dataArray[i]}, 0, 0)`;
      canvasCtx.fillRect(x, y, barWidth, barHeight);
    }

    requestAnimationFrame(visualise);
  };
});
