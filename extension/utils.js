window.utils = {
  convertAudioBufferToWav: (audioBuffer) => {
    const numOfChannels = audioBuffer.numberOfChannels;
    const sampleRate = audioBuffer.sampleRate;
    const dataLength = audioBuffer.length;

    const buffer = new ArrayBuffer(44 + dataLength * 2);
    const view = new DataView(buffer);

    // Write WAV header
    window.utils.writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataLength * 2, true);
    window.utils.writeString(view, 8, "WAVE");
    window.utils.writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // Pulse-Code Modulation
    view.setUint16(22, numOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, numOfChannels * 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    window.utils.writeString(view, 36, "data");
    view.setUint32(40, dataLength * 2, true);

    // Write Pulse-Code Modulation samples
    let offset = 44;
    for (let i = 0; i < dataLength; i++) {
      for (let channel = 0; channel < numOfChannels; channel++) {
        view.setInt16(
          offset,
          audioBuffer.getChannelData(channel)[i] * 0x7fff,
          true
        );
        offset += 2;
      }
    }

    return new Blob([buffer], { type: "audio/wav" });
  },

  writeString: (view, offset, str) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  },

  convertArrayBufferToBase64String: (buffer) => {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  },
};
