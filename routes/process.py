from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from models.person import person_schema
import os
from threading import Thread, Event
from services.face_service import process_faces_batch

process_bp = Blueprint('process', __name__)
process_running = Event()
process_thread = None

@process_bp.route('/start', methods=['POST'])
def start_face_process():
    global process_thread
    if process_running.is_set():
        return jsonify({'message': 'Process already running'}), 200
    process_running.set()
    app = current_app._get_current_object()
    def run_process():
        with app.app_context():
            db = app.db
            while process_running.is_set():
                process_faces_batch(db)
                break  # Remove this break for continuous processing
    process_thread = Thread(target=run_process, daemon=True)
    process_thread.start()
    return jsonify({'message': 'Face processing started'}), 200

@process_bp.route('/stop', methods=['POST'])
def stop_face_process():
    if not process_running.is_set():
        return jsonify({'message': 'Process not running'}), 400
    process_running.clear()
    return jsonify({'message': 'Face processing stopped'}), 200
