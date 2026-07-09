const express = require("express");
const authRoutes = require("../src/routes/auth.js");
const memberRoutes = require("../src/routes/members.js");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);

module.exports = app;
