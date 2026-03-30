# Racetrack Info Screens

Real-time race operations and public information system for Beachside Racetrack.

This project is designed to replace several manual trackside processes with a Socket.IO-powered system that lets employees control races and lets drivers and spectators see live race information on dedicated screens.

## Project Overview

Beachside Racetrack needs an MVP that reduces reliance on staff while keeping race operations safe and easy to follow.

The system supports:

- race session setup at reception
- automatic driver-to-car assignment
- race start and race mode control
- lap tracking by car number
- live leaderboard updates for spectators
- next-race and countdown displays for drivers
- full-screen flag displays around the circuit
- password-protected employee interfaces

The application is intended to run as a Node.js server with Socket.IO for all real-time updates. Public and employee interfaces are exposed through first-level routes so they can be opened directly on tablets, laptops, and smart displays.

## Core MVP Features

### Reception / front desk

- View upcoming race sessions
- Add and remove race sessions
- Add, edit, and remove drivers in each session
- Enforce unique driver names within a race session
- Automatically assign each driver a car number

### Race control

- Start a race session
- Set race mode to `Safe`, `Hazard`, `Danger`, or `Finish`
- Automatically switch to `Finish` when the race timer expires
- End the race session once all cars are back in the pit lane

### Lap-line tracking

- Large tap targets for each active car
- One-button lap recording per car
- Real-time lap and fastest-lap calculation
- Tracking remains active during `Finish` mode
- Input becomes unavailable once the session is ended

### Public displays

- Live leaderboard
- Next race display with driver and car assignments
- Race countdown timer
- Track flag display for circuit screens
- Full-screen button on public-facing pages

## Race Rules Implemented

- Each session contains up to 8 drivers
- Each race lasts:
  - `10 minutes` in normal mode
  - `1 minute` when the server is started with `npm run dev`
- A driver is tracked through their assigned car number
- Lap 1 starts when the car crosses the lap line for the first time
- Leaderboard ranking is based on fastest lap time
- When a race finishes, the flag display switches to chequered mode
- Once a session enters `Finish`, it cannot return to another race mode
- The previous session's results remain visible until the next session is started

## Suggested Technology Stack

This assignment requires:

- Node.js
- Socket.IO

A practical implementation can use:

- Express for HTTP routes
- Socket.IO for real-time state updates
- Vanilla JS, React, Vue, or another browser frontend
- In-memory state for MVP storage

## Environment Variables

The server must not start unless all employee access keys are defined.

Suggested environment variables:

```bash
export RECEPTIONIST_KEY=8ded6076
export OBSERVER_KEY=662e0f6c
export SAFETY_KEY=a2d393bc
```

Optional variables:

```bash
export PORT=3000
export NODE_ENV=production
```

If any required key is missing, the server should exit with a clear error message that explains:

- which variables are required
- how to set them
- how to restart the server

## Installation

```bash
npm install
```

## Running the Server

Production mode:

```bash
npm start
```

Development mode with a 1-minute race timer:

```bash
npm run dev
```

Example:

```bash
export RECEPTIONIST_KEY=8ded6076
export OBSERVER_KEY=662e0f6c
export SAFETY_KEY=a2d393bc
npm start
```

## Route Structure

Each interface must be reachable through a first-level route.

### Employee interfaces

These views must ask for an access key before establishing the Socket.IO connection.

| Interface | Persona | Route |
| --- | --- | --- |
| Front Desk | Receptionist | `/front-desk` |
| Race Control | Safety Official | `/race-control` |
| Lap-line Tracker | Lap-line Observer | `/lap-line-tracker` |

### Public displays

| Interface | Persona | Route |
| --- | --- | --- |
| Leader Board | Guest / Spectator | `/leader-board` |
| Next Race | Race Driver | `/next-race` |
| Race Countdown | Race Driver | `/race-countdown` |
| Race Flags | Race Driver | `/race-flags` |

## Real-Time Behaviour

The application must not rely on polling.

All important state changes are pushed through Socket.IO in real time, including:

- session creation and editing
- driver updates
- car assignments
- race start
- race mode changes
- countdown timer updates
- lap line crossings
- current lap count changes
- fastest lap changes
- leaderboard resorting
- session end

## Access Control

Employee screens must be protected by role-specific access keys.

Requirements:

- access key prompt appears before the live connection is established
- each employee route uses its own access key
- wrong keys receive a response only after a `500ms` delay
- the interface shows an error and re-prompts for the key
- public routes do not require authentication

## User Guide

### 1. Configure upcoming races

Open `/front-desk`.

The receptionist can:

- create a new race session
- remove an unwanted session
- add drivers to a session
- edit or remove drivers
- confirm the automatically assigned car numbers

Expected result:

- the next race screen updates automatically
- the safety official can see the queued session

### 2. Announce the next race

Open `/next-race` on a public display in the guest or paddock area.

Drivers should see:

- the upcoming session
- their own names
- the car number they have been assigned

When a session becomes the active current race, `/next-race` should switch to the following queued session.

### 3. Start a race

Open `/race-control`.

The safety official should:

- brief the drivers
- press the start button when the track is safe

When the race starts:

- race mode becomes `Safe`
- the leaderboard switches to the live current race
- the race countdown begins
- the next-race display advances to the following session
- race mode controls become visible

### 4. Control track safety

From `/race-control`, the safety official can set:

- `Safe`
- `Hazard`
- `Danger`
- `Finish`

Public flag screens on `/race-flags` must react immediately:

- `Safe` -> solid green
- `Hazard` -> solid yellow
- `Danger` -> solid red
- `Finish` -> chequered black/white

### 5. Record lap crossings

Open `/lap-line-tracker` on a tablet.

The lap-line observer:

- taps the car number each time that car crosses the lap line
- uses large on-screen buttons to reduce missed inputs

The system updates in real time:

- current lap number
- fastest lap time
- leaderboard ordering

Buttons must remain active during `Finish` mode, because cars may still complete crossings before returning to the pit lane.

### 6. Follow the race as a spectator

Open `/leader-board`.

Spectators should see:

- current race drivers and cars
- current lap for each car
- fastest lap for each car
- remaining session time
- current race mode

Until the next race starts, the leaderboard should continue to show the last completed session's results.

### 7. Finish and end the session

The race reaches `Finish` when:

- the countdown reaches zero, or
- the safety official manually finishes the race

Once all cars are back in the pit lane, the safety official ends the session.

Expected result:

- the next session is queued for briefing
- race mode changes to `Danger`
- lap tracking input is disabled
- the next-race screen shows the current upcoming session and tells drivers to proceed to the paddock

## Interface Expectations

### Employee interfaces

- optimized for the role using the screen size available
- authenticated before real-time connection
- simple, high-contrast controls

### Public displays

- suitable for large screens
- readable at distance
- include a full-screen launch button
- minimal UI clutter

### Lap-line tracker

- supports portrait and landscape
- uses very large tap zones
- avoids small or crowded controls

## Data Model Suggestion

An implementation can keep the following state in memory:

- `sessions`
- `currentSessionId`
- `lastCompletedSessionId`
- `raceMode`
- `raceStartTime`
- `raceDurationMs`
- `cars`
- `lapEvents`

Each session can contain:

- session id
- ordered list of drivers
- assigned car number per driver
- race status
- lap count per car
- fastest lap per car

## Error Handling Expectations

Recommended handling:

- reject duplicate driver names within a session
- reject more than 8 drivers in a session
- reject actions that do not make sense for current race state
- prevent mode changes after `Finish`
- disable lap input after session end
- show a clear error if authentication fails
- fail fast if required environment variables are missing

## Persistence

Persistence is not required for the MVP.

If you implement the extra requirement, document:

- where the data is stored
- when it is written
- how the server restores state on restart

## Bonus / Extra Functionality

Optional extensions that can be added without changing default MVP behaviour:

- persistent storage
- receptionist-selected car assignments
- event audit log
- race history screen
- manual lap correction tools
- sound or visual alerts for race state changes

## Screenshots

Add screenshots here for the final submission.

Suggested captures:

- front desk session setup
- access key prompt
- race control during an active race
- lap-line tracker on tablet
- leaderboard during live timing
- next-race display
- race flag display in full screen

Example structure:

```md
## Screenshots

### Front Desk
![Front Desk](./docs/front-desk.png)

### Race Control
![Race Control](./docs/race-control.png)
```

## Testing Checklist

Before submission, verify:

- employee screens reject invalid keys after a 500ms delay
- server refuses to start if keys are missing
- race timer is 10 minutes in `npm start`
- race timer is 1 minute in `npm run dev`
- all public screens update live without refresh
- leaderboard ordering changes when fastest laps improve
- finish mode locks further mode changes
- lap buttons disable after session end
- previous results remain visible until the next race starts

## Deliverables

The final submission should include:

- complete source code
- configuration files
- this `README.md`
- any screenshots or extra documentation used in the user guide

## Notes

This README is written to match the assignment brief and can be used as the project's root documentation. If the implementation differs from the suggested structure above, update the route list, setup steps, screenshots, and feature notes so the README matches the actual codebase exactly.
