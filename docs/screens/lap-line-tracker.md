# Behavior

Used to record laps for each car.

Displays one button per car in the current session.

Buttons:
- active during race and finish mode
- disabled after session ends

Requires authentication before usage.

# Communication from server to client

- auth_request
- auth_response

- session_state

## Payload

- sessionId
- cars[] (number)
- mode (SAFE | HAZARD | DANGER | FINISH)
- sessionEnded (boolean)

# Communication from client to server

- auth

## Payload

- accessKey

---

- lap

## Payload

- car (number)
- timestamp (optional)