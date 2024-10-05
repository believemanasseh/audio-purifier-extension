class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input.length > 0) {
      const inputChannel = input[0];

      // Send the processed audio data back to the content script
      this.port.postMessage(inputChannel);
    }

    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
