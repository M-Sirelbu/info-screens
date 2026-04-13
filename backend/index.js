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
    RACE_FLAG: "raceFlag",
    RACE_START_COUNTDOWN: "raceStartCountdown",
    SESSION_END: "sessionEnd"
};

if (!("receptionist_key" in env) || !("observer_key" in env) || !("safety_key" in env)) {
    console.error("Missing environment variables for private room keys. Please set receptionist_key, observer_key, and safety_key.");
    process.exit(1);
}

const privateRoomKeys = {
    "front-desk": env.receptionist_key,
    "race-control": env.safety_key,
    "lap-line-tracker": env.observer_key
};

let raceDuration = 60;
if (!("NODE_ENV" in env)) {
    console.warn("NODE_ENV not set. Defaulting to development mode with a race duration of 60 seconds.");
} else {
    if (env.NODE_ENV === "production") {
        raceDuration = 600;
    } else if (env.NODE_ENV === "development") {
        raceDuration = 60;
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
        io.to("next-race").emit("nextSessionUpdate", {
            status: "Error",
            message: result.message
        });
        return;
    }

    io.to("next-race").emit("nextSessionUpdate", result.session);
}

io.on("connection", (socket) => {
    socket.on(clientEvents.SELECT_ROOM, (args, callback) => {
        if (publicRooms.includes(args.room)) {
            socket.join(args.room);
            callback({ status: "Success" });
            onConnection(socket, repository, args.room);
            return;
        }

        if (privateRooms.includes(args.room)) {
            if (args.key === privateRoomKeys[args.room]) {
                socket.join(args.room);
                callback({ status: "Success" });
                onConnection(socket, repository, args.room);
            } else {
                setTimeout(() => {
                    callback({ status: "Invalid Access Key" });
                }, 500);
            }
            return;
        }

        callback({ status: "Invalid Room" });
    });

    socket.on(clientEvents.RACE_FLAG, (args, callback) => {
        if (!socket.rooms.has("race-control")) {
            callback({ status: "Race not Active" });
            return;
        }

        const result = repository.setFlag(args.flag);

        if (result !== "Success") {
            callback({ status: result });
            return;
        }

        broadcastFlagChanged();

        if (args.flag === "finish") {
            broadcastSessionStatus();
        }

        callback({ status: "Success" });
    });

    socket.on(clientEvents.RACE_START_COUNTDOWN, (args, callback) => {
        if (!socket.rooms.has("race-control")) {
            callback({ status: "Invalid Session Status" });
            return;
        }

        const result = repository.beginStartCountdown();

        if (result !== "Success") {
            callback({ status: result });
            return;
        }

        io.to("race-countdown").emit("startCountdown", { duration: 10 });
        callback({ status: "Success" });
    });

    socket.on(clientEvents.SESSION_END, () => {
        if (!socket.rooms.has("race-control")) {
            return;
        }

        repository.endSession();
        broadcastSessionStatus();
        broadcastFlagChanged();
        broadcastNextSession();
    });

    // Event listeners as modules can be added here
});

console.log("Socket.IO backend running on port 3000");