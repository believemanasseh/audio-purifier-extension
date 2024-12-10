import json

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

from src.denoising import denoise_audio

app = FastAPI()


@app.websocket("/ws")
async def connect(websocket: WebSocket):
    try:
        index = 0
        await websocket.accept()
        while True:
            index += 1
            data = await websocket.receive_text()
            json_data = json.loads(data)
            denoised_audio = await denoise_audio(json_data, index)
            await websocket.send_json({"denoisedAudio": denoised_audio})
    except WebSocketDisconnect:
        print("WebSocket disconnected!")
    except Exception as e:
        print(f"Error: {e}")
