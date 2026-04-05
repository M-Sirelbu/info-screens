## Overview

The Race Control interface is used to manage the race in real time.  
The safety officer starts the race, monitors its progress, controls flag signals, and ends the race.

All actions go through the server, which distributes information to all connected screens.

---

## Starting the race

The safety officer starts the race by pressing the start button.  
The system sends information to the server about which session is being started.

The server confirms the start and notifies all connected screens.

After that:
- the front desk interface is locked  
- editing drivers is no longer allowed  
- the timer starts  
- all screens switch to race mode  

---

## Timer and time tracking

After the race starts, the server manages the timing.  
The safety officer does not calculate time manually.

The server continuously sends updates about the elapsed time.  
The Race Control interface displays this information.

---

## Monitoring the race

During the race, the server collects lap data (e.g. how many laps each car has completed).  
The Race Control interface receives this data and displays it as a leaderboard.

The safety officer does not enter lap data manually.

---

## Flag control

The safety officer can select the active track flag (e.g. green, yellow, red).

When a flag is selected, the information is sent to the server.  
The server then distributes the updated flag to all screens.

This ensures that all participants see the same flag state.

---

## Hazard notification

If a dangerous situation occurs on the track, the safety officer can trigger a warning.

This information is sent to the server, which then broadcasts it to all screens.

As a result:
- a warning message is displayed  
- the flag may be updated automatically (e.g. yellow flag)  

---

## Ending the race

The safety officer ends the race using the stop command.

The server:
- stops the timer  
- calculates the results  
- sends results to all screens  

After that:
- the final leaderboard is displayed  
- the race is considered finished  

---

## Preparing the next race

After the race ends, the safety officer prepares the next session.

The server updates the session list and sends it to all interfaces.

The safety officer can then start the next race cycle.

---

## Summary

Race Control (Safety Officer):
- starts and ends the race  
- controls flags  
- responds to hazards  

Server:
- manages time and lap data  
- calculates results  
- distributes information to all screens  