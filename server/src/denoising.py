import base64
import os

from df.enhance import enhance, init_df, load_audio, save_audio


def encode_wav_to_base64(file_path):
    with open(file_path, "rb") as audio_file:
        audio_data = audio_file.read()

    base64_audio = base64.b64encode(audio_data).decode("utf-8")

    return base64_audio


def save_base64_as_wav(base64_string, output_filename):
    audio_data = base64.b64decode(base64_string)

    current_dir = os.path.dirname(__file__)

    output_dir = os.path.join(current_dir, "wav")

    os.makedirs(output_dir, exist_ok=True)

    output_file_path = os.path.join(output_dir, output_filename)

    with open(output_file_path, "wb") as wav_file:
        wav_file.write(audio_data)

    return output_file_path


def denoise_audio(data):
    model, df_state, suffix = init_df(post_filter=True)

    output_filename = f"unenhanced_audio_{suffix}.wav"

    output_file_path = save_base64_as_wav(data["noisy_audio"], output_filename)

    audio, _ = load_audio(output_file_path, sr=df_state.sr())

    enhanced = enhance(model, df_state, audio)

    # Save to disk
    save_audio(f"enhanced_audio_{suffix}.wav", enhanced, df_state.sr())

    # Retrieve Base64 string for transmission to client
    denoised_audio = encode_wav_to_base64(output_file_path)

    return denoised_audio
