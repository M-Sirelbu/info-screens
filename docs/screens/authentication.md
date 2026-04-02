# Behavior

This is a subscreen, enabled for the screens that require authentication. This will be built into those screens or it can be a standalone screen, this can be decided during implementation.

The screen must prompt the user for an access key. This key must be sent to the server. If the access key is wrong, the screen must prompt for the access key again.

Those access keys must be defined when the server starts. A delay of 500ms server-side must be present in case of a wrong key.

## Security considerations:

- Socket.IO uses HTTP, WebSockets and WebTransport. All of those are compatible with HTTPS/TLS based security.
- In case of a public deployment of the project, a HTTPS configuration is highly recommended anyway.
- In case of a private deployment, an insecure configuration may be fine, if the network is properly secured. The network can reasonably be considered to be private, because all of the endpoints using the service are controlled by Beachside Racetrack.
- This project is meant to be an MVP.

Therefore: transferring the access key via plaintext is deemed acceptable for the time being.

# Communication from server to client

- An authentication request (in case of a severed connection, re-authentication may be necessary. Therefore, the authentication process should be commenced by the server)

- An authentication response (success, failure)

# Communication from client to server

- Sending the access key (plaintext)