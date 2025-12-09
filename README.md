📈 Stock Client Web Dashboard
This project is a real-time, multi-user stock client dashboard built using the MERN stack principles with a strong focus on WebSockets for live data streaming and a professional UI/UX.

✨ Key Features
Real-Time Live Updates: Stock prices update every second without page refresh using Socket.io.

User Isolation: The server efficiently sends price updates only for the stocks that each specific user is subscribed to, preventing unnecessary data transfer.

Professional UI/UX: Features a responsive, mesmerizing dark-mode aesthetic with visual feedback (quick green/red flash) on price Gain/Loss.

Flexible Authentication: Accepts any email and password combination for instant access, simulating a dynamic user session (user data is stored in memory).

Dynamic Subscription: Users can subscribe to and unsubscribe from supported stocks directly from the dashboard.

🛠️ Technology Stack
The project consists of two main components:

Backend (API/Socket Server): Uses Node.js, Express, and Socket.io to manage user sessions, handle API requests (/login, /subscribe), generate random price data, and broadcast updates via WebSockets.

Frontend (Client): Uses React.js and Socket.io-client to render the dashboard, connect to the Socket server, and handle real-time aesthetic updates and user subscriptions.

🚀 How to Run the Project (Local Setup)
The project requires two separate terminal windows to run the backend and the frontend simultaneously.

Prerequisites
You must have Node.js and npm installed on your machine.

1. Install Dependencies
In your terminal, navigate to the project's root folder (stock-dashboard) and run the following commands to install packages for both the backend and frontend:

Bash

# Navigate to the main project root
cd stock-dashboard

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
2. Start the Application
Open two separate terminal windows for the following steps:

Terminal 1: Start the Backend Server (Port 4000)
This terminal must remain open to keep the WebSocket server running continuously.

Bash

cd stock-dashboard/backend
# Use 'nodemon' for automatic restarts during development, or 'node server.js'
nodemon server.js 
# Console output: Backend server listening on http://localhost:4000
Terminal 2: Start the Frontend Client (Port 3000)
Bash

cd stock-dashboard/frontend
npm start
# The browser will open automatically to http://localhost:3000.
3. Testing and Verification
Access http://localhost:3000.

Log in with any email (e.g., tester@client.com) and any password.

To test the multi-user isolation, open a second Incognito browser window and log in with a different email (e.g., admin@test.com).

Both dashboards will receive independent, real-time price updates only for the stocks each user has subscribed to.
