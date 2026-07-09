const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { sendOtpEmail } = require("../utils/emailService.js");
const authenticate = require("../middleware/authMiddleware.js");
const prisma = new PrismaClient();
const router = express.Router();

// Register New Member (always created with the default MEMBER role —
// admin accounts are never created through this public endpoint; promote
// a user to ADMIN manually, e.g. via Prisma Studio)
router.post("/register", async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    // If an admin already created a Member profile using this same email
    // (but it isn't linked to a login yet), link it now so this person can
    // view their own profile as soon as they log in.
    const existingMember = await prisma.member.findUnique({
      where: { email },
    });
    if (existingMember && !existingMember.userId) {
      await prisma.member.update({
        where: { id: existingMember.id },
        data: { userId: user.id },
      });
    }

    res.status(201).json({ message: "User created" });
  } catch (e) {
    res.status(400).json({ error: "User already exists" });
  }
});

// Login and get Token
router.post("/login", async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user && (await bcrypt.compare(password, user.password))) {
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );
    res.json({ token });
  } else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

// --- Forgot Password (OTP-based) ---
// Works for both ADMIN and MEMBER accounts — both are just User rows,
// so no role check is needed here.

// Step 1: request an OTP be emailed to the account's address
router.post("/forgot-password", async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return the same generic response whether or not the account
    // exists, so this endpoint can't be used to check which emails are
    // registered.
    if (user) {
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await prisma.passwordResetOTP.create({
        data: { email, otp, expiresAt },
      });

      await sendOtpEmail(email, otp);
    }

    res.status(200).json({
      message: "If an account exists for that email, an OTP has been sent.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to process request", details: error.message });
  }
});

// Step 2: verify the OTP and set a new password
router.post("/reset-password", async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { otp, newPassword } = req.body;

  if (!otp || !newPassword) {
    return res
      .status(400)
      .json({ error: "OTP and new password are required." });
  }

  try {
    const record = await prisma.passwordResetOTP.findFirst({
      where: { email, otp, used: false },
      orderBy: { createdAt: "desc" },
    });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({
        where: { email },
        data: { password: hashedPassword },
      }),
      prisma.passwordResetOTP.update({
        where: { id: record.id },
        data: { used: true },
      }),
    ]);

    res.status(200).json({ message: "Password reset successful." });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to reset password", details: error.message });
  }
});

// Change Password (for the currently logged-in user — admin or member)
router.put("/change-password", authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ error: "Current and new password are both required." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });
    if (!user) return res.status(404).json({ error: "User not found." });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to change password", details: error.message });
  }
});

module.exports = router;