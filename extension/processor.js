class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input.length > 0) {
      const channelData = [];

      for (let channel = 0; channel < input.length; channel++) {
        const inputChannel = input[channel];
        channelData.push(inputChannel.slice());
      }

      // Send the processed audio data back to the content script
      this.port.postMessage(channelData);
    }

    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
