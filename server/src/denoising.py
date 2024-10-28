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
    if not os.path.isfile(file_path):
        raise FileNotFoundError(f"The file {file_path} does not exist.")

    try:
        with open(file_path, "rb") as audio_file:
            audio_data = audio_file.read()
    except IOError as e:
        raise IOError(
            f"An error occurred while reading the file {file_path}: {e}"
        ) from e

    if not audio_data:
        raise ValueError("The audio data read from the file is empty.")

    try:
        base64_audio = base64.b64encode(audio_data).decode("utf-8")
    except Exception as e:
        raise RuntimeError(f"Failed to encode audio data to Base64: {e}") from e

    return base64_audio


def save_base64_as_wav(base64_string: str, output_filename: str) -> str:
    """Saves base64 string as WAV file on disk."""
    try:
        audio_data = base64.b64decode(base64_string)
    except (TypeError, ValueError) as e:
        raise ValueError("Invalid Base64 string provided.") from e

    output_dir = create_dir("wav")

    output_file_path = os.path.join(output_dir, output_filename)

    try:
        with open(output_file_path, "wb") as wav_file:
            wav_file.write(audio_data)
    except FileNotFoundError as e:
        raise FileNotFoundError(
            f"Output directory not found: {output_file_path}"
        ) from e
    except IOError as e:
        raise IOError(f"Failed to write to file {output_file_path}: {e}") from e

    return output_file_path


def denoise_audio(data: dict, index: int) -> str:
    """Processes raw audio (WAV) and returns denoised audio
    encoded as base64 string.
    """
    model, df_state, suffix = init_df(post_filter=True)

    # Save unenhanced audio
    output_filename = f"unenhanced_audio_{suffix}_{index}.wav"
    output_file_path = save_base64_as_wav(data["noisy_audio"], output_filename)

    # Load and enhance audio
    audio, _ = load_audio(output_file_path, sr=df_state.sr())
    enhanced = enhance(model, df_state, audio)

    # Save enhanced audio
    enhanced_output_filename = f"enhanced_audio_{suffix}_{index}.wav"
    output_dir = create_dir("wav-enhanced")

    save_audio(enhanced_output_filename, enhanced, df_state.sr(), output_dir)

    # Encode unenhanced audio to base64 for transmission
    denoised_audio = encode_wav_to_base64(output_file_path)

    # Delete the (un)enhanced files after processing
    # delete_file(os.path.join(output_dir, unenhanced_filename))
    # delete_file(os.path.join(output_dir, enhanced_output_filename))

    return denoised_audio
