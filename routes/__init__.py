from flask import Blueprint

photos_bp = Blueprint('photos', __name__)

# Import and register routes below
from . import photos
