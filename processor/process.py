import os
import json
import subprocess
from config import VIDEO_TEMP, HISTORY_DB, MAX_DURATION

def es_nuevo(video_id):
    if not os.path.exists(HISTORY_DB): return True
    with open(HISTORY_DB, "r") as f:
        try:
            history = json.load(f)
            return video_id not in history
        except: return True

def registrar_video(video_id):
    history = []
    if os.path.exists(HISTORY_DB):
        with open(HISTORY_DB, "r") as f:
            try: history = json.load(f)
            except: pass
    history.append(video_id)
    with open(HISTORY_DB, "w") as f:
        json.dump(history[-500:], f)

def procesar_video(path):
    if not os.path.exists(VIDEO_TEMP): os.makedirs(VIDEO_TEMP)
    output = path.replace(".mp4", "_pro.mp4")
    # Recorte ultra rápido con FFmpeg
    cmd = f'ffmpeg -i "{path}" -t {MAX_DURATION} -c copy "{output}" -y -loglevel quiet'
    os.system(cmd)
    return output
