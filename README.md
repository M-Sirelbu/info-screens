# Racetrack Info Screens

Real-time race operations and public information system for Beachside Racetrack.

This project is designed to replace several manual trackside processes with a Socket.IO-powered system that lets employees control races and lets drivers and spectators see live race information on dedicated screens.

---

## Prerequisites

- Node.js  
- npm  
- Angular CLI (required because `npm start` runs `ng build`)

---

## Project structure

```bash
.
├── backend        # Node.js + Socket.IO server
├── docs           # documentation (optional)
└── frontend
    └── app        # Angular application
```
---

## Setup

Install dependencies in both frontend and backend:

```bash
cd frontend/app
npm install

cd ../../backend
npm install

cd ..
```
---

## Environment variables

The backend will not start without these:

```bash
export receptionist_key=your_value_here
export observer_key=your_value_here
export safety_key=your_value_here
```
Use any value for access keys when running locally.  
The same value must be entered in the UI.

---

### NGROK

If using ngrok:
```bash
export NGROK_AUTHTOKEN=your_token_here
```
For local use:
```bash
export NGROK_AUTHTOKEN=none
```
---

## Run

```bash
npm start
```
Development mode:

```bash
npm run dev
```
Open:

http://localhost:8000

---

## URLs

- http://localhost:8000 → main app  
- ngrok URL → printed in terminal
- http://localhost:4200 → frontend dev only

---

## Access Keys

- receptionist_key → Front Desk (session and driver setup)  
- safety_key → Race Control (start race, change modes, end session)  
- observer_key → Lap-line Tracker (record laps)  

---

## Routes

### Employee (requires access key)

- /front-desk → receptionist_key 
- /race-control  → safety_key  
- /lap-line-tracker  → observer_key 

### Public

- /leader-board  
- /next-race  
- /race-countdown  
- /race-flags  

---

## User Guide

### Front Desk (/front-desk)

- enter receptionist_key  
- create a race session  
- add drivers (max 8)  
- car numbers are assigned automatically  
- edit or remove drivers  

Expected result:  
Next Race screen updates with drivers and car assignments.

---

### Race Control (/race-control)

- enter safety_key  
- press Start to begin race  
- change race mode:
  - Safe → green  
  - Hazard → yellow  
  - Danger → red  
  - Finish → chequered  
- end session after race  

Expected result:  
- countdown starts  
- leaderboard switches to live race  
- flag screen updates immediately  

---

### Lap-line Tracker (/lap-line-tracker)

- enter observer_key  
- tap car number on each lap  

Expected result:  
- lap count increases  
- fastest lap updates  
- leaderboard updates in real time  

---

### Public Screens

- /leader-board → drivers, laps, fastest lap, race mode  
- /next-race → upcoming session and car assignments  
- /race-countdown → remaining race time  
- /race-flags → current flag display  

All screens update automatically in real time.

---

## Review Flow (how to test)

1. Open /front-desk  
   → create session and add drivers  

2. Open /next-race  
   → verify drivers and car numbers  

3. Open /race-control  
   → start race  

4. Open /race-countdown and /race-flags  
   → verify timer and flags  

5. Open /lap-line-tracker  
   → record laps  

6. Open /leader-board  
   → verify ranking updates  

7. Finish race in Race Control  
   → verify results remain visible  

---

## Race Lifecycle

1. Session is created (Front Desk)  
2. Drivers are assigned cars  
3. Race is started (Race Control)  
4. Countdown begins  
5. Laps are recorded (Lap-line Tracker)  
6. Leaderboard updates live  
7. Race enters Finish mode  
8. Session is ended  
9. Results remain visible until next race  

---

## Interface Behaviour

The app has a home screen with navigation to all screens.
From any screen, it is possible to navigate to other screens without manually entering URLs.

---

## Tech

- Angular CLI 
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