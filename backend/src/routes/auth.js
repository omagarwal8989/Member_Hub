const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const { PrismaClient } = require("@prisma/client");
const {
  sendLoginOtpEmail,
  sendPasswordResetOtpEmail,
} = require("../utils/emailService.js");
const authenticate = require("../middleware/authMiddleware.js");
const prisma = new PrismaClient();
const router = express.Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Shared helper: link a freshly created member User to an existing
// admin-created (or cash-signup) Member record with the same email, if
// one exists and isn't linked yet.
async function linkExistingMember(user) {
  const existingMember = await prisma.member.findUnique({
    where: { email: user.email },
  });
  if (existingMember && !existingMember.userId) {
    await prisma.member.update({
      where: { id: existingMember.id },
      data: { userId: user.id },
    });
  }
}

function issueToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1h" },
  );
}



// // --- Login (email + password) — used by BOTH admins and members now ---
// router.post("/login", async (req, res) => {
//   const email = req.body.email?.trim().toLowerCase();
//   const { password } = req.body;
//   const user = await prisma.user.findUnique({ where: { email } });

//   if (user?.password && (await bcrypt.compare(password, user.password))) {
//     res.json({ token: issueToken(user) });
//   } else {
//     res.status(401).json({ error: "Invalid credentials" });
//   }
// });



router.post("/login", async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const { password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (user?.password && (await bcrypt.compare(password, user.password))) {
      res.json({ token: issueToken(user) });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Login failed. Please try again.", details: error.message });
  }
});


// --- Sign in with Google (members) ---
router.post("/google", async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: "Missing Google credential." });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email?.trim().toLowerCase();

    if (!email || !payload.email_verified) {
      return res
        .status(400)
        .json({ error: "Google account email is not verified." });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          googleId: payload.sub,
          authProvider: "GOOGLE",
          role: "MEMBER",
        },
      });
      await linkExistingMember(user);
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: payload.sub },
      });
    }

    res.json({ token: issueToken(user) });
  } catch (error) {
    res
      .status(401)
      .json({ error: "Google sign-in failed.", details: error.message });
  }
});

// --- Member sign-up: Step 1 — request an OTP to prove email ownership ---
// Used only the FIRST time a member sets up their account. Once they have
// a password, they log in via POST /login like anyone else, and this step
// is never needed again for them.
router.post("/otp/request", async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) return res.status(400).json({ error: "Email is required." });

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser?.password) {
      return res.status(400).json({
        error:
          "An account already exists for this email. Please log in with your password instead.",
      });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.loginOTP.create({ data: { email, otp, expiresAt } });
    await sendLoginOtpEmail(email, otp);

    res.status(200).json({ message: "OTP sent to your email." });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to send OTP", details: error.message });
  }
});

// --- Member sign-up: Step 2 — verify the OTP and set a password ---
// Creates the User (or, if they already exist via Google with no
// password yet, adds a password onto that same account) and logs them in.
router.post("/otp/verify-signup", async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { otp, password } = req.body;

  if (!email || !otp || !password) {
    return res
      .status(400)
      .json({ error: "Email, OTP, and password are all required." });
  }
  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters." });
  }

  try {
    const record = await prisma.loginOTP.findFirst({
      where: { email, otp, used: false },
      orderBy: { createdAt: "desc" },
    });

    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired OTP." });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (user?.password) {
      return res.status(400).json({
        error:
          "An account already exists for this email. Please log in with your password instead.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
      // Existing Google-only account, now adding a password to it.
      user = await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    } else {
      user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          authProvider: "OTP",
          role: "MEMBER",
        },
      });
      await linkExistingMember(user);
    }

    await prisma.loginOTP.update({
      where: { id: record.id },
      data: { used: true },
    });

    res.json({ token: issueToken(user) });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to verify OTP", details: error.message });
  }
});

// --- Forgot Password (OTP-based) — works for ANY account with a password:
// admins, and now members too, once they've completed sign-up above. ---
router.post("/forgot-password", async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (user?.password) {
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await prisma.passwordResetOTP.create({
        data: { email, otp, expiresAt },
      });

      await sendPasswordResetOtpEmail(email, otp);
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
    if (!user?.password) {
      return res.status(400).json({
        error: "This account doesn't use a password.",
      });
    }

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