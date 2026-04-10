const { Server } = require('socket.io');
const { env } = require('node:process');
const Repository = require('./repository');
const onConnection = require('./on_connection');

const io = new Server(3000, {
    cors: {
        origin: '*',
    },
});

const publicRooms = ["leader-board", "next-race", "race-countdown", "race-flags"];
const privateRooms = ["front-desk", "race-control", "lap-line-tracker"];

const clientEvents = {
    SELECT_ROOM: "selectRoom",
    START_RACE: "startRace",
    SET_FLAG: "setFlag",
    FINISH_RACE: "finishRace",
    END_SESSION: "endSession",
    GET_NEXT_RACE: "getNextRace",
    GET_FLAG_SCREEN: "getFlagScreen",
    GET_RACE_STATE: "getRaceState"
};

const serverEvents = {
    RACE_STATE_UPDATE: "raceStateUpdate",
    NEXT_RACE_UPDATE: "nextRaceUpdate",
    FLAG_SCREEN_UPDATE: "flagScreenUpdate"
};

if (!("receptionist_key" in env) || !("observer_key" in env) || !("safety_key" in env)) {
    console.error("Missing environment variables for private room keys. Please set receptionist_key, observer_key, and safety_key.");
    process.exit(1);
}
const privateRoomKeys = {
    "front-desk": env.receptionist_key,
    "race-control": env.safety_key,
    "lap-line-tracker": env.observer_key
}

let raceDuration = 60;
if (!("NODE_ENV" in env)) {
    console.warn("NODE_ENV not set. Defaulting to development mode with a race duration of 60 seconds.");
} else {
    if (env.NODE_ENV === "production") {
        raceDuration = 600; // 10 minutes for production
    } else if (env.NODE_ENV === "development") {
        raceDuration = 60; // 1 minute for development
    } else {
        raceDuration = 60;
        console.warn(`Unknown NODE_ENV value: ${env.NODE_ENV}. Defaulting to development mode with a race duration of 60 seconds.`);
    }
}

const repository = new Repository(raceDuration);

function broadcastRaceState() {
    const raceState = repository.getRaceState();

    io.to("race-control").emit(serverEvents.RACE_STATE_UPDATE, raceState);
    io.to("leader-board").emit(serverEvents.RACE_STATE_UPDATE, raceState);
    io.to("race-countdown").emit(serverEvents.RACE_STATE_UPDATE, raceState);
    io.to("race-flags").emit(serverEvents.RACE_STATE_UPDATE, raceState);
    io.to("next-race").emit(serverEvents.RACE_STATE_UPDATE, raceState);
}

function broadcastNextSession() {
    const result = repository.getNextSession();

    if (result.status !== "Success") {
        io.to("next-race").emit(serverEvents.NEXT_RACE_UPDATE, {
            status: "Error",
            message: result.message
        });
        return;
    }

    io.to("next-race").emit(serverEvents.NEXT_RACE_UPDATE, result.session);
}

function emitFlagState(socket) {
    socket.emit(serverEvents.FLAG_SCREEN_UPDATE, repository.getFlagState());
}

io.on('connection', (socket) => {
    socket.on(clientEvents.SELECT_ROOM, (args, callback) => {
        if (publicRooms.includes(args.room)) {
            socket.join(args.room);
            callback({status: "Success"});

            if (args.room === "race-flags") {
                emitFlagState(socket);
            }
        } else if (privateRooms.includes(args.room)) {
            if (args.key === privateRoomKeys[args.room]) {
                socket.join(args.room);
                callback({status: "Success"});
                onConnection(socket, repository, args.room);
            } else {
                // does not impose timeout on entering room, only feedback
                setTimeout(() => {
                    callback({ status: "Invalid Access Key" });
                }, 500);
            }
        } else {
            callback({status: "Invalid Room"});
        }
    });

    socket.on(clientEvents.START_RACE, (callback) => {
        if (!socket.rooms.has("race-control")) {
            callback({
                status: "Error",
                message: "Unauthorized"
            });
            return;
        }

        const result = repository.startRace();

        if (result.status !== "Success") {
            callback(result);
            return;
        }

        broadcastRaceState();
        callback({ status: "Success" });
    });

    socket.on(clientEvents.SET_FLAG, (args, callback) => {
        if (!socket.rooms.has("race-control")) {
            callback({
                status: "Error",
                message: "Unauthorized"
            });
            return;
        }

        const result = repository.setFlag(args.flag);

        if (result.status !== "Success") {
            callback(result);
            return;
        }

        broadcastRaceState();
        callback({ status: "Success" });
    });

    socket.on(clientEvents.FINISH_RACE, (callback) => {
        if (!socket.rooms.has("race-control")) {
            callback({
                status: "Error",
                message: "Unauthorized"
            });
            return;
        }

        const result = repository.finishRace();

        if (result.status !== "Success") {
            callback(result);
            return;
        }

        broadcastRaceState();
        callback({ status: "Success" });
    });

    socket.on(clientEvents.END_SESSION, (callback) => {
        if (!socket.rooms.has("race-control")) {
            callback({
                status: "Error",
                message: "Unauthorized"
            });
            return;
        }

        const result = repository.endSession();

        if (result.status !== "Success") {
            callback(result);
            return;
        }

        broadcastRaceState();
        broadcastNextSession();
        callback({ status: "Success" });
    });

    socket.on(clientEvents.GET_NEXT_RACE, (callback) => {
        const result = repository.getNextSession();

        if (result.status !== "Success") {
            callback(result);
            return;
        }

        callback({
            status: "Success",
            nextSession: result.session
        });
    });

    socket.on(clientEvents.GET_FLAG_SCREEN, (callback) => {
        callback({
            status: "Success",
            flagState: repository.getFlagState()
        });
    });

    socket.on(clientEvents.GET_RACE_STATE, (callback) => {
        callback({
            status: "Success",
            raceState: repository.getRaceState()
        });
    });

    // Event listeners as modules can be added here
});

console.log("Socket.IO backend running on port 3000");