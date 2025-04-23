from flask import Blueprint, request, jsonify, current_app, send_from_directory
from bson import ObjectId
from models.photo import photo_schema
import os
from services.face_service import process_faces_batch

photos_bp = Blueprint('photos', __name__)

@photos_bp.route('/upload', methods=['POST'])
def upload_photos():
    db = current_app.db
    files = request.files.getlist('photos')
    if not files:
        return jsonify({'error': 'No files uploaded'}), 400
    uploaded = []
    for file in files:
        ext = os.path.splitext(file.filename)[1]
        filename = f"{ObjectId()}{ext}"
        filepath = os.path.join(current_app.config['PHOTOES_FOLDER'], filename)
        file.save(filepath)
        photo_doc = {
            'filename': filename,
            'tags': [],
            'people': [],
            'capture_date': None,
            'location': None
        }
        result = db.photos.insert_one(photo_doc)
        uploaded.append(str(result.inserted_id))
    return jsonify({'uploaded': uploaded}), 201

@photos_bp.route('/', methods=['GET'])
def list_photos():
    db = current_app.db
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    skip = (page - 1) * per_page
    total = db.photos.count_documents({})
    photos = list(db.photos.find().skip(skip).limit(per_page))
    # Convert ObjectId in people.personname to str for JSON serialization
    for photo in photos:
        if '_id' in photo:
            photo['_id'] = str(photo['_id'])
        if 'people' in photo:
            for p in photo['people']:
                if isinstance(p.get('personname'), ObjectId):
                    p['personname'] = str(p['personname'])
    return jsonify({'total': total, 'page': page, 'per_page': per_page, 'photos': photos})

@photos_bp.route('/<photo_id>', methods=['GET'])
def get_photo(photo_id):
    db = current_app.db
    try:
        obj_id = ObjectId(photo_id)
    except Exception:
        return jsonify({'error': 'Invalid photo_id'}), 400
    photo = db.photos.find_one({'_id': obj_id})
    if not photo:
        return jsonify({'error': 'Photo not found'}), 404
    # Convert ObjectId in people.personname to str for JSON serialization
    people = photo.get('people', [])
    for p in people:
        if isinstance(p.get('personname'), ObjectId):
            p['personname'] = str(p['personname'])
    photo['people'] = people
    return jsonify(photo_schema(photo))

@photos_bp.route('/file/<filename>', methods=['GET'])
def get_photo_file(filename):
    return send_from_directory(filename)

@photos_bp.route('/uploads/<path:filename>', methods=['GET'])
def serve_uploads(filename):
    uploads_folder = current_app.config['UPLOAD_FOLDER']
    return send_from_directory(uploads_folder, filename)

@photos_bp.route('/list', methods=['GET'])
def list_images():
    db = current_app.db
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    skip = (page - 1) * per_page
    total = db.photos.count_documents({})
    photos = list(db.photos.find().skip(skip).limit(per_page))
    for photo in photos:
        photo['_id'] = str(photo['_id'])
        if 'people' in photo:
            for p in photo['people']:
                if isinstance(p.get('personname'), ObjectId):
                    p['personname'] = str(p['personname'])
    return jsonify({'total': total, 'page': page, 'per_page': per_page, 'photos': photos})

@photos_bp.route('/person-images/<person_id>', methods=['GET'])
def list_person_images(person_id):
    db = current_app.db
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    skip = (page - 1) * per_page
    try:
        person_obj_id = ObjectId(person_id)
    except Exception:
        return jsonify({'error': 'Invalid person_id'}), 400
    query = {'people.personname': person_obj_id}
    total = db.photos.count_documents(query)
    photos = list(db.photos.find(query).skip(skip).limit(per_page))
    for photo in photos:
        photo['_id'] = str(photo['_id'])
        if 'people' in photo:
            for p in photo['people']:
                if isinstance(p.get('personname'), ObjectId):
                    p['personname'] = str(p['personname'])
    return jsonify({'total': total, 'page': page, 'per_page': per_page, 'photos': photos})

@photos_bp.route('/<photo_id>/add-person', methods=['POST'])
def add_person_in_image(photo_id):
    db = current_app.db
    data = request.json
    person_id = data.get('person_id')
    x = data.get('x')
    y = data.get('y')
    w = data.get('w')
    h = data.get('h')
    if not all([person_id, x, y, w, h]):
        return jsonify({'error': 'Missing required fields'}), 400
    try:
        person_obj_id = ObjectId(person_id)
        photo_obj_id = ObjectId(photo_id)
    except Exception:
        return jsonify({'error': 'Invalid id format'}), 400
    person = db.person.find_one({'_id': person_obj_id})
    if not person:
        return jsonify({'error': 'Person not found'}), 404
    update_result = db.photos.update_one(
        {'_id': photo_obj_id},
        {'$push': {'people': {'personname': person_obj_id, 'x': x, 'y': y, 'w': w, 'h': h}}}
    )
    if update_result.modified_count == 0:
        return jsonify({'error': 'Photo not found or not updated'}), 404
    db.person.update_one({'_id': person_obj_id}, {'$inc': {'photoescount': 1}})
    return jsonify({'message': 'Person added to image'}), 200

@photos_bp.route('/<photo_id>/change-person', methods=['POST'])
def change_person_in_image(photo_id):
    db = current_app.db
    data = request.json
    old_person_id = data.get('old_person_id')
    new_person_id = data.get('new_person_id')
    x = data.get('x')
    y = data.get('y')
    w = data.get('w')
    h = data.get('h')
    if not all([old_person_id, new_person_id, x, y, w, h]):
        return jsonify({'error': 'Missing required fields'}), 400
    try:
        old_person_obj_id = ObjectId(old_person_id)
        new_person_obj_id = ObjectId(new_person_id)
        photo_obj_id = ObjectId(photo_id)
    except Exception:
        return jsonify({'error': 'Invalid id format'}), 400
    result = db.photos.update_one(
        {'_id': photo_obj_id, 'people': {'$elemMatch': {'personname': old_person_obj_id, 'x': x, 'y': y, 'w': w, 'h': h}}},
        {'$set': {'people.$.personname': new_person_obj_id}}
    )
    if result.modified_count == 0:
        return jsonify({'error': 'Person in image not found or not updated'}), 404
    db.person.update_one({'_id': old_person_obj_id}, {'$inc': {'photoescount': -1}})
    db.person.update_one({'_id': new_person_obj_id}, {'$inc': {'photoescount': 1}})
    return jsonify({'message': 'Person in image changed'}), 200
