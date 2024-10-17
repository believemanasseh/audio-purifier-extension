from fastapi import FastAPI, WebSocket

from src.denoising import denoise_audio

app = FastAPI()


@app.websocket("/ws")
async def connect(websocket: WebSocket):
    await websocket.accept()
    while True:
        data = await websocket.receive_text()
        denoised_audio = denoise_audio(data)
        await websocket.send_json({"denoisedAudio": denoised_audio})
