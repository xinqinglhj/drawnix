# Verification and Run Guide

I have completed the integration of the backend storage system.

## Changes Created
1.  **Backend Server**: Created in `apps/server` (Node.js + Express + SQLite).
2.  **API Service**: Added `packages/drawnix/src/api/drawing-service.ts`.
3.  **UI Components**:
    -   `CloudFileDialog`: To view, open, and delete saved drawings.
    -   Updated `AppToolbar`: Added "Save to Server" and "My Drawings" menu items.

## How to Run

### 1. Start the Backend Server
Open a terminal and run the following commands:

```bash
cd apps/server
npm install
npm start
```

The server will start on `http://localhost:3000`.

### 2. Start the Frontend
In a separate terminal, run the existing frontend command:

```bash
nx serve web
```

### 3. Verify Functionality
1.  Open the web app (usually `http://localhost:4200`).
2.  Draw something on the canvas.
3.  Click the **Menu** button (hamburger icon).
4.  Select **Save to Server** (保存到服务器).
5.  Enter a title and click **Save**.
6.  Clear the board (clean canvas).
7.  Click **Menu** -> **My Drawings (History)** (我的画作).
8.  You should see your saved drawing. Click it to open.
9.  Click the Trash icon in the list to delete a drawing.

### 4. One-Click Deployment (Production Mode)
To build the frontend and start the backend together:

```bash
npm run start:prod
```
Access the app at `http://localhost:3000`.

### 5. Docker Deployment
You can also run the application using Docker:

**Option A: Docker Compose (Recommended)**
```bash
docker-compose up --build -d
```

**Option B: Manual Build and Run**
```bash
docker build -t drawnix .
docker run -p 3000:3000 drawnix
```
Access the app at `http://localhost:3000`.

