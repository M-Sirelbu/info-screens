# Racetrack Info Screens

Real-time race operations and public information system for Beachside Racetrack.

This project is designed to replace several manual trackside processes with a Socket.IO-powered system that lets employees control races and lets drivers and spectators see live race information on dedicated screens.

## Project structure

.
├── backend        # Node.js + Socket.IO server
├── docs           # documentation (optional)
└── frontend
    └── app        # Angular application

---

## Setup

Install dependencies in both frontend and backend:

cd frontend/app
npm install

cd ../../backend
npm install

cd ..

---

## Environment variables

The backend will not start without these:

export receptionist_key=your_value_here
export observer_key=your_value_here
export safety_key=your_value_here

Use any value for access keys when running locally.  
The same value must be entered in the UI.

### NGROK

If using ngrok:

export NGROK_AUTHTOKEN=your_token_here

For local use:

export NGROK_AUTHTOKEN=none

---

## Run

From project root:

npm start

Development mode:

npm run dev

Works in Linux / WSL (uses `export` syntax)

---

## URLs

Frontend (dev): http://localhost:4200  
Backend: http://localhost:8000  

---

## Routes

### Employee (requires access key)

- /front-desk  
- /race-control  
- /lap-line-tracker  

### Public

- /leader-board  
- /next-race  
- /race-countdown  
- /race-flags  

---

## Tech

- Angular  
- Node.js  
- Express  
- Socket.IO  

---

## Notes

- Frontend location: `frontend/app`  
- Backend location: `backend`  
- Root scripts build frontend and start backend  
- `npm start` → production (10 min race)  
- `npm run dev` → development (1 min race)  