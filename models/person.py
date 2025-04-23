# models/person.py
from bson import ObjectId

def person_schema(person):
    return {
        '_id': str(person['_id']),
        'personname': person.get('personname'),
        'facefile': person.get('facefile'),
        'photoescount': person.get('photoescount', 0)
    }
