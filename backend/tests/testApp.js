const express = require("express");
const authRoutes = require("../src/routes/auth.js");
const memberRoutes = require("../src/routes/members.js");
const certificateRoutes = require("../src/routes/certificates.js");
const publicRoutes = require("../src/routes/public.js");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/public", publicRoutes);

module.exports = app;