# Student Activity Tracker

A full-stack web application built with React (Frontend) and Python Flask (Backend) that allows users to track student activities.

## Tech Stack

- **Frontend:** React, Vite, Axios
- **Backend:** Python, Flask, SQLite
- **Other:** Flask-CORS, REST API

## Features

- Add student activities (name, activity, hours)
- View all activities in a list
- Delete activities
- Summary section showing:
  - Total entries
  - Total hours
  - Most active student
- Input validation and error handling
- JSON responses with proper HTTP status codes

## Project Structure

```
student-activity-tracker/
├── backend/
│   └── app.py        # Flask REST API
├── frontend/
│   ├── src/
│   │   ├── App.jsx   # Main React component
│   │   └── App.css   # Styles
│   └── package.json
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /activities | Add a new activity |
| GET | /activities | Get all activities |
| DELETE | /activities/:id | Delete an activity |
| GET | /summary | Get summary stats |

## How to Run

### Backend
```bash
cd backend
pip install flask flask-cors
python app.py
```
Backend runs on: http://localhost:5000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on: http://localhost:5173


