# Flask + MongoDB Backend

## Project Structure

- `app.py`: Main Flask application and MongoDB connection
- `models/`: For database models (empty for now)
- `routes/`: For route definitions (empty for now)
- `.env.example`: Example environment file for MongoDB URI

## Setup

1. Copy `.env.example` to `.env` and set your MongoDB URI:
   ```bash
   cp .env.example .env
   # Edit .env to set your MongoDB URI
   ```
2. Install dependencies:
   ```bash
   pip install flask pymongo python-dotenv
   ```
3. Run the server:
   ```bash
   python app.py
   ```

## Notes

- The app loads the MongoDB URI from the `.env` file using `python-dotenv`.
- MongoDB is accessed via PyMongo.
- Extend `models/` and `routes/` as your project grows.
