import os
import cv2
import uuid
import numpy as np
import face_recognition
from bson import ObjectId
from flask import current_app

# matching threshold
THRESHOLD = 0.6

def detect_and_process_faces(photo_doc, db, all_persons, person_encodings):
    """
    Detect faces in the given photo, compare with persons in db, and update photo and person collections.
    """
    photoes_folder = current_app.config['PHOTOES_FOLDER']
    faces_folder = current_app.config['FACES_FOLDER']
    filename = photo_doc['filename']
    filepath = os.path.join(photoes_folder, filename)
    if not os.path.exists(filepath):
        db.photos.update_one({'_id': photo_doc['_id']}, {'$set': {'facechecked': True}})
        return
    image = cv2.imread(filepath)
    rgb = image[:, :, ::-1]
    # detect face boxes and compute encodings
    locations = face_recognition.face_locations(rgb)
    encodings = face_recognition.face_encodings(rgb, locations)
    people = []
    for (top, right, bottom, left), face_encoding in zip(locations, encodings):
        # match against precomputed person_encodings
        matched_person_id = None
        if person_encodings:
            dists = face_recognition.face_distance(
                [pe['encoding'] for pe in person_encodings], face_encoding
            )
            idx = np.argmin(dists)
            if dists[idx] < THRESHOLD:
                matched_person_id = person_encodings[idx]['_id']

        # crop & save face image
        x, y, w, h = left, top, right-left, bottom-top
        face_img = image[y:y+h, x:x+w]
        facefile_temp = os.path.join(current_app.config['FACES_FOLDER'],
                                     f"temp_face_{uuid.uuid4().hex[:8]}.jpg")
        cv2.imwrite(facefile_temp, face_img)

        if matched_person_id:
            db.person.update_one({'_id': matched_person_id}, {'$inc': {'photoescount': 1}})
            os.remove(facefile_temp)
            person_id = matched_person_id
        else:
            personname = f"person_{uuid.uuid4().hex[:8]}"
            facefile_path = os.path.join(current_app.config['FACES_FOLDER'],
                                         f"face_{personname}.jpg")
            os.rename(facefile_temp, facefile_path)
            result = db.person.insert_one({
                'personname': personname,
                'facefile': facefile_path,
                'photoescount': 1
            })
            person_id = result.inserted_id

        people.append({
            'personname': person_id,
            'x': x, 'y': y, 'w': w, 'h': h
        })
    db.photos.update_one(
        {'_id': photo_doc['_id']},
        {'$set': {'people': people, 'facechecked': True}}
    )

def process_faces_batch(db):
    """
    Process all photos in the DB that have not been face-checked.
    """
    all_persons = list(db.person.find())
    # precompute encodings for existing persons
    person_encodings = []
    for p in all_persons:
        ff = p.get('facefile')
        if ff and os.path.exists(ff):
            try:
                img = face_recognition.load_image_file(ff)
                encs = face_recognition.face_encodings(img)
                if encs:
                    person_encodings.append({'_id': p['_id'], 'encoding': encs[0]})
            except Exception as e:
                print(f"Error processing face file {ff}: {str(e)}")
                continue

    photos = db.photos.find({'$or': [{'facechecked': False}, {'facechecked': {'$exists': False}}]})
    for photo in photos:
        try:
            detect_and_process_faces(photo, db, all_persons, person_encodings)
            print(f"Successfully processed photo: {photo.get('filename')}")
        except Exception as e:
            print(f"Error processing photo {photo.get('_id')}: {str(e)}")
            # Mark as checked with error flag to avoid reprocessing problematic photos
            db.photos.update_one(
                {'_id': photo['_id']},
                {'$set': {'facechecked': True, 'processing_error': str(e)}}
            )
