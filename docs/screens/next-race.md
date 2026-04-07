# Behavior

Displays the upcoming race session.

Read-only screen.
Receives real-time updates from the server.

# Communication from server to client

- next_session

## Payload

- sessionId
- drivers[] (name)
- cars[] (number)
- status (string)

# Communication from client to server

- connect (Socket.IO)

No other events are sent from this screen.