import json
import os

DB_PATH = "media/history.json"

def ya_enviado(video_id):
    if not os.path.exists(DB_PATH):
        return False
    with open(DB_PATH, "r") as f:
        history = json.load(f)
    return video_id in history

def registrar_envio(video_id):
    history = []
    if os.path.exists(DB_PATH):
        with open(DB_PATH, "r") as f:
            history = json.load(f)
    
    history.append(video_id)
    # Mantenemos solo los últimos 500 registros para no pesar
    with open(DB_PATH, "w") as f:
        json.dump(history[-500:], f)
