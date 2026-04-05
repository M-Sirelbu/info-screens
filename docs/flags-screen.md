# Flags Screen (Safety Officer)

## Overview

The Flags Screen is used by the safety officer to control race conditions in real time.

The selected flag is broadcast to all connected screens, ensuring that drivers and spectators see the current race status immediately.

---

## Available Flags

- Green – race is active
- Yellow – caution, hazard on track
- Red – race is stopped
- Finish – race has ended

---

## What the safety officer does

- Selects a flag using the interface
- Changes race condition instantly

---

## What is sent to the server

When a flag is selected:

- Event: `race:flag`
- Data:
  - `flag` (green | yellow | red | finish)

---

## What the server does

- Updates the current race state
- Stores the active flag
- Broadcasts the update to all clients

---

## What clients receive

- Event: `flag:updated`
- Data:
  - `flag` (current flag)

---

## What must happen

- All screens update immediately
- Green → race continues
- Yellow → caution mode
- Red → race stops
- Finish → race ends

---

## Result

- All participants see the same race state
- Safety officer controls race flow centrally
- System stays synchronized across all screens