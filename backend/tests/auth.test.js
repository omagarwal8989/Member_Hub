// const request = require("supertest");
// const bcrypt = require("bcryptjs");
// const { prismaMock } = require("./prismaMock");
// const { makeToken } = require("./testhelpers");

// // The OTP email actually being sent (real Gmail SMTP) is not something a
// // unit test should trigger — mock it so tests run instantly and offline.
// jest.mock("../src/utils/emailService.js", () => ({
//   sendOtpEmail: jest.fn().mockResolvedValue(undefined),
//   sendRenewalReminder: jest.fn().mockResolvedValue(undefined),
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
const { makeToken } = require("./testHelpers");

// The OTP email actually being sent (real Gmail SMTP) is not something a
// unit test should trigger — mock it so tests run instantly and offline.
jest.mock("../src/utils/emailService.js", () => ({
  sendOtpEmail: jest.fn().mockResolvedValue(undefined),
  sendRenewalReminder: jest.fn().mockResolvedValue(undefined),
}));

// testApp.js also mounts members.js, which requires the Puppeteer-based PDF
// renderer at load time — mock it here too so this file doesn't need a real
// Chromium install just to test auth routes.
jest.mock("../src/utils/pdfRenderer.js", () => ({
  htmlToPdfBuffer: jest.fn().mockResolvedValue(Buffer.from("%PDF-fake")),
}));

const app = require("./testApp");

describe("POST /api/auth/register", () => {
  it("creates a new user and links a matching Member record by email", async () => {
    prismaMock.user.create.mockResolvedValue({
      id: "user-1",
      email: "om@gmail.com",
      role: "MEMBER",
    });
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      email: "om@gmail.com",
      userId: null,
    });
    prismaMock.member.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "Om@Gmail.com", password: "password123" });

    expect(res.status).toBe(201);
    // Confirms the email got normalized (lowercased/trimmed) before lookup
    expect(prismaMock.member.findUnique).toHaveBeenCalledWith({
      where: { email: "om@gmail.com" },
    });
    // Confirms the auto-link actually happened
    expect(prismaMock.member.update).toHaveBeenCalledWith({
      where: { id: "member-1" },
      data: { userId: "user-1" },
    });
  });

  it("does not attempt to link if the member is already linked to another account", async () => {
    prismaMock.user.create.mockResolvedValue({
      id: "user-2",
      email: "taken@gmail.com",
      role: "MEMBER",
    });
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-2",
      email: "taken@gmail.com",
      userId: "some-other-user",
    });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "taken@gmail.com", password: "password123" });

    expect(res.status).toBe(201);
    expect(prismaMock.member.update).not.toHaveBeenCalled();
  });

  it("returns 400 if the email is already registered", async () => {
    prismaMock.user.create.mockRejectedValue(new Error("Unique constraint"));

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "dup@gmail.com", password: "password123" });

    expect(res.status).toBe(400);
  });
});

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
      expiresAt: new Date(Date.now() + 60000), // 1 minute in the future
    });
    prismaMock.$transaction.mockResolvedValue([]);

    const res = await request(app).post("/api/auth/reset-password").send({
      email: "om@gmail.com",
      otp: "123456",
      newPassword: "newpass123",
    });

    expect(res.status).toBe(200);
  });
});