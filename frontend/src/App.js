// frontend/src/App.js

import React, { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import "./App.css";

const API_URL = "https://stock-dashboard-8cr4.onrender.com";
const SUPPORTED_STOCKS = ["GOOG", "TSLA", "AMZN", "META", "NVDA"];

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState("");
  const [subscriptions, setSubscriptions] = useState([]);

  // State for gain/loss indicator
  const [stockPrices, setStockPrices] = useState({});
  const [prevStockPrices, setPrevStockPrices] = useState({});

  // --- Login Handler ---
  const handleLogin = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error("Login failed");

      const data = await response.json();
      setUserId(data.token);
      setUserName(data.name);
      setSubscriptions(data.subscriptions);
      setIsLoggedIn(true);
    } catch (error) {
      console.error(error);
      alert("Login Failed: Check console for details.");
    }
  };

  // --- Subscription Handler ---
  const handleSubscribe = useCallback(
    async (ticker) => {
      try {
        const response = await fetch(`${API_URL}/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: userId, ticker }),
        });

        if (!response.ok) throw new Error("Subscription failed");

        const data = await response.json();
        setSubscriptions(data.subscriptions);
      } catch (error) {
        console.error(error);
      }
    },
    [userId]
  );

  // Client-side Unsubscribe Handler
  const handleUnsubscribe = useCallback((ticker) => {
    setSubscriptions((prevSubs) => prevSubs.filter((sub) => sub !== ticker));
  }, []);

  // --- WebSocket Connection and Real-Time Updates ---
  useEffect(() => {
    if (!userId) return;

    const socket = io(API_URL, {
      query: { token: userId },
      transports: ["websocket"],
    });

    socket.on("stock-update", (updates) => {
      setStockPrices((prevPrices) => {
        // 1. Save the previous state before updating
        setPrevStockPrices(prevPrices);

        // 2. Generate the new state
        return {
          ...prevPrices,
          ...updates,
        };
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [userId]);

  // --- Render Logic ---

  if (!isLoggedIn) {
    return <LoginComponent onLogin={handleLogin} />;
  }

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-header">
        📈 {userName}'s Stock Client Dashboard
      </h1>

      <SubscriptionControls
        subscriptions={subscriptions}
        supportedStocks={SUPPORTED_STOCKS}
        onSubscribe={handleSubscribe}
      />

      <hr />

      <StockTable
        subscriptions={subscriptions}
        stockPrices={stockPrices}
        prevStockPrices={prevStockPrices}
        handleUnsubscribe={handleUnsubscribe}
      />
    </div>
  );
}

// --- Sub-Components ---

const LoginComponent = ({ onLogin }) => {
  // Defaulting to an arbitrary email since all are accepted now
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="login-container">
      <h2>Client Login</h2>
      <form onSubmit={handleSubmit} className="login-form">
        <input
          type="email"
          placeholder="Enter any Email ID"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Enter any Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
      <p className="note"></p>
    </div>
  );
};

const SubscriptionControls = ({
  subscriptions,
  supportedStocks,
  onSubscribe,
}) => (
  <div className="controls">
    <h3>Subscribe to a Stock</h3>
    <div className="stock-list">
      {supportedStocks.map((ticker) => (
        <button
          key={ticker}
          onClick={() => onSubscribe(ticker)}
          disabled={subscriptions.includes(ticker)}
          className={`ticker-button ${
            subscriptions.includes(ticker) ? "subscribed" : ""
          }`}
        >
          {ticker} {subscriptions.includes(ticker) ? " (Subscribed)" : ""}
        </button>
      ))}
    </div>
  </div>
);

const StockTable = ({
  subscriptions,
  stockPrices,
  prevStockPrices,
  handleUnsubscribe,
}) => (
  <div className="table-wrapper">
    <h3>Your Subscribed Stocks</h3>
    <table className="stock-table">
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Current Price</th>
        </tr>
      </thead>
      <tbody>
        {subscriptions.length === 0 ? (
          <tr>
            <td colSpan="2">No stocks subscribed.</td>
          </tr>
        ) : (
          subscriptions.map((ticker) => {
            const currentPrice = parseFloat(stockPrices[ticker] || 0);
            const previousPrice = parseFloat(prevStockPrices[ticker] || 0);

            // Determine the change class for aesthetic effect
            const priceClass =
              currentPrice > previousPrice
                ? "price-gain"
                : currentPrice < previousPrice
                ? "price-loss"
                : "";

            return (
              <tr key={ticker}>
                <td>
                  **{ticker}**{" "}
                  <button
                    onClick={() => handleUnsubscribe(ticker)}
                    className="unsubscribe-button"
                  >
                    X
                  </button>
                </td>
                <td className={`price ${priceClass}`}>
                  **${currentPrice.toFixed(2).toLocaleString()}**
                </td>
              </tr>
            );
          })
        )}
      </tbody>
    </table>
  </div>
);

export default App;
