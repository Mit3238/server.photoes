import os
from flask import Flask, jsonify, current_app
from pymongo import MongoClient
from config import Config
from dotenv import load_dotenv
from threading import Thread, Event
from services.face_service import process_faces_batch

def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object(Config)

    # MongoDB connection
    app.mongo_client = MongoClient(app.config['MONGO_URI'])
    app.db = app.mongo_client.get_default_database()

    # Ensure upload folders exist
    os.makedirs(app.config['PHOTOES_FOLDER'], exist_ok=True)
    os.makedirs(app.config['FACES_FOLDER'], exist_ok=True)

    # Register blueprints
    from routes.photos import photos_bp
    from routes.persons import persons_bp
    from routes.process import process_bp
    app.register_blueprint(photos_bp, url_prefix='/api/photos')
    app.register_blueprint(persons_bp, url_prefix='/api/persons')
    app.register_blueprint(process_bp, url_prefix='/api/process')

    @app.route('/')
    def home():
        return 'Flask + MongoDB backend is running!'


    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)