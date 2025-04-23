# models/photo.py
from bson import ObjectId

def photo_schema(photo):
    return {
        '_id': str(photo['_id']),
        'filename': photo.get('filename'),
        'tags': photo.get('tags', []),
        'people': photo.get('people', []),
        'capture_date': photo.get('capture_date'),
        'location': photo.get('location'),
    }
