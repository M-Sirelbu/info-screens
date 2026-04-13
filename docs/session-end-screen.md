# Session End Screen (Safety Officer)

## Overview

The Session End Screen is used to fully close the race session.

This includes resetting the system and preparing for the next race.

---

## What the safety officer does

- Confirms session end
- Resets the system for the next race

---

## What is sent to the server

- Event: `session:end`

---

## What the server does

- Confirms all races are finished
- Resets race data
- Prepares system for next session
- Broadcasts session end event

---

## What clients receive

- Event: `session:ended`

---

## What must happen

- All race data is cleared or archived
- Screens reset
- System shows next race preparation

---

## Result

- Session is fully completed
- System is ready for a new race

---

## Event Flow

1. Safety officer confirms session end  
2. Client sends `session:end`  
3. Server resets system  
4. Server broadcasts `session:ended`  
5. Screens reset  