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

function broadcastSessionStatus() {
    const sessionStatus = repository.getSessionStatus();

    io.to("race-control").emit("sessionStatus", sessionStatus);
    io.to("lap-line-tracker").emit("sessionStatus", sessionStatus);
    io.to("leader-board").emit("sessionStatus", sessionStatus);
}

function broadcastFlagChanged() {
    const flag = repository.getFlag();

    io.to("race-control").emit("flagChanged", flag);
    io.to("leader-board").emit("flagChanged", flag);
    io.to("race-flags").emit("flagChanged", flag);
}

function broadcastNextSession() {
    const result = repository.getNextSession();

    if (result.status !== "Success") {
        return;
    }

    io.to("next-race").emit("nextSessionUpdate", result.session);
}

io.on('connection', (socket) => {
    socket.on("selectRoom", (args, callback) => {
        if (publicRooms.includes(args.room)) {
            socket.join(args.room);
            callback({status: "Success"});

            if (args.room === "race-flags" && repository.currentRace.status === "active") {
                socket.emit("flagChanged", repository.getFlag());
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

    socket.on("startRace", (callback) => {
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

        broadcastSessionStatus();
        broadcastFlagChanged();
        callback({ status: "Success" });
    });

    socket.on("setFlag", (args, callback) => {
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

        broadcastFlagChanged();
        callback({ status: "Success" });
    });

    socket.on("finishRace", (callback) => {
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

        broadcastSessionStatus();
        broadcastFlagChanged();
        callback({ status: "Success" });
    });

    socket.on("endSession", (callback) => {
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

        broadcastSessionStatus();
        broadcastFlagChanged();
        broadcastNextSession();
        callback({ status: "Success" });
    });

    // Event listeners as modules can be added here
});

console.log("Socket.IO backend running on port 3000");