const fs = require("fs");
const path = require("path");

const STATE_FILE_PATH = path.join(__dirname, "state.json");

const DEFAULT_STATE = {
    sessions: [],
    currentRace: {
        status: "notStarted",
        sessionId: null,
        carNumbers: null,
        driverNames: null,
        completedLaps: null,
        bestLapTime: null,
        lastLapStartTimes: null,
        flag: "red",
        remainingSeconds: null
    },
    lastSessionId: -1,
    countdownInProgress: false,
    raceEndsAt: null,
    countdownEndsAt: null
};

function cloneDefaultState() {
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function readState() {
    try {
        if (!fs.existsSync(STATE_FILE_PATH)) {
            return cloneDefaultState();
        }

        const raw = fs.readFileSync(STATE_FILE_PATH, "utf8");
        if (!raw.trim()) {
            return cloneDefaultState();
        }

        const parsed = JSON.parse(raw);

        return {
            ...cloneDefaultState(),
            ...parsed,
            currentRace: {
                ...cloneDefaultState().currentRace,
                ...(parsed.currentRace || {})
            }
        };
    } catch (error) {
        console.error("Failed to read state.json, using default state.", error);
        return cloneDefaultState();
    }
}

function writeState(state) {
    try {
        fs.writeFileSync(
            STATE_FILE_PATH,
            JSON.stringify(state, null, 2),
            "utf8"
        );
    } catch (error) {
        console.error("Failed to write state.json.", error);
    }
}

module.exports = {
    readState,
    writeState,
    STATE_FILE_PATH,
    DEFAULT_STATE
};