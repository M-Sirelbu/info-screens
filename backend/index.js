const express = require('express')
const http = require('http')
const path = require('path')
const ngrok = require('@ngrok/ngrok');
const { Server } = require('socket.io');
const { env } = require('node:process');
const Repository = require('./repository');
const onConnection = require('./on_connection');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "../frontend/app/dist/app/browser")));

app.get(["/home", "/leader-board", "/next-race", "/race-countdown", "/race-flags", "/front-desk", "/race-control", "/lap-line-tracker"], (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/app/dist/app/browser/index.html'));
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

const repository = new Repository(raceDuration, 10);

let timer = undefined;

if (!("NGROK_AUTHTOKEN" in env)) {
    console.error("NGROK_AUTHTOKEN environment variable not set. Please set it to your ngrok authtoken or to \"none\" to run locally.");
}
if (env.NGROK_AUTHTOKEN !== "none") {
    ngrok.connect({ addr: 8000, authtoken_from_env: true })
    	.then(listener => console.log(`Ingress established at: ${listener.url()}`));
}
function sessionsUpdated() {
    io.to("front-desk").emit("sessionsUpdated", repository.sessions);
}

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
        let status = repository.setFlag(args.flag);
        if (status === "Success") {
            io.to("race-control")
            .to("leader-board")
            .to("race-flags")
            .emit("flagChanged", { flag: repository.currentRace.flag });
        }
        callback({ status: status });
        if (args.flag === "finish") {
            repository.endRace();
            io.to("front-desk")
            .to("lap-line-tracker")
            .to("leader-board")
            .emit("sessionStatus", { status: repository.currentRace.status });
        }
    });
    socket.on("raceStartCountdown", (callback) => {
        if (!socket.rooms.has("race-control")) {
            callback({ status: "Invalid Session Status" });
            return;
        }

        const result = repository.beginStartCountdown();

        if (result !== "Success") {
            callback({ status: result });
            return;
        }

        io.timeout(5000).to("race-countdown").emit("startCountdown", {
            duration: repository.currentRace.remainingSeconds
        }, (err, response) => {
            if (err) {
                repository.startRaceCountdownActive = false;
                callback({ status: "Invalid Session Status" });
                return;
            }
            callback({ status: "Success" })
            setTimeout(() => {
                repository.startRaceCountdownActive = false;
                repository.startRace()
                io.to("race-control")
                .to("leader-board")
                .to("race-flags")
                .emit("flagChanged", { flag: repository.currentRace.flag });
                
                io.to("front-desk")
                .to("lap-line-tracker")
                .to("leader-board")
                .emit("sessionStatus", { status: repository.currentRace.status });

                io.to("leader-board").emit("sessionUpdate", {
                    sessionId: repository.currentRace.sessionId,
                    driverNames: repository.currentRace.driverNames,
                    carNumbers: repository.currentRace.carNumbers
                });
                timer = setInterval(() => {
                    if (repository.currentRace.remainingSeconds < 0) {
                        repository.endRace();
                        io.to("front-desk")
                        .to("lap-line-tracker")
                        .to("leader-board")
                        .emit("sessionStatus", { status: repository.currentRace.status });
                        clearInterval(timer);
                    }
                    else {
                        io.to("leader-board").emit("timerTick", { remainingSeconds: repository.currentRace.remainingSeconds });
                        repository.currentRace.remainingSeconds--;
                    }
                }, 1000);
                if (repository.sessions.length >= 2) {
                    io.to("next-race").emit("nextSessionUpdate", repository.getSession(repository.sessions[1].sessionId));
                }
            }, repository.defaultCountdownDuration * 1000)
        });
    });
    socket.on("sessionEnd", () => {
        if (!socket.rooms.has("race-control")) {
            return;
        }
        if (repository.sessions.length < 2) {
            repository.addSession([], []);
        }
        repository.loadSession(repository.sessions[1].sessionId);
        io.to("race-control")
        .to("leader-board")
        .to("race-flags")
        .emit("flagChanged", { flag: repository.currentRace.flag });
            
        io.to("front-desk")
        .to("lap-line-tracker")
        .to("leader-board")
        .emit("sessionStatus", { status: repository.currentRace.status });

        io.to("front-desk").emit("sessionsUpdated", repository.sessions);

        io.to("front-desk").emit("sessionStarted", { sessionId: repository.currentRace.sessionId });
    });

    socket.on("sessionCreated", (args) => {
        if (!socket.rooms.has("front-desk")) {
            return;
        }
        repository.addSession([], []);
        sessionsUpdated();
    });
    socket.on("sessionRemoved", (args) => {
        if (!socket.rooms.has("front-desk")) {
            return;
        }
        repository.deleteSession(args.sessionId);
        sessionsUpdated();
    });
    socket.on("driverAdded", (args) => {
        if (!socket.rooms.has("front-desk")) {
            return;
        }
        repository.addDriver(args.sessionId, args.driverName);
        sessionsUpdated();
    });
    socket.on("driverEdited", (args) => {
        if (!socket.rooms.has("front-desk")) {
            return;
        }
        repository.updateDriver(args.sessionId, args.driverName, args.newName);
        sessionsUpdated();
    });
    socket.on("driverRemoved", (args) => {
        if (!socket.rooms.has("front-desk")) {
            return;
        }
        repository.deleteDriver(args.sessionId, args.driverName);
        sessionsUpdated();
    });

    socket.on("lap", (args) => {
        if (!socket.rooms.has("lap-line-tracker")) {
            return;
        }
        repository.addLap(args.carNumber);
        io.to("leader-board").emit("lapTimes", {
            carNumbers: repository.currentRace.carNumbers,
            completedLaps: repository.currentRace.completedLaps,
            bestLapTime: repository.currentRace.bestLapTime
        });
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

server.listen(8000, () => {
    console.log("Server running on port 8000")
});

process.on('SIGINT', () => {
    console.log("Shutting down server...");
    server.close(() => {
        ngrok.kill();
        console.log("Server closed.");
        process.exit(0);
    });
});