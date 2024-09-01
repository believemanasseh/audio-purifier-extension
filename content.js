chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  let socket;

  if (message.action === "startPurifying") {
    const audioContext = new AudioContext();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Create input and effect audio nodes
    const source = audioContext.createMediaStreamSource(stream);
    const filter = audioContext.createBiquadFilter();

    // Configure Biquad filter
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1000, audioContext.currentTime);
    filter.gain.setValueAtTime(25, audioContext.currentTime);

    // Connect nodes
    source.connect(filter);
    filter.connect(audioContext.destination);

    socket = new WebSocket("ws://cloud-api-server");

    let outputData;

    socket.onopen = () => {
      filter.onaudioprocess = async (audioProcessingEvent) => {
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
});
