# Front Desk

## Behavior

The Front Desk is a receptionist-facing interface, accessible only after successful authentication. It allows the receptionist to manage upcoming race sessions and the drivers within them.

The receptionist can:

- See a list of all upcoming race sessions
- Add and remove race sessions
- Add, edit, and remove drivers within a session
- Driver names must be unique within each race session
- When a driver is added, they are automatically assigned a car number (1-8)
- A session and its drivers cannot be edited once the race is safe to start
- Past race sessions are not shown (erased from the system)

This interface requires an access key before the real-time connection is established (see authentication spec).

## Communication from server to client

- **Authentication request** server initiates the auth flow on connection
- **Authentication response** success or failure (with 500ms delay on failure)
- **`sessions:updated`** sent to all clients whenever sessions change (driver added/removed, session added/removed). Payload includes the full list of upcoming sessions with drivers and assigned car numbers
- **`race:started`** notifies that the current session has started; front desk must disable editing for that session

## Communication from client to server

- **Access key** plaintext, sent on connection to authenticate
- **`session:create`** receptionist adds a new race session. No payload required beyond a session identifier
- **`session:remove`** receptionist deletes an upcoming session. Payload: `{ sessionId }`
- **`driver:add`** adds a driver to a session. Payload: `{ sessionId, driverName }`. Server assigns the car number automatically
- **`driver:edit`** updates a driver's name. Payload: `{ sessionId, driverName, newName }`
- **`driver:remove`** removes a driver from a session. Payload: `{ sessionId, driverName }`
