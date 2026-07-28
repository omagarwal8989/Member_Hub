const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const memberRoutes = require("./routes/members.js");
const authRoutes = require("./routes/auth.js");

const { startCronJob } = require("./jobs/reminderCron");
const paymentRoutes = require("./routes/payments.js");
const certificateRoutes = require("./routes/certificates.js");
const publicRoutes = require("./routes/public.js");


dotenv.config();

const app = express();




// app.use(cors()); // ← move it up here, before everything else



const allowedOrigins = [
  "http://localhost:5173", // local dev
  process.env.FRONTEND_URL, // production frontend, set in Render's env vars
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  }),
);





// Must come BEFORE express.json() — webhook signatures need the raw body.
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use("/api/payments", paymentRoutes);
app.use("/api/certificates", certificateRoutes);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/members", memberRoutes);


app.use("/api/public", publicRoutes);


app.get("/api/health", (req, res) => {
  res.json({ message: "MemberHub Backend is alive and running!" });
});

const PORT = process.env.PORT || 5000;

startCronJob();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
