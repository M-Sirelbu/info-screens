# Racetrack info-screens API

## General information

The API is based on Socket.IO events.

All custom events are in the format of:

`"eventType", {}`

Where the JSON object contains the contents of the events, or any additional information.

For example:

```js
socket.emit("hello", {"contents": "world"});
```

Only the global namespace is used. For addressing different screens, rooms are used.

In case authentication is needed for a screen, the client will send its key with the room selection event.

The SocketIO server location will be the same domain as the frontend connection location.

## Initiating connection

Since the API uses only a single namespace, all events are sent to the same address. The server still needs to understand which webpage the request is from.

Therefore, after initializing the SocketIO connection, the client needs to emit a `"selectRoom"` event with their page path and key (if present) as the contents. This also applies for reconnections.

The `"selectRoom"` event must also have an acknowledgement, to communicate success and failure of initiating connection.

Example (client):

```js
const socket = io();

socket.on("connect", () => {
    socket.emit("selectRoom", {"room": "leader-board"}, (response) => {
        // response.status holds the status, in case of ok, continue with logic
    });
});
```

Example with access key (client):

```js
const socket = io();

socket.on("connect", () => {
    socket.emit("selectRoom", {
        "room": "front-desk",
        "key": "8ded6076"
    }, (response) => {
        // response.status holds the status, in case of ok, continue with logic, if invalid key, ask for key again
    });
});
```

Example for server:

```js
const io = new Server(.....);

// Add event listener to (re)connection
io.on("connection", (socket) => {
    // Listen for "selectRoom" event and bind a lambda function to it with the arguments and a callback function
    socket.on("selectRoom", (args, callback) => {
        if (args.room === "front-desk" && args.key === FRONT_DESK_KEY) {
            socket.join("front-desk");
            // Authentication success
            callback({status: "Success"});
        }
        else if (args.room === "leader-board") {
            socket.join("leader-board");
            // Connection success
            callback({status: "Success"});
        }
        else {
            // Authentication or connection failure
            callback({status: "Invalid Room"});
            or
            // delay 500ms before
            callback({status: "Invalid Access Key"});
        }
    });
});
```

Solving room selection and authentication in this way makes it resillient to short drops in connection requiring reconnection.

## Screen-specific events

### Examples of using those events

Most of those events require either a server sending a message to specific room(s) or a client sending a message to the server, either way, possibly getting an acknowledgement in return.

Here are some code examples for those cases to make development smoother.

#### Example 1. Server to client rooms with acknowledgement

Server-side:

```js
const io = new Server(.....);

...

// Several rooms can be used.
io.to("room1").to("room2").emit("eventType", {"status": "active"}, 
    // The response lambda can be omitted in case of no acknowledgement
    (response) => {
    // Code to run upon receiving an acknowledgement, for example:
    io.to("room3").emit("event", ..... );

    // response.status == "Success"
});
```

Client-side:

```js
const socket = io();

...

// In case of no acknowledgement, callback can be omitted.
socket.on("eventType", (args, callback) => {
    // Code to run upon receiving the event, for example, updating page contents
    // For an acknowledgement, use the callback function with the content
    callback({"status": "Success"});
});
```

#### Example 2. Client to server with acknowledgement

This is covered in the example of initiating connection. A minimal example is also here:

Server-side:

```js
const io = new Server(.....);

// Add event listener to (re)connection
io.on("connection", (socket) => {
    // Listen for event "eventType"
    // callback can be omitted in case of no acknowledgement
    socket.on("eventType", (args, callback) => {
        // Code for processing event, for example, updating variables, emitting new events
        // For authentication purposes, socket.rooms can be used to determine if the client has been added into a room with authentication during connection initiation
        // For an acknowledgement, use the callback function
        callback({"status": "Success"});
    });
});
```

```js
const socket = io();

socket.emit("eventType", {"status": "active"},
    // The response lambda can be omitted in case of no acknowledgement
    (response) => {
    // Code for processing acknowledgement
    // response.status == "Success"
});
```

### Front Desk (Receptionist)
- Front-end route: `/front-desk`
- SocketIO room name: `front-desk`
- Requires an access key

#### `"sessionsUpdated"`

- Sent from server to all clients of room `front-desk` whenever a session changes. Also sent to a client upon first connection.
- Contents:
  - `"sessions"` - list of session objects
    - `"sessionId"` - session ID, number
    - `"driverNames"` - list of strings (driver names) up to a length of 8.
    - `"carNumbers"` - list of numbers up to a length of 8. The length must match the length of `"driverNames"`. Driver name of index i must match driver car number of index i.
- No acknowledgement required.
- This event will be triggered by any change to any session. Performance implications will not be considered for the MVP.

#### `"sessionStarted"`

- Sent from server to all clients of room `front-desk` whenever a race session starts. Also sent to a client with the latest started sessionId upon connection if sessions have already started.
- Contents:
  - `"sessionId"` - session ID, number
- Signals to client that the editing of session of `sessionId` has been disabled.
- No acknowledgement required.

#### `"sessionCreated"`

- Sent from client to server.
- No Contents
- `sessionId` will be generated automatically by server, incrementally, so the session will take place after the last session.
- No acknowledgement required as `sessionsUpdated` will be triggered.

#### `"sessionRemoved"`

- Sent from client to server.
- Contents:
  - `"sessionId"` - session ID, number
- No acknowledgement required as `sessionsUpdated` will be triggered.

#### `"driverAdded"`

- Sent from client to server.
- Contents:
  - `"sessionId"` - session ID, number
  - `"driverName"` - driver name, string
- No acknowledgement required as `sessionsUpdated` will be triggered.

#### `"driverEdited"`

- Sent from client to server.
- Contents:
  - `"sessionId"` - session ID, number
  - `"driverName"` - old driver name, string
  - `"newName"` - new driver name, string
- No acknowledgement required as `sessionsUpdated` will be triggered.

#### `"driverRemoved"`

- Sent from client to server.
- Contents:
  - `"sessionId"` - session ID, number
  - `"driverName"` - driver name to be removed, string
- No acknowledgement required as `sessionsUpdated` will be triggered.

### Race Control (Safety Official)
- Front-end route: `/race-control`
- SocketIO room name: `race-control`
- Requires an access key

#### `"sessionStatus"`

- Sent from server to all clients in the room when the session status changes. Also sent upon connection.
- Contents:
  - `"status"` - status, string, must be: `"notStarted"`, `"active"`, or `"finished"`.
- No acknowledgement is required.
- Also sent to Lap-line Tracker and Leader Board.

#### `"flagChanged"`

- Sent from server to all clients in the room when a flag is changed.
- Also sent to a client when the client connects during an active race.
- Contents:
  - `"flag"` - flag type, string, must be: `"green"`, `"yellow"`, `"red"` or `"finish"`
- No acknowledgement is required.

#### `"raceFlag"`

- Sent from client to server.
- Contents:
  - `"flag"` - flag type, string, must be: `"green"`, `"yellow"`, `"red"` or `"finish"`
- Acknowledgement is required. Contents:
  - `"status"` - success or an error, string. Must be `"Success"`, `"Race not Active"`, `"Flag Not Changed"`, or `"Invalid flag"`
- The server must update the Race Control, Race Flag and Leaderboard screens accordingly, by sending a `"flagChanged"` event to their rooms.
- In case the flag is the `"finish"` flag, the server must also commence the logic for finishing the race.

#### `"sessionEnd"`

- Sent from client to server when a race session is ended.
- No Contents
- No acknowledgement is required, as `"sessionStatus"` will be triggered.

#### `"raceStartCountdown"`
- Sent from client to server when a race session is started.
- No Contents
- Acknowledgement is required. Contents:
  - `"status"` - success or an error, string. Must be `"Success"`, `"Countdown in Progress"` or `"Invalid Session Status"`
- `"sessionStatus"` and `"flagChanged"` will be triggered after the countdown ends.

### Lap-line Tracker
- Front-end route: `/lap-line-tracker`
- SocketIO room name: `lap-line-tracker`
- Requires an access key

#### `"sessionStatus"`

- Sent from server to all clients in the room when the session status changes. Also sent upon connection.
- Contents:
  - `"status"` - status, string, must be: `"notStarted"`, `"active"`, or `"finished"`.
- No acknowledgement is required.
- Note. The buttons must be disabled during status `"notStarted"`, but not during `"finished"`, for allowing racers to finish last lap
- Also sent to Race Control and Leader Board.

#### `"lap"`
- Sent from client to server when lap occurs
- Contents:
  - `"carNumber"` - the car's number that made a lap, number from 1 to 8
- No acknowledgement is required.
- This triggers `"lapTimes"` for Leader Board.


### Leader Board
- Front-end route: `/leader-board`
- SocketIO room name: `leader-board`

#### `"sessionUpdate"`

- Sent from server to client upon new session or initial connection.
- Contents:
  - `"sessionId"` - session ID, number
  - `"driverNames"` - list of strings (driver names) up to a length of 8.
  - `"carNumbers"` - list of numbers up to a length of 8. The length must match the length of `"driverNames"`. Driver name of index i must match driver car number of index i.
- No acknowledgement is required.

#### `"sessionStatus"`

- Sent from server to all clients in the room when the session status changes. Also sent upon connection.
- Contents:
  - `"status"` - status, string, must be: `"notStarted"`, `"active"`, or `"finished"`.
- No acknowledgement is required.
- Also sent to Lap-line Tracker and Race Control.

#### `"flagChanged"`

- Sent from server to all clients in the room when a flag is changed.
- Also sent to a client when the client connects during an active race.
- Contents:
  - `"flag"` - flag type, string, must be: `"green"`, `"yellow"`, `"red"` or `"finish"`
- No acknowledgement is required.

#### `"lapTimes"`
- Sent from server to all clients in the room when a racer completes a lap or when a client connets while a race is in progress.
- Contents:
  - `"carNumbers"` - list of numbers up to a length of 8. These represent the car numbers and are basis for the indices of the next lists
  - `"completedLaps"` - list of numbers up to a length of 8. Index i of this list represents car number `carNumbers[i]`.
  - `"bestLapTime"` - list of numbers up to a length of 8. Index i of this list represents car number `carNumbers[i]`. In case of no lap times yet, the lap time is 0.
- No acknowledgement is required.

#### `"timerTick"`
- Sent from server to all clients, every second. Used for real-time timer.
- Contents:
  - `"remainingSeconds"` - number
- No acknowledgement is required.

### Next Race
- Front-end route: `/next-race`
- SocketIO room name: `next-race`

#### `"nextSessionUpdate"`

- Sent from server to client upon starting new session or initial connection.
- Contents:
  - `"sessionId"` - session ID, number
  - `"driverNames"` - list of strings (driver names) up to a length of 8.
  - `"carNumbers"` - list of numbers up to a length of 8. The length must match the length of `"driverNames"`. Driver name of index i must match driver car number of index i.
- No acknowledgement is required.

### Race Countdown
- Front-end route: `/race-countdown`
- SocketIO room name: `race-countdown`

#### `"startCountdown"`

- Sent from server to client upon safety official starting race countdown
- Content:
  - `"duration"` - number, number of seconds for countdown, default 10.
- Acknowledgement is necessary. No content. Upon server receiving acknowledgement, the server also starts a countdown and upon ending countdown, a `"sessionStatus"` event sets race to active.
- Synchronization and lap time deviation may skew results by ~100ms, however, this will not be fixed in MVP.

### Race Flag
- Front-end route: `/race-flags`
- SocketIO room name: `race-flags`

#### `"flagChanged"`
- Sent from server to all clients in the room when a flag is changed.
- Also sent to a client when the client connects during an active race.
- Contents:
  - `"flag"` - flag type, string, must be: `"green"`, `"yellow"`, `"red"` or `"finish"`
- No acknowledgement is required.