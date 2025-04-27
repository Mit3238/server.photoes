import os
from flask import Flask, jsonify, current_app, send_from_directory # Added send_from_directory
from pymongo import MongoClient
from config import Config
from dotenv import load_dotenv
from threading import Thread, Event
from services.face_service import process_faces_batch

def create_app():
    load_dotenv()
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config['FRONTEND_FOLDER'] = 'frontend' # Added frontend folder config

    # MongoDB connection
    app.mongo_client = MongoClient(app.config['MONGO_URI'])
    app.db = app.mongo_client.get_default_database()

    # Ensure upload folders exist
    os.makedirs(app.config['PHOTOES_FOLDER'], exist_ok=True)
    os.makedirs(app.config['FACES_FOLDER'], exist_ok=True)

    # Ensure frontend folder exists (optional, good practice)
    os.makedirs(app.config['FRONTEND_FOLDER'], exist_ok=True)

    # Register API blueprints
    from routes.photos import photos_bp
    from routes.persons import persons_bp
    from routes.process import process_bp
    app.register_blueprint(photos_bp, url_prefix='/api/photos')
    app.register_blueprint(persons_bp, url_prefix='/api/persons')
    app.register_blueprint(process_bp, url_prefix='/api/process')

    # --- Frontend Serving Routes ---

    @app.route('/')
    def serve_index():
        return send_from_directory(app.config['FRONTEND_FOLDER'], 'index.html')

    @app.route('/person')
    def serve_person_page():
        return send_from_directory(app.config['FRONTEND_FOLDER'], 'person.html')

    @app.route('/photo')
    def serve_photo_page():
        return send_from_directory(app.config['FRONTEND_FOLDER'], 'photo.html')

    # Catch-all route for static files (CSS, JS, images, etc.)
    # IMPORTANT: This should come AFTER specific HTML routes
    @app.route('/<path:filename>')
    def serve_static_files(filename):
        # Basic security check: prevent accessing files outside the frontend folder
        if ".." in filename or filename.startswith("/"):
             return "Not Found", 404
        return send_from_directory(app.config['FRONTEND_FOLDER'], filename)

    # --- End Frontend Serving Routes ---

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)