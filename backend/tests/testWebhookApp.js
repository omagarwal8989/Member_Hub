const express = require("express");
const paymentRoutes = require("../src/routes/payments.js");

const app = express();

// This exact ordering matters — see server.js instructions in the handoff.
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use("/api/payments", paymentRoutes);

app.use(express.json());

// A normal JSON route, to confirm the raw-body middleware above doesn't
// accidentally break JSON parsing for everything else.
app.post("/api/echo", (req, res) => {
  res.json({ received: req.body });
});

module.exports = app;
