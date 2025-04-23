import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGO_URI = os.getenv('MONGO_URI')
    UPLOAD_FOLDER = 'uploads'
    PHOTOES_FOLDER = os.path.join(UPLOAD_FOLDER, 'photoes')
    FACES_FOLDER = os.path.join(UPLOAD_FOLDER, 'faces')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB upload limit
