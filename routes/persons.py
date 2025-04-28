from flask import Blueprint, request, jsonify, current_app
from bson import ObjectId
from models.person import person_schema
import os

persons_bp = Blueprint('persons', __name__)

@persons_bp.route('/list', methods=['GET'])
def list_persons():
    db = current_app.db
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    skip = (page - 1) * per_page
    total = db.person.count_documents({})
    persons = list(db.person.find())
    for person in persons:
        person['_id'] = str(person['_id'])
    return jsonify({'total': total, 'page': page, 'per_page': per_page, 'persons': persons})

@persons_bp.route('/<person_id>', methods=['GET'])
def get_person(person_id):
    db = current_app.db
    try:
        obj_id = ObjectId(person_id)
    except Exception:
        return jsonify({'error': 'Invalid person_id'}), 400
    person = db.person.find_one({'_id': obj_id})
    if not person:
        return jsonify({'error': 'Person not found'}), 404
    return jsonify(person_schema(person))

@persons_bp.route('/<person_id>', methods=['PATCH'])
def change_person_name_or_image(person_id):
    db = current_app.db
    data = request.json
    update_fields = {}
    if 'personname' in data:
        update_fields['personname'] = data['personname']
    if 'facefile' in data:
        update_fields['facefile'] = data['facefile']
    if not update_fields:
        return jsonify({'error': 'No fields to update'}), 400
    try:
        person_obj_id = ObjectId(person_id)
    except Exception:
        return jsonify({'error': 'Invalid person_id'}), 400
    result = db.person.update_one({'_id': person_obj_id}, {'$set': update_fields})
    if result.modified_count == 0:
        return jsonify({'error': 'Person not found or not updated'}), 404
    return jsonify({'message': 'Person updated'}), 200
