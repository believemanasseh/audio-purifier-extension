# Audio Purifier Extension

A simple chrome extension for AI-powered noise suppression.

## Features

- Reduces background noise from your microphone input.
- Provides a real-time spectrogram visualisation of the audio.

## Installation

- Download the source code from the repository.
- Go to chrome://extensions/ in your Chrome browser.
- Enable "Developer mode" in the top right corner.
- Click "Load unpacked" and select the downloaded extension folder.

## Usage

- Click on the extension icon in the Chrome toolbar. A popup window will appear.
- Click the "Start Purification" button. The extension will start processing your microphone input with noise removal. You can monitor the audio spectrum using the spectrogram visualisation.
- Click the "Stop Purification" button to disable noise removal.

## Technical Details

The extension utilises the Web Audio API to capture audio from your microphone. It then sends the audio data to a self-hosted or cloud-based AI model for denoising. The processed audio is sent back and replaces the original microphone input.

## License

The extension source code is licensed under the MIT License (see LICENSE).
