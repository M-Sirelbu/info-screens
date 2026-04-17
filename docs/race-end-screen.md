# Race End Screen (Safety Officer)

## Overview

The Race End Screen is used by the safety officer to stop the race.

When the race is stopped, all systems and screens must reflect that the race has ended.

---

## What the safety officer does

- Presses the "Stop Race" button
- Ends the race immediately

---

## What is sent to the server

- Event: `race:end`

---

## What the server does

- Validates that a race is currently active
- Stops the race
- Finalizes race data (laps, results)
- Broadcasts race end event to all clients

---

## What clients receive

- Event: `race:ended`

---

## What must happen

- Timer stops
- Lap counting stops
- Leaderboard is finalized
- Screens show that the race has ended

---

## Result

- Race is fully stopped
- Results are fixed and visible
- System prepares for next phase

---

## Event Flow

1. Safety officer presses "Stop Race"  
2. Client sends `race:end` to server  
3. Server validates and stops the race  
4. Server broadcasts `race:ended`  
5. All screens update  