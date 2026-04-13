## Event Flow

### 1. Authentication

When the Race Control interface connects to the server, authentication is required before any actions are allowed.

Flow:
1. The client establishes a connection to the server  
2. The server sends an authentication request  
3. The client sends the access key  
4. The server validates the key  
5. The server responds with success or failure  

Result:
- On success → access is granted  
- On failure → access is denied (with delay)

---

### 2. Race Start Flow

This flow describes what happens when a race is started.

Flow:
1. The safety officer presses the "Start Race" button  
2. The client sends a start request to the server  
3. The server marks the session as active  
4. The server broadcasts a "race started" event  

Result:
- Front Desk is locked (no editing allowed)  
- Timer starts  
- Screens switch to race mode  

---

### 3. Live Race Updates

This flow describes real-time updates during the race.

Flow:
1. The server tracks race data (laps, time)  
2. The server continuously sends updates to clients  
3. Clients receive and display updated data  

Result:
- Leaderboard updates in real time  
- Timer is synchronized across all screens  

---

### 4. Flag Control Flow

This flow describes how flag changes are handled.

Flow:
1. The safety officer selects a flag  
2. The client sends the selected flag to the server  
3. The server updates the current flag state  
4. The server broadcasts the new flag  

Result:
- All screens display the same flag  
- Drivers and spectators receive consistent information  

---

### 5. Hazard Flow

This flow describes how dangerous situations are handled.

Flow:
1. The safety officer triggers a hazard alert  
2. The client sends the alert to the server  
3. The server processes the alert  
4. The server broadcasts a warning  

Result:
- Warning message is displayed  
- Flag may automatically change (e.g. yellow)  

---

### 6. Race End Flow

This flow describes what happens when the race ends.

Flow:
1. The safety officer presses the "Stop Race" button  
2. The client sends a stop request  
3. The server stops the race  
4. The server calculates final results  
5. The server broadcasts results  

Result:
- Timer stops  
- Final leaderboard is displayed  
- Session is marked as completed  

---

### 7. Next Race Preparation Flow

This flow describes preparation for the next race.

Flow:
1. The safety officer prepares the next race  
2. The server updates session data  
3. The server broadcasts updated sessions  

Result:
- New session becomes visible  
- System is ready for the next race cycle  