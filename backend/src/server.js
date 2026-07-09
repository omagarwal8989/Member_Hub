const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const memberRoutes = require("./routes/members.js");
const authRoutes = require("./routes/auth.js"); 

const { startCronJob } = require("./jobs/reminderCron"); // Make sure this is only here once!


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes); // Add this line
app.use("/api/members", memberRoutes);

app.get("/api/health", (req, res) => {
  res.json({ message: "MemberHub Backend is alive and running!" });
});

const PORT = process.env.PORT || 5000;


// Start background jobs
startCronJob();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});