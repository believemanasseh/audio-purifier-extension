import base64
import os

from df.enhance import enhance, init_df, load_audio, save_audio


def create_dir(name: str) -> str:
    current_dir = os.path.dirname(__file__)
    output_dir = os.path.join(current_dir, name)
    os.makedirs(output_dir, exist_ok=True)
    return output_dir


def delete_file(file_path: str) -> None:
    if os.path.exists(file_path):
        os.remove(file_path)


def encode_wav_to_base64(file_path: str) -> str:
    """Encodes WAV file as base64 string for transmission to client."""
    with open(file_path, "rb") as audio_file:
        audio_data = audio_file.read()

    base64_audio = base64.b64encode(audio_data).decode("utf-8")

    return base64_audio


def save_base64_as_wav(base64_string: str, output_filename: str) -> str:
    """Saves base64 string as WAV file on disk."""
    audio_data = base64.b64decode(base64_string)

    output_dir = create_dir("wav")

    output_file_path = os.path.join(output_dir, output_filename)

    with open(output_file_path, "wb") as wav_file:
        wav_file.write(audio_data)

    return output_file_path


def denoise_audio(data: dict) -> str:
    """Processes raw audio (WAV) and returns denoised audio
    encoded as base64 string.
    """
    model, df_state, suffix = init_df(post_filter=True)

    # Save unenhanced audio
    output_filename = f"unenhanced_audio_{suffix}.wav"
    output_file_path = save_base64_as_wav(data["noisy_audio"], output_filename)

    # Load and enhance audio
    audio, _ = load_audio(output_file_path, sr=df_state.sr())
    enhanced = enhance(model, df_state, audio)

    # Save enhanced audio
    enhanced_output_filename = f"enhanced_audio_{suffix}.wav"
    output_dir = create_dir("wav-enhanced")

    save_audio(enhanced_output_filename, enhanced, df_state.sr(), output_dir)

    # Encode unenhanced audio to base64 for transmission
    denoised_audio = encode_wav_to_base64(output_file_path)

    # Delete the unenhanced and enhanced files after processing
    delete_file(output_file_path)
    delete_file(os.path.join(output_dir, enhanced_output_filename))

    return denoised_audio
