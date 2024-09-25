class AudioProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];

    if (input.length > 0) {
      const inputChannel = input[0];
      const outputChannel = output[0];

      // Process audio
      for (let i = 0; i < inputChannel.length; i++) {
        outputChannel[i] = inputChannel[i];
      }

      // Send the processed audio data back to the content script
      this.port.postMessage(inputChannel);
    }

    return true;
  }
}

registerProcessor("audio-processor", AudioProcessor);
