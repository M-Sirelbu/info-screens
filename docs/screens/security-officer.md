## Overview

The Race Control interface is used to manage the race in real time.  
The safety officer authenticates before access, starts the race, controls race modes, responds to hazards, and ends the session.

All actions are sent to the server, which distributes updates to all connected screens.

---

## Authentication

Before using the interface, the safety officer must enter an access key.

- The key is sent to the server (`auth:login`)
- If incorrect:
  - the server responds after 500ms delay
  - an error message is shown
- If correct:
  - the real-time connection is established

---

## Starting the race

The safety officer starts the race using the start command.

Client sends:
- `race:start`

Server actions:
- sets race mode to "safe"
- starts the timer
- switches all displays to current race
- locks front desk editing

---

## Timer and race state

The server manages the timer and race state.

Server sends:
- `race:status` (idle / running / finished)
- `timer:update` (remaining time)

The Race Control interface displays this information.

---

## Race mode control

The safety officer controls race modes:

- Safe → green
- Hazard → yellow
- Danger → red
- Finish → chequered

Client sends:
- `race:mode`
  - mode: "safe" | "hazard" | "danger" | "finish"

Server:
- broadcasts mode to all screens
- updates flag display in real time

---

## Hazard handling

If a dangerous situation occurs:

Client sends:
- `race:mode` = "danger" or "hazard"

Server:
- updates all screens
- ensures drivers receive correct instructions

---

## Ending the race

The race ends either:
- when the timer reaches zero
- or when the safety officer finishes the race

Client sends:
- `race:finish`

Server:
- sets mode to "finish"
- stops timer
- calculates results
- sends leaderboard to all screens

After finish mode:
- race mode cannot be changed

---

## Ending the session

After all cars return to the pit lane:

Client sends:
- `session:end`

Server:
- prepares next session
- updates next race screen
- sets system to safe state

---

## Summary

Safety Officer:
- authenticates before access
- starts and finishes races
- controls race modes
- ensures safety

Server:
- manages race state and timer
- calculates lap results
- distributes real-time updates to all screens