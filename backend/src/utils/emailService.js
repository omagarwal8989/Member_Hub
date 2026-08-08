// const nodemailer = require("nodemailer");

// const transporter = nodemailer.createTransport({
//   service: "gmail",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const sendRenewalReminder = async (email, firstName, endDate) => {
//   try {
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Action Required: Membership Expiring Soon!",
//       html: `
//         <h2>Hi ${firstName},</h2>
//         <p>This is an automated reminder that your membership will expire on <strong>${new Date(endDate).toLocaleDateString()}</strong>.</p>
//         <p>Please log in to your account to renew your tier and keep your benefits active.</p>
//         <br/>
//         <p>Thank you,</p>
//         <p><strong>MemberHub Admin</strong></p>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log(`Reminder email sent to ${email}`);
//   } catch (error) {
//     console.error(`Failed to send email to ${email}:`, error.message);
//     // Re-thrown deliberately: this function is now only ever called from
//     // emailWorker.js (a BullMQ job processor). If we swallow the error
//     // here, BullMQ has no way to know the send failed, so it would mark
//     // the job "completed" and never retry — defeating the point of using
//     // a queue in the first place.
//     throw error;
//   }
// };

// // Used by POST /api/auth/forgot-password — resetting the password on an
// // EXISTING account (currently only ever reached by admins, since members
// // no longer have passwords).
// const sendPasswordResetOtpEmail = async (email, otp) => {
//   try {
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Your MemberHub Password Reset Code",
//       html: `
//         <h2>Password Reset Request</h2>
//         <p>Use the code below to reset your password. This code expires in 10 minutes.</p>
//         <h1 style="letter-spacing: 6px; font-size: 36px;">${otp}</h1>
//         <p>If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
//         <br/>
//         <p>Thank you,</p>
//         <p><strong>MemberHub Admin</strong></p>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log(`Password reset OTP email sent to ${email}`);
//   } catch (error) {
//     console.error(
//       `Failed to send password reset OTP email to ${email}:`,
//       error.message,
//     );
//   }
// };

// // Used by POST /api/auth/otp/request — member sign-in AND sign-up. The
// // same code either logs an existing member in or creates their account
// // on first use, so the copy stays neutral rather than assuming either.
// const sendLoginOtpEmail = async (email, otp) => {
//   try {
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Your MemberHub Sign-In Code",
//       html: `
//         <h2>Welcome to MemberHub</h2>
//         <p>Use the code below to sign in to your account. If this is your first time, this also creates your account — no separate sign-up needed.</p>
//         <h1 style="letter-spacing: 6px; font-size: 36px;">${otp}</h1>
//         <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
//         <br/>
//         <p>Thank you,</p>
//         <p><strong>MemberHub Team</strong></p>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log(`Login OTP email sent to ${email}`);
//   } catch (error) {
//     console.error(`Failed to send login OTP email to ${email}:`, error.message);
//   }
// };

// // Sent the moment an admin adds a member who paid directly (cash / manual
// // transfer). Explains how to get portal access, since no login exists yet
// // at this point — only a Member record. Signing in on the site with this
// // same email auto-links to this membership (see linkExistingMember in
// // auth.js).
// const sendWelcomeEmail = async (email, firstName, tierName) => {
//   try {
//     const mailOptions = {
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Welcome to MemberHub — Activate Your Portal Access",
//       html: `
//         <h2>Welcome, ${firstName}!</h2>
//         <p>Your <strong>${tierName}</strong> membership is now active. Here's how to get access to your member portal, where you can view your membership details, renew online, and download your certificate:</p>
//         <ol>
//           <li>Go to our website and click <strong>Member Login</strong>.</li>
//           <li>Sign in using <strong>this same email address</strong> (${email}) — with Google, or by verifying your email with a one-time code.</li>
//           <li>Your account will link to your membership automatically. No separate registration needed.</li>
//         </ol>
//         <p>If you have any questions, just reply to this email or ask us at the front desk.</p>
//         <br/>
//         <p>See you at the gym,</p>
//         <p><strong>MemberHub Team</strong></p>
//       `,
//     };

//     await transporter.sendMail(mailOptions);
//     console.log(`Welcome email sent to ${email}`);
//   } catch (error) {
//     console.error(`Failed to send welcome email to ${email}:`, error.message);
//     // Deliberately NOT re-thrown: this is called synchronously from the
//     // POST / member-creation route. A failed welcome email shouldn't roll
//     // back or fail the member's creation — same "fail silently" pattern
//     // as sendOtpEmail. The member still exists either way; the admin can
//     // always tell them in person if the email doesn't arrive.
//   }
// };

// module.exports = {
//   sendRenewalReminder,
//   sendPasswordResetOtpEmail,
//   sendLoginOtpEmail,
//   sendWelcomeEmail,
// };










const axios = require("axios");

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// Shared sender used across every email type below.
const SENDER = {
  name: "MemberHub",
  email: process.env.EMAIL_USER,
};

// Sends via Brevo's HTTPS API (port 443) instead of raw SMTP — cloud
// hosts like Render block/throttle outbound SMTP ports (465/587), which
// is why Gmail SMTP worked locally but silently timed out in production.
// All email-sending functions below route through this one helper.
async function sendViaBrevo({ to, subject, html }) {
  await axios.post(
    BREVO_API_URL,
    {
      sender: SENDER,
      to: [{ email: to }],
      subject,
      htmlContent: html,
    },
    {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 15000, // fail fast rather than hang
    },
  );
}

const sendRenewalReminder = async (email, firstName, endDate) => {
  try {
    await sendViaBrevo({
      to: email,
      subject: "Action Required: Membership Expiring Soon!",
      html: `
        <h2>Hi ${firstName},</h2>
        <p>This is an automated reminder that your membership will expire on <strong>${new Date(endDate).toLocaleDateString()}</strong>.</p>
        <p>Please log in to your account to renew your tier and keep your benefits active.</p>
        <br/>
        <p>Thank you,</p>
        <p><strong>MemberHub Admin</strong></p>
      `,
    });
    console.log(`Reminder email sent to ${email}`);
  } catch (error) {
    console.error(
      `Failed to send email to ${email}:`,
      error.response?.data || error.message,
    );
    // Re-thrown deliberately: this function is only ever called from
    // emailWorker.js (a BullMQ job processor). If we swallow the error
    // here, BullMQ has no way to know the send failed, so it would mark
    // the job "completed" and never retry.
    throw error;
  }
};

// Used by POST /api/auth/forgot-password.
const sendPasswordResetOtpEmail = async (email, otp) => {
  try {
    await sendViaBrevo({
      to: email,
      subject: "Your MemberHub Password Reset Code",
      html: `
        <h2>Password Reset Request</h2>
        <p>Use the code below to reset your password. This code expires in 10 minutes.</p>
        <h1 style="letter-spacing: 6px; font-size: 36px;">${otp}</h1>
        <p>If you didn't request this, you can safely ignore this email — your password won't be changed.</p>
        <br/>
        <p>Thank you,</p>
        <p><strong>MemberHub Admin</strong></p>
      `,
    });
    console.log(`Password reset OTP email sent to ${email}`);
  } catch (error) {
    console.error(
      `Failed to send password reset OTP email to ${email}:`,
      error.response?.data || error.message,
    );
    // Re-thrown (unlike before) so the route can correctly report failure
    // instead of telling the user an OTP was sent when it wasn't.
    throw error;
  }
};

// Used by POST /api/auth/otp/request — member sign-in AND sign-up.
const sendLoginOtpEmail = async (email, otp) => {
  try {
    await sendViaBrevo({
      to: email,
      subject: "Your MemberHub Sign-In Code",
      html: `
        <h2>Welcome to MemberHub</h2>
        <p>Use the code below to sign in to your account. If this is your first time, this also creates your account — no separate sign-up needed.</p>
        <h1 style="letter-spacing: 6px; font-size: 36px;">${otp}</h1>
        <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
        <br/>
        <p>Thank you,</p>
        <p><strong>MemberHub Team</strong></p>
      `,
    });
    console.log(`Login OTP email sent to ${email}`);
  } catch (error) {
    console.error(
      `Failed to send login OTP email to ${email}:`,
      error.response?.data || error.message,
    );
    // Re-thrown (unlike before) — see sendPasswordResetOtpEmail comment.
    throw error;
  }
};

// Sent when an admin adds a member who paid directly (cash / manual).
const sendWelcomeEmail = async (email, firstName, tierName) => {
  try {
    await sendViaBrevo({
      to: email,
      subject: "Welcome to MemberHub — Activate Your Portal Access",
      html: `
        <h2>Welcome, ${firstName}!</h2>
        <p>Your <strong>${tierName}</strong> membership is now active. Here's how to get access to your member portal, where you can view your membership details, renew online, and download your certificate:</p>
        <ol>
          <li>Go to our website and click <strong>Member Login</strong>.</li>
          <li>Sign in using <strong>this same email address</strong> (${email}) — with Google, or by verifying your email with a one-time code.</li>
          <li>Your account will link to your membership automatically. No separate registration needed.</li>
        </ol>
        <p>If you have any questions, just reply to this email or ask us at the front desk.</p>
        <br/>
        <p>See you at the gym,</p>
        <p><strong>MemberHub Team</strong></p>
      `,
    });
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error(
      `Failed to send welcome email to ${email}:`,
      error.response?.data || error.message,
    );
    // Deliberately NOT re-thrown: this is called synchronously from the
    // member-creation route. A failed welcome email shouldn't roll back
    // or fail the member's creation.
  }
};






// Used when a member changes their contact email — proves they actually
// own the NEW address before it's applied, so someone can't silently
// redirect another person's membership to an email they don't control.
const sendEmailChangeOtpEmail = async (email, otp) => {
  try {
    await sendViaBrevo({
      to: email,
      subject: "Confirm Your New MemberHub Email",
      html: `
        <h2>Confirm Email Change</h2>
        <p>Use the code below to confirm this is your email address. This code expires in 10 minutes.</p>
        <h1 style="letter-spacing: 6px; font-size: 36px;">${otp}</h1>
        <p>If you didn't request this change, you can safely ignore this email — your account email won't change.</p>
        <br/>
        <p>Thank you,</p>
        <p><strong>MemberHub Team</strong></p>
      `,
    });
    console.log(`Email change OTP sent to ${email}`);
  } catch (error) {
    console.error(
      `Failed to send email change OTP to ${email}:`,
      error.response?.data || error.message,
    );
    throw error;
  }
};






module.exports = {
  sendRenewalReminder,
  sendPasswordResetOtpEmail,
  sendLoginOtpEmail,
  sendWelcomeEmail,
  sendEmailChangeOtpEmail,
};