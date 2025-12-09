// backend/server.js

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// Configure CORS
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(express.json());
app.use(cors());

// --- In-Memory Data Store ---
const SUPPORTED_STOCKS = ["GOOG", "TSLA", "AMZN", "META", "NVDA"];

const USER_DATA = {
  // Note: These are initialized users, but any new email will also be accepted.
  "user1@example.com": { id: 1, name: "Alice", email: "user1@example.com" },
  "user2@example.com": { id: 2, name: "Bob", email: "user2@example.com" },
};

let userSubscriptions = {
  1: ["GOOG", "TSLA"],
  2: ["AMZN", "META"],
};

// Tracks the next ID to assign to a new user
let nextUserId = 3;
let connectedUsers = {};

let currentPrices = SUPPORTED_STOCKS.reduce((acc, ticker) => {
  acc[ticker] = 100 + Math.random() * 50;
  return acc;
}, {});

// --- Helper Functions ---
function generateRandomPrice(currentPrice) {
  const maxChangePercent = 0.001;
  const factor = 1 + (Math.random() * 2 - 1) * maxChangePercent;
  return currentPrice * factor;
}

// --- API Endpoints ---

// 1. Login Endpoint (MODIFIED to accept any email/password)
app.post("/login", (req, res) => {
  const { email } = req.body;

  let user = Object.values(USER_DATA).find((u) => u.email === email);
  let userId;

  if (user) {
    // Existing user logs in (e.g., user1@example.com)
    userId = user.id;
    console.log(`[AUTH] Existing user ${email} logged in.`);
  } else {
    // New user logs in (e.g., nikita@gmail.com)
    userId = nextUserId++;

    // Add the new user to the mock data structure
    const newUserName = email.split("@")[0];
    USER_DATA[email] = { id: userId, name: newUserName, email: email };
    userSubscriptions[userId] = []; // Initialize empty subscriptions for new users

    console.log(`[AUTH] New user ${email} registered with ID ${userId}.`);
  }

  // Prepare response data
  const mockToken = userId;
  const subscriptions = userSubscriptions[userId] || [];
  const name = USER_DATA[email].name;

  // Always return success regardless of password
  return res.json({
    token: mockToken,
    subscriptions: subscriptions,
    name: name,
  });
});

// 2. Subscription Endpoint
app.post("/subscribe", (req, res) => {
  const { token, ticker } = req.body;
  const userId = parseInt(token);

  if (SUPPORTED_STOCKS.includes(ticker)) {
    if (!userSubscriptions[userId]) userSubscriptions[userId] = [];
    if (!userSubscriptions[userId].includes(ticker)) {
      userSubscriptions[userId].push(ticker);
    }
    return res.json({
      success: true,
      subscriptions: userSubscriptions[userId],
    });
  }
  res.status(400).send("Invalid request or ticker.");
});

// --- WebSocket Logic ---

io.on("connection", (socket) => {
  const userId = parseInt(socket.handshake.query.token);

  if (Object.values(USER_DATA).find((u) => u.id === userId)) {
    console.log(
      `[SOCKET] User ${userId} connected. Total active: ${
        Object.keys(connectedUsers).length + 1
      }`
    );
    connectedUsers[userId] = socket;
  } else {
    console.warn(
      "[SECURITY] Unauthenticated connection attempt. Disconnecting."
    );
    socket.disconnect();
  }

  socket.on("disconnect", () => {
    if (userId) {
      console.log(
        `[SOCKET] User ${userId} disconnected. Total active: ${
          Object.keys(connectedUsers).length - 1
        }`
      );
      delete connectedUsers[userId];
    }
  });
});

// --- Real-Time Price Update Generator (Runs Every Second) ---

setInterval(() => {
  SUPPORTED_STOCKS.forEach((ticker) => {
    currentPrices[ticker] = generateRandomPrice(currentPrices[ticker]);
  });

  Object.keys(connectedUsers).forEach((userIdKey) => {
    const userId = parseInt(userIdKey);
    const socket = connectedUsers[userId];
    const subscriptions = userSubscriptions[userId] || [];

    if (subscriptions.length > 0) {
      const updatesToSend = subscriptions.reduce((acc, ticker) => {
        acc[ticker] = currentPrices[ticker].toFixed(2);
        return acc;
      }, {});

      socket.emit("stock-update", updatesToSend);
    }
  });
}, 1000);

const PORT = 4000;
server.listen(PORT, () =>
  console.log(`Backend server listening on http://localhost:${PORT}`)
);
