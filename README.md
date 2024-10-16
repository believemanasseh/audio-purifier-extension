# Audio Purifier Extension

A simple chrome extension for AI-powered noise suppression.

## Features

- Reduces background noise from your microphone input.
- Provides a real-time spectrogram visualisation of the audio.
- Uses a FastAPI backend for AI-powered noise removal.

## Repository Structure

This repository consists of two main components:

- `extension/`: The Chrome extension source code.
- `server/`: A FastAPI backend that powers the AI model for noise suppression.

## Development Setup

### Chrome Extension

- Download the source code from the repository.
- Go to chrome://extensions/ in your Chrome browser.
- Enable "Developer mode" in the top right corner.
- Click "Load unpacked" and select the downloaded extension folder.

### FastAPI Server

1.) Navigate to server directory

```bash
cd server
```

2.) Install dependencies

```bash
pipenv install
```

3.) Start development server

```bash
fastapi dev src/app.py
```

## Usage

- Click on the extension icon in the Chrome toolbar. A popup window will appear.
- Click the "Start Purification" button. The extension will start processing your microphone input with noise removal. You can monitor the audio spectrum using the spectrogram visualisation.
- Click the "Stop Purification" button to disable noise removal.

## Technical Details

The extension utilises the Web Audio API to capture audio from your microphone. It then sends the audio data to a self-hosted or cloud-based AI model for denoising. The processed audio is sent back and replaces the original microphone input.

## Model Information

The audio purification process utilises the **DeepFilterNet** model consisting of a two-stage architecture, which employs advanced deep filtering techniques for effective noise suppression. DeepFilterNet is designed to enhance audio quality by reducing background noise while preserving the integrity of the primary audio signal.

For more detailed information about the model and its implementation, you can refer to the original paper: [DeepFilterNet: A Low Complexity Speech Enhancement Framework for Full-Band Audio based on Deep Filtering](https://www.researchgate.net/publication/355222096_DeepFilterNet_A_Low_Complexity_Speech_Enhancement_Framework_for_Full-Band_Audio_based_on_Deep_Filtering).

## License

The extension source code is licensed under the MIT License (see [LICENSE](LICENSE)).
