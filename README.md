# Flask + MongoDB Backend

## Project Structure

- `app.py`: Main Flask application and MongoDB connection
- `models/`: For database models (e.g., `photo.py`, `person.py`)
- `routes/`: For API route definitions (e.g., `photos.py`, `persons.py`)
- `services/`: For business logic (e.g., `face_service.py`)
- `frontend/`: Contains the HTML, CSS, and JavaScript for the user interface.
- `.env.example`: Example environment file for MongoDB URI

## Setup

1. Copy `.env.example` to `.env` and set your MongoDB URI:
   ```bash
   cp .env.example .env
   # Edit .env to set your MongoDB URI
   ```
2. Install dependencies:
   ```bash
   pip install flask pymongo python-dotenv opencv-python face_recognition # Add other dependencies as needed
   ```
3. Run the server:
   ```bash
   python app.py
   ```

## Frontend

The `frontend/` directory contains the user interface for the photo application, built using plain HTML, CSS, and JavaScript. It interacts with the Flask backend via API calls.

### Running the Frontend

Since the Flask application is now configured to serve the frontend files:

1.  **Start the Flask backend server:**
    ```bash
    python app.py
    ```
2.  **Access the application:** Open your web browser and navigate to the root URL of the Flask server (usually `http://127.0.0.1:5000/`). The homepage (`index.html`) will be served directly.

### Frontend Pages

-   `index.html`: The homepage, allowing users to upload new photos, start/stop background face processing, view a list of recognized persons, and see a grid of recent photos.
-   `person.html`: Shows all photos associated with a specific person and allows editing the person's name. Accessed by clicking a person on the homepage.
-   `photo.html`: Displays a single photo along with bounding boxes and names for any recognized people within that photo. Accessed by clicking a photo thumbnail.

## Notes

- The app loads the MongoDB URI from the `.env` file using `python-dotenv`.
- MongoDB is accessed via PyMongo.
- Face detection and recognition logic is handled by the `face_recognition` library and `services/face_service.py`.
