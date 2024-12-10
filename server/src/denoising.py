import asyncio
import base64
from pathlib import Path

import aiofiles.os
from df.enhance import enhance, init_df, load_audio, save_audio


async def create_dir(name: str) -> str:
    current_dir = Path(__file__).parent
    output_dir = current_dir / name
    await aiofiles.os.makedirs(output_dir, exist_ok=True)
    return output_dir


async def delete_file(file_path: str) -> None:
    if await aiofiles.os.path.exists(file_path):
        await aiofiles.os.remove(file_path)


async def encode_wav_to_base64(file_path: str) -> str:
    """Encodes WAV file as base64 string for transmission to client."""
    if not await aiofiles.os.path.isfile(file_path):
        raise FileNotFoundError(f"The file {file_path} does not exist.")

    try:
        async with aiofiles.open(file_path, "rb") as audio_file:
            audio_data = await audio_file.read()

            if not audio_data:
                raise ValueError("The audio data read from the file is empty.")

            base64_audio = base64.b64encode(audio_data).decode("utf-8")

            return base64_audio
    except IOError as e:
        raise IOError(
            f"An error occurred while reading the file {file_path}: {e}"
        ) from e
    except Exception as e:
        raise RuntimeError(f"Failed to encode audio data to Base64: {e}") from e


async def save_base64_as_wav(base64_string: str, output_filename: str) -> str:
    """Saves base64 string as WAV file on disk."""
    try:
        audio_data = base64.b64decode(base64_string)
    except ValueError as e:
        raise ValueError("Invalid Base64 string provided.") from e

    output_dir = await create_dir("wav")
    output_file_path = output_dir / output_filename

    try:
        async with aiofiles.open(output_file_path, "wb") as wav_file:
            await wav_file.write(audio_data)
    except FileNotFoundError as e:
        raise FileNotFoundError(
            f"Output directory not found: {output_file_path}"
        ) from e
    except IOError as e:
        raise IOError(f"Failed to write to file {output_file_path}: {e}") from e

    return output_file_path


async def denoise_audio(data: dict, index: int) -> str:
    """Processes raw audio (WAV) and returns denoised audio
    encoded as base64 string.
    """
    model, df_state, suffix = init_df(post_filter=True)

    # Save unenhanced audio
    unenhanced_file = f"unenhanced_audio_{suffix}{index}.wav"
    output_file_path = await save_base64_as_wav(data["noisy_audio"], unenhanced_file)

    # Load and enhance audio
    sr_value = df_state.sr()
    audio, _ = await asyncio.to_thread(load_audio, output_file_path, sr_value)
    enhanced = enhance(model, df_state, audio)

    # Save enhanced audio
    enhanced_file = f"enhanced_audio_{suffix}{index}.wav"
    output_dir = await create_dir("wav-enhanced")
    await asyncio.to_thread(save_audio, enhanced_file, enhanced, sr_value, output_dir)

    # Encode unenhanced audio to base64 for transmission
    denoised_audio = await encode_wav_to_base64(output_file_path)

    # Delete the (un)enhanced files after processing
    await delete_file(output_dir / unenhanced_file)
    await delete_file(output_dir / enhanced_file)

    return denoised_audio
