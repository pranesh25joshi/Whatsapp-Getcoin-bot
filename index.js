const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const app = express();
app.use(express.json());

const GUPSHUP_API = "https://api.gupshup.io/sm/api/v1/msg";
const GUPSHUP_TOKEN = "YOUR_GUPSHUP_API_KEY"; // Replace this
const SOURCE_NUMBER = "YOUR_GUPSHUP_SOURCE_NUMBER"; // From Gupshup App

app.post("/webhook", async (req, res) => {
  const { payload } = req.body;

  if (!payload?.type || payload.type !== "message") return res.sendStatus(200);

  const incomingMsg = payload.payload.text.trim().toLowerCase();
  const phone = payload.sender.phone;

  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${incomingMsg}&vs_currencies=usd&include_24hr_change=true`;
    const { data } = await axios.get(url);

    if (!data[incomingMsg]) throw new Error("Invalid crypto");

    const info = data[incomingMsg];
    const reply = `${incomingMsg.toUpperCase()} 💰 $${info.usd}\n24h Change: ${info.usd_24h_change.toFixed(2)}%`;

    await axios.post(GUPSHUP_API, null, {
      params: {
        channel: "whatsapp",
        source: SOURCE_NUMBER,
        destination: phone,
        message: reply,
      },
      headers: {
        apikey: GUPSHUP_TOKEN,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

  } catch (e) {
    await axios.post(GUPSHUP_API, null, {
      params: {
        channel: "whatsapp",
        source: SOURCE_NUMBER,
        destination: phone,
        message: `Sorry! "${incomingMsg}" not found. Try "btc" or "eth".`,
      },
      headers: {
        apikey: GUPSHUP_TOKEN,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
  }

  res.sendStatus(200);
});

app.get("/", (req, res) => res.send("CryptoBot is live!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
