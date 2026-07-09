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
//   }
// };

// const sendOtpEmail = async (email, otp) => {
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
//     console.log(`OTP email sent to ${email}`);
//   } catch (error) {
//     console.error(`Failed to send OTP email to ${email}:`, error.message);
//   }
// };

// module.exports = { sendRenewalReminder, sendOtpEmail };







const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendRenewalReminder = async (email, firstName, endDate) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
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
    };

    await transporter.sendMail(mailOptions);
    console.log(`Reminder email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send email to ${email}:`, error.message);
    // Re-thrown deliberately: this function is now only ever called from
    // emailWorker.js (a BullMQ job processor). If we swallow the error
    // here, BullMQ has no way to know the send failed, so it would mark
    // the job "completed" and never retry — defeating the point of using
    // a queue in the first place.
    throw error;
  }
};

const sendOtpEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
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
    };

    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error(`Failed to send OTP email to ${email}:`, error.message);
  }
};

module.exports = { sendRenewalReminder, sendOtpEmail };