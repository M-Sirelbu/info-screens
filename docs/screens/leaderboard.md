# Leaderboard

## Behavior

The Leaderboard is a public-facing display screen, requiring no authentication. It is intended for spectators viewing on large screens (40–75 inch displays) and should feature a button to enter full-screen mode.

The leaderboard shows information for the **currently active race session**. After a race session ends, it continues to display the last session's results until the next race session becomes safe to start, so drivers can review their times.

The leaderboard displays:

- A list of all cars and drivers in the current race session, ordered by fastest lap time
- The fastest lap time recorded for each car
- The current lap number for each car (lap 1 begins when the car crosses the lap line for the first time)
- The remaining time on the race countdown timer
- The current flag status (color indication of the race mode: safe/hazard/danger/finish)
- If no race session is active, no session data is shown

The leaderboard does not send any data to the server, it is a read-only display.

## Communication from server to client

- **`sessions:updated`**  updates the upcoming/current session information (used to know which session is active and who is racing)
- **`race:started`**  signals that a new race has begun; leaderboard switches to the current race data
- **`race:modeChanged`**  updates the displayed flag color. Payload: `{ mode: "safe" | "hazard" | "danger" | "finish" }`
- **`timer:tick`**  sent every second by the server. Payload: `{ remainingSeconds }`. The leaderboard uses this to display remaining race time
- **`leaderboard:updated`**  sent whenever a lap is recorded. Payload includes the full ordered leaderboard: `[{ carNumber, driverName, fastestLap, currentLap }]`
- **`session:ended`**  signals the race session has ended; leaderboard freezes the last results until the next race becomes active

## Communication from client to server

None, the leaderboard is a read-only display. It establishes a Socket.IO connection to receive real-time updates but sends no messages.
