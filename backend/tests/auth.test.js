// const request = require("supertest");
// const bcrypt = require("bcryptjs");
// const { prismaMock } = require("./prismaMock");
// const { makeToken } = require("./testHelpers");

// // The OTP email actually being sent (real Gmail SMTP) is not something a
// // unit test should trigger — mock it so tests run instantly and offline.
// jest.mock("../src/utils/emailService.js", () => ({
//   sendOtpEmail: jest.fn().mockResolvedValue(undefined),
//   sendRenewalReminder: jest.fn().mockResolvedValue(undefined),
// }));

// // testApp.js also mounts members.js, which requires the Puppeteer-based PDF
// // renderer at load time — mock it here too so this file doesn't need a real
// // Chromium install just to test auth routes.
// jest.mock("../src/utils/pdfRenderer.js", () => ({
//   htmlToPdfBuffer: jest.fn().mockResolvedValue(Buffer.from("%PDF-fake")),
// }));

// const app = require("./testApp");

// describe("POST /api/auth/register", () => {
//   it("creates a new user and links a matching Member record by email", async () => {
//     prismaMock.user.create.mockResolvedValue({
//       id: "user-1",
//       email: "om@gmail.com",
//       role: "MEMBER",
//     });
//     prismaMock.member.findUnique.mockResolvedValue({
//       id: "member-1",
//       email: "om@gmail.com",
//       userId: null,
//     });
//     prismaMock.member.update.mockResolvedValue({});

//     const res = await request(app)
//       .post("/api/auth/register")
//       .send({ email: "Om@Gmail.com", password: "password123" });

//     expect(res.status).toBe(201);
//     // Confirms the email got normalized (lowercased/trimmed) before lookup
//     expect(prismaMock.member.findUnique).toHaveBeenCalledWith({
//       where: { email: "om@gmail.com" },
//     });
//     // Confirms the auto-link actually happened
//     expect(prismaMock.member.update).toHaveBeenCalledWith({
//       where: { id: "member-1" },
//       data: { userId: "user-1" },
//     });
//   });

//   it("does not attempt to link if the member is already linked to another account", async () => {
//     prismaMock.user.create.mockResolvedValue({
//       id: "user-2",
//       email: "taken@gmail.com",
//       role: "MEMBER",
//     });
//     prismaMock.member.findUnique.mockResolvedValue({
//       id: "member-2",
//       email: "taken@gmail.com",
//       userId: "some-other-user",
//     });

//     const res = await request(app)
//       .post("/api/auth/register")
//       .send({ email: "taken@gmail.com", password: "password123" });

//     expect(res.status).toBe(201);
//     expect(prismaMock.member.update).not.toHaveBeenCalled();
//   });

//   it("returns 400 if the email is already registered", async () => {
//     prismaMock.user.create.mockRejectedValue(new Error("Unique constraint"));

//     const res = await request(app)
//       .post("/api/auth/register")
//       .send({ email: "dup@gmail.com", password: "password123" });

//     expect(res.status).toBe(400);
//   });
// });

// describe("POST /api/auth/login", () => {
//   it("returns a token for correct credentials", async () => {
//     const hashed = await bcrypt.hash("correct-password", 10);
//     prismaMock.user.findUnique.mockResolvedValue({
//       id: "user-1",
//       email: "admin@memberhub.com",
//       password: hashed,
//       role: "ADMIN",
//     });

//     const res = await request(app)
//       .post("/api/auth/login")
//       .send({ email: "admin@memberhub.com", password: "correct-password" });

//     expect(res.status).toBe(200);
//     expect(res.body.token).toBeDefined();
//   });

//   it("rejects an incorrect password", async () => {
//     const hashed = await bcrypt.hash("correct-password", 10);
//     prismaMock.user.findUnique.mockResolvedValue({
//       id: "user-1",
//       email: "admin@memberhub.com",
//       password: hashed,
//       role: "ADMIN",
//     });

//     const res = await request(app)
//       .post("/api/auth/login")
//       .send({ email: "admin@memberhub.com", password: "wrong-password" });

//     expect(res.status).toBe(401);
//   });

//   it("rejects an email that doesn't exist", async () => {
//     prismaMock.user.findUnique.mockResolvedValue(null);

//     const res = await request(app)
//       .post("/api/auth/login")
//       .send({ email: "nobody@gmail.com", password: "whatever" });

//     expect(res.status).toBe(401);
//   });
// });

// describe("PUT /api/auth/change-password", () => {
//   it("rejects an incorrect current password", async () => {
//     const hashed = await bcrypt.hash("real-current-password", 10);
//     prismaMock.user.findUnique.mockResolvedValue({
//       id: "user-1",
//       password: hashed,
//     });

//     const token = makeToken({ userId: "user-1", role: "ADMIN" });

//     const res = await request(app)
//       .put("/api/auth/change-password")
//       .set("Authorization", `Bearer ${token}`)
//       .send({ currentPassword: "wrong-guess", newPassword: "newpass123" });

//     expect(res.status).toBe(400);
//   });

//   it("changes the password when the current password is correct", async () => {
//     const hashed = await bcrypt.hash("real-current-password", 10);
//     prismaMock.user.findUnique.mockResolvedValue({
//       id: "user-1",
//       password: hashed,
//     });
//     prismaMock.user.update.mockResolvedValue({});

//     const token = makeToken({ userId: "user-1", role: "ADMIN" });

//     const res = await request(app)
//       .put("/api/auth/change-password")
//       .set("Authorization", `Bearer ${token}`)
//       .send({
//         currentPassword: "real-current-password",
//         newPassword: "newpass123",
//       });

//     expect(res.status).toBe(200);
//     expect(prismaMock.user.update).toHaveBeenCalled();
//   });

//   it("requires authentication", async () => {
//     const res = await request(app)
//       .put("/api/auth/change-password")
//       .send({ currentPassword: "a", newPassword: "b" });

//     expect(res.status).toBe(403);
//   });
// });

// describe("POST /api/auth/forgot-password + reset-password", () => {
//   it("always returns a generic success message, even for unknown emails", async () => {
//     prismaMock.user.findUnique.mockResolvedValue(null);

//     const res = await request(app)
//       .post("/api/auth/forgot-password")
//       .send({ email: "unknown@gmail.com" });

//     expect(res.status).toBe(200);
//   });

//   it("rejects reset with an invalid or expired OTP", async () => {
//     prismaMock.passwordResetOTP.findFirst.mockResolvedValue(null);

//     const res = await request(app).post("/api/auth/reset-password").send({
//       email: "om@gmail.com",
//       otp: "000000",
//       newPassword: "newpass123",
//     });

//     expect(res.status).toBe(400);
//   });

//   it("resets the password with a valid, unexpired OTP", async () => {
//     prismaMock.passwordResetOTP.findFirst.mockResolvedValue({
//       id: "otp-1",
//       email: "om@gmail.com",
//       otp: "123456",
//       used: false,
//       expiresAt: new Date(Date.now() + 60000), // 1 minute in the future
//     });
//     prismaMock.$transaction.mockResolvedValue([]);

//     const res = await request(app).post("/api/auth/reset-password").send({
//       email: "om@gmail.com",
//       otp: "123456",
//       newPassword: "newpass123",
//     });

//     expect(res.status).toBe(200);
//   });
// });












const request = require("supertest");
const bcrypt = require("bcryptjs");
const { prismaMock } = require("./prismaMock");
const { makeToken } = require("./testhelpers");

// Mock the actual functions auth.js imports — these must match
// emailService.js's real exports exactly, or a stale mock will silently
// let the real (network-calling) function run instead.
jest.mock("../src/utils/emailService.js", () => ({
  sendLoginOtpEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetOtpEmail: jest.fn().mockResolvedValue(undefined),
  sendRenewalReminder: jest.fn().mockResolvedValue(undefined),
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendEmailChangeOtpEmail: jest.fn().mockResolvedValue(undefined),
}));

// testApp.js also mounts members.js, which requires the Puppeteer-based PDF
// renderer at load time — mock it here too so this file doesn't need a real
// Chromium install just to test auth routes.
jest.mock("../src/utils/pdfRenderer.js", () => ({
  htmlToPdfBuffer: jest.fn().mockResolvedValue(Buffer.from("%PDF-fake")),
}));

// Razorpay SDK also loads at members.js import time (via razorpayClient.js).
jest.mock("../src/utils/razorpayClient.js", () => {
  const actual = jest.requireActual("../src/utils/razorpayClient.js");
  return { ...actual, razorpay: { orders: { create: jest.fn() } } };
});

// google-auth-library's OAuth2Client is instantiated at module load time in
// auth.js. Mock the whole module so tests never make a real network call to
// Google, and so we can control verifyIdToken's result per test.
const mockVerifyIdToken = jest.fn();
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

const {
  sendLoginOtpEmail,
  sendPasswordResetOtpEmail,
} = require("../src/utils/emailService.js");

const app = require("./testApp");

describe("POST /api/auth/login", () => {
  it("returns a token for correct credentials", async () => {
    const hashed = await bcrypt.hash("correct-password", 10);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "admin@memberhub.com",
      password: hashed,
      role: "ADMIN",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@memberhub.com", password: "correct-password" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("rejects an incorrect password", async () => {
    const hashed = await bcrypt.hash("correct-password", 10);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "admin@memberhub.com",
      password: hashed,
      role: "ADMIN",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@memberhub.com", password: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("rejects an email that doesn't exist", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@gmail.com", password: "whatever" });

    expect(res.status).toBe(401);
  });

  it("rejects an OTP-only account with no password set (null password)", async () => {
    // Members who signed up via OTP but never went through
    // otp/verify-signup would have password: null — /login must not
    // let bcrypt.compare blow up on a null hash.
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-3",
      email: "member@gmail.com",
      password: null,
      role: "MEMBER",
    });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "member@gmail.com", password: "anything" });

    expect(res.status).toBe(401);
  });

  it("returns 500 with a message (not a crash) on unexpected DB errors", async () => {
    prismaMock.user.findUnique.mockRejectedValue(new Error("DB unreachable"));

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@memberhub.com", password: "whatever" });

    expect(res.status).toBe(500);
  });
});

describe("POST /api/auth/google", () => {
  it("creates a new MEMBER user on first-time Google sign-in and links a matching Member", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: "Newuser@Gmail.com",
        email_verified: true,
        sub: "google-sub-123",
      }),
    });
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "user-new",
      email: "newuser@gmail.com",
      role: "MEMBER",
    });
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      email: "newuser@gmail.com",
      userId: null,
    });
    prismaMock.member.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/google")
      .send({ credential: "fake-google-jwt" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    // Confirms auto-link to the pre-existing (e.g. admin-added cash) Member
    expect(prismaMock.member.update).toHaveBeenCalledWith({
      where: { id: "member-1" },
      data: { userId: "user-new" },
    });
  });

  it("logs an existing Google user in without creating a duplicate", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: "existing@gmail.com",
        email_verified: true,
        sub: "google-sub-456",
      }),
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-existing",
      email: "existing@gmail.com",
      googleId: "google-sub-456",
      role: "MEMBER",
    });

    const res = await request(app)
      .post("/api/auth/google")
      .send({ credential: "fake-google-jwt" });

    expect(res.status).toBe(200);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it("rejects when Google reports the email as unverified", async () => {
    mockVerifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: "unverified@gmail.com",
        email_verified: false,
        sub: "google-sub-789",
      }),
    });

    const res = await request(app)
      .post("/api/auth/google")
      .send({ credential: "fake-google-jwt" });

    expect(res.status).toBe(400);
  });

  it("rejects when no credential is provided", async () => {
    const res = await request(app).post("/api/auth/google").send({});

    expect(res.status).toBe(400);
  });

  it("rejects an invalid/expired Google credential", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("Invalid token signature"));

    const res = await request(app)
      .post("/api/auth/google")
      .send({ credential: "garbage-token" });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/otp/request", () => {
  it("sends an OTP for a brand-new email", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.loginOTP.create.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/otp/request")
      .send({ email: "newmember@gmail.com" });

    expect(res.status).toBe(200);
    expect(sendLoginOtpEmail).toHaveBeenCalledWith(
      "newmember@gmail.com",
      expect.stringMatching(/^\d{6}$/),
    );
  });

  it("rejects if an account with a password already exists for this email", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "already@gmail.com",
      password: "some-hash",
    });

    const res = await request(app)
      .post("/api/auth/otp/request")
      .send({ email: "already@gmail.com" });

    expect(res.status).toBe(400);
    expect(sendLoginOtpEmail).not.toHaveBeenCalled();
  });

  it("rejects a missing email", async () => {
    const res = await request(app).post("/api/auth/otp/request").send({});

    expect(res.status).toBe(400);
  });

  it("still returns 500 if the email provider fails, rather than reporting false success", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.loginOTP.create.mockResolvedValue({});
    sendLoginOtpEmail.mockRejectedValueOnce(new Error("Brevo API down"));

    const res = await request(app)
      .post("/api/auth/otp/request")
      .send({ email: "member@gmail.com" });

    expect(res.status).toBe(500);
  });
});

describe("POST /api/auth/otp/verify-signup", () => {
  it("creates a new account with a valid, unexpired OTP", async () => {
    prismaMock.loginOTP.findFirst.mockResolvedValue({
      id: "otp-1",
      email: "member@gmail.com",
      otp: "123456",
      used: false,
      expiresAt: new Date(Date.now() + 60000),
    });
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: "user-new",
      email: "member@gmail.com",
      role: "MEMBER",
    });
    prismaMock.member.findUnique.mockResolvedValue(null); // no pre-existing Member
    prismaMock.loginOTP.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/otp/verify-signup")
      .send({
        email: "member@gmail.com",
        otp: "123456",
        password: "password123",
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    // Confirms the OTP is marked used so it can't be replayed
    expect(prismaMock.loginOTP.update).toHaveBeenCalledWith({
      where: { id: "otp-1" },
      data: { used: true },
    });
  });

  it("adds a password onto an existing Google-only account (no duplicate created)", async () => {
    prismaMock.loginOTP.findFirst.mockResolvedValue({
      id: "otp-2",
      email: "googleuser@gmail.com",
      otp: "654321",
      used: false,
      expiresAt: new Date(Date.now() + 60000),
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-google",
      email: "googleuser@gmail.com",
      password: null,
      googleId: "google-sub",
    });
    prismaMock.user.update.mockResolvedValue({
      id: "user-google",
      email: "googleuser@gmail.com",
      role: "MEMBER",
    });
    prismaMock.loginOTP.update.mockResolvedValue({});

    const res = await request(app).post("/api/auth/otp/verify-signup").send({
      email: "googleuser@gmail.com",
      otp: "654321",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(prismaMock.user.create).not.toHaveBeenCalled();
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it("rejects an invalid or expired OTP", async () => {
    prismaMock.loginOTP.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/otp/verify-signup")
      .send({
        email: "member@gmail.com",
        otp: "000000",
        password: "password123",
      });

    expect(res.status).toBe(400);
  });

  it("rejects an expired OTP even if the code matches", async () => {
    prismaMock.loginOTP.findFirst.mockResolvedValue({
      id: "otp-3",
      email: "member@gmail.com",
      otp: "123456",
      used: false,
      expiresAt: new Date(Date.now() - 60000), // 1 minute in the past
    });

    const res = await request(app)
      .post("/api/auth/otp/verify-signup")
      .send({
        email: "member@gmail.com",
        otp: "123456",
        password: "password123",
      });

    expect(res.status).toBe(400);
  });

  it("rejects a password shorter than 6 characters", async () => {
    const res = await request(app)
      .post("/api/auth/otp/verify-signup")
      .send({ email: "member@gmail.com", otp: "123456", password: "abc" });

    expect(res.status).toBe(400);
  });

  it("rejects if an account with a password already exists (should log in instead)", async () => {
    prismaMock.loginOTP.findFirst.mockResolvedValue({
      id: "otp-4",
      email: "already@gmail.com",
      otp: "123456",
      used: false,
      expiresAt: new Date(Date.now() + 60000),
    });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "already@gmail.com",
      password: "existing-hash",
    });

    const res = await request(app)
      .post("/api/auth/otp/verify-signup")
      .send({
        email: "already@gmail.com",
        otp: "123456",
        password: "password123",
      });

    expect(res.status).toBe(400);
  });
});

describe("PUT /api/auth/change-password", () => {
  it("rejects an incorrect current password", async () => {
    const hashed = await bcrypt.hash("real-current-password", 10);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      password: hashed,
    });

    const token = makeToken({ userId: "user-1", role: "ADMIN" });

    const res = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "wrong-guess", newPassword: "newpass123" });

    expect(res.status).toBe(400);
  });

  it("changes the password when the current password is correct", async () => {
    const hashed = await bcrypt.hash("real-current-password", 10);
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      password: hashed,
    });
    prismaMock.user.update.mockResolvedValue({});

    const token = makeToken({ userId: "user-1", role: "ADMIN" });

    const res = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({
        currentPassword: "real-current-password",
        newPassword: "newpass123",
      });

    expect(res.status).toBe(200);
    expect(prismaMock.user.update).toHaveBeenCalled();
  });

  it("rejects an OTP-only account with no password set", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      password: null,
    });

    const token = makeToken({ userId: "user-1", role: "MEMBER" });

    const res = await request(app)
      .put("/api/auth/change-password")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPassword: "a", newPassword: "newpass123" });

    expect(res.status).toBe(400);
  });

  it("requires authentication", async () => {
    const res = await request(app)
      .put("/api/auth/change-password")
      .send({ currentPassword: "a", newPassword: "b" });

    expect(res.status).toBe(403);
  });
});

describe("POST /api/auth/forgot-password + reset-password", () => {
  it("always returns a generic success message, even for unknown emails", async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "unknown@gmail.com" });

    expect(res.status).toBe(200);
    expect(sendPasswordResetOtpEmail).not.toHaveBeenCalled();
  });

  it("sends a reset OTP for an account that has a password", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "admin@memberhub.com",
      password: "some-hash",
    });
    prismaMock.passwordResetOTP.create.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "admin@memberhub.com" });

    expect(res.status).toBe(200);
    expect(sendPasswordResetOtpEmail).toHaveBeenCalledWith(
      "admin@memberhub.com",
      expect.stringMatching(/^\d{6}$/),
    );
  });

  it("does not send a reset OTP for an OTP-only account with no password", async () => {
    // No password means no way to "reset" one — reset only makes sense for
    // accounts that already have a password to change.
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-2",
      email: "otponly@gmail.com",
      password: null,
    });

    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "otponly@gmail.com" });

    expect(res.status).toBe(200);
    expect(sendPasswordResetOtpEmail).not.toHaveBeenCalled();
  });

  it("rejects reset with an invalid or expired OTP", async () => {
    prismaMock.passwordResetOTP.findFirst.mockResolvedValue(null);

    const res = await request(app).post("/api/auth/reset-password").send({
      email: "om@gmail.com",
      otp: "000000",
      newPassword: "newpass123",
    });

    expect(res.status).toBe(400);
  });

  it("resets the password with a valid, unexpired OTP", async () => {
    prismaMock.passwordResetOTP.findFirst.mockResolvedValue({
      id: "otp-1",
      email: "om@gmail.com",
      otp: "123456",
      used: false,
      expiresAt: new Date(Date.now() + 60000),
    });
    prismaMock.$transaction.mockResolvedValue([]);

    const res = await request(app).post("/api/auth/reset-password").send({
      email: "om@gmail.com",
      otp: "123456",
      newPassword: "newpass123",
    });

    expect(res.status).toBe(200);
  });

  it("rejects reset with a missing OTP or newPassword", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({
      email: "om@gmail.com",
    });

    expect(res.status).toBe(400);
  });
});