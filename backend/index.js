const { Server } = require('socket.io');
const { env } = require('node:process');

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
    "race-control": env.observer_key,
    "lap-line-tracker": env.safety_key
}

let raceDuration; // Default
if (!("NODE_ENV" in env)) {
    console.warn("NODE_ENV not set. Defaulting to development mode with a race duration of 60 seconds.");
} else {
    if (env.NODE_ENV === "production") {
        raceDuration = 600; // 10 minutes for production
    } else if (env.NODE_ENV === "development") {
        raceDuration = 60; // 1 minute for development
    } else {
        console.warn(`Unknown NODE_ENV value: ${env.NODE_ENV}. Defaulting to development mode with a race duration of 60 seconds.`);
    }
}

io.on('connection', (socket) => {
    socket.on("selectRoom", (args, callback) => {
        if (publicRooms.includes(args.room)) {
            socket.join(args.room);
            callback({status: "Success"});
        } else if (privateRooms.includes(args.room)) {
            if (args.key === privateRoomKeys[args.room]) {
                socket.join(args.room);
                callback({status: "Success"});
            } else {
                callback({status: "Invalid Access Key"});
            }
        } else {
            callback({status: "Invalid Room"});
        }
    });
});