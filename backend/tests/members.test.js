// const request = require("supertest");
// const { prismaMock } = require("./prismaMock");
// const { makeToken } = require("./testHelpers");

// // Certificate generation now uses Puppeteer (a real headless Chromium
// // instance) — that's appropriate for production, not for a fast, offline
// // unit test. Mock it so tests never need a real browser installed.
// jest.mock("../src/utils/pdfRenderer.js", () => ({
//   htmlToPdfBuffer: jest.fn().mockResolvedValue(Buffer.from("%PDF-fake")),
// }));

// // Mock the Razorpay client so tests never make real network calls to
// // Razorpay's API. verifyPaymentSignature keeps its real implementation
// // (pure crypto, already covered by its own dedicated tests) via
// // requireActual, so signature-checking behavior is still exercised here.
// jest.mock("../src/utils/razorpayClient.js", () => {
//   const actual = jest.requireActual("../src/utils/razorpayClient.js");
//   return {
//     ...actual,
//     razorpay: {
//       orders: {
//         create: jest.fn().mockResolvedValue({
//           id: "order_TESTFAKE",
//           amount: 50000,
//           currency: "INR",
//         }),
//       },
//     },
//   };
// });

// const app = require("./testApp");

// const adminToken = () => makeToken({ userId: "admin-1", role: "ADMIN" });
// const memberToken = (userId = "user-2") =>
//   makeToken({ userId, role: "MEMBER" });

// describe("RBAC: admin-only routes reject MEMBER role", () => {
//   it("blocks a member from listing all members", async () => {
//     const res = await request(app)
//       .get("/api/members")
//       .set("Authorization", `Bearer ${memberToken()}`);

//     expect(res.status).toBe(403);
//   });

//   it("blocks a member from deleting a member", async () => {
//     const res = await request(app)
//       .delete("/api/members/some-id")
//       .set("Authorization", `Bearer ${memberToken()}`);

//     expect(res.status).toBe(403);
//   });

//   it("blocks a member from viewing the reports overview", async () => {
//     const res = await request(app)
//       .get("/api/members/stats/overview")
//       .set("Authorization", `Bearer ${memberToken()}`);

//     expect(res.status).toBe(403);
//   });

//   it("allows an admin to list all members", async () => {
//     prismaMock.member.findMany.mockResolvedValue([]);

//     const res = await request(app)
//       .get("/api/members")
//       .set("Authorization", `Bearer ${adminToken()}`);

//     expect(res.status).toBe(200);
//   });
// });

// describe("RBAC: a member can only access their own record", () => {
//   it("allows a member to view their own profile by id", async () => {
//     prismaMock.member.findUnique.mockResolvedValue({
//       id: "member-1",
//       userId: "user-2", // matches the token's userId below
//       firstName: "Om",
//       lastName: "Agarwal",
//       email: "om@gmail.com",
//     });

//     const res = await request(app)
//       .get("/api/members/member-1")
//       .set("Authorization", `Bearer ${memberToken("user-2")}`);

//     expect(res.status).toBe(200);
//   });

//   it("blocks a member from viewing someone else's profile", async () => {
//     prismaMock.member.findUnique.mockResolvedValue({
//       id: "member-1",
//       userId: "some-other-user", // does NOT match the token's userId
//       firstName: "Om",
//       lastName: "Agarwal",
//       email: "om@gmail.com",
//     });

//     const res = await request(app)
//       .get("/api/members/member-1")
//       .set("Authorization", `Bearer ${memberToken("user-2")}`);

//     expect(res.status).toBe(403);
//   });

//   it("only allows a member to change their own email, ignoring other fields", async () => {
//     prismaMock.member.findUnique.mockResolvedValue({
//       id: "member-1",
//       userId: "user-2",
//       email: "old@gmail.com",
//     });
//     prismaMock.member.update.mockResolvedValue({});

//     const res = await request(app)
//       .put("/api/members/member-1")
//       .set("Authorization", `Bearer ${memberToken("user-2")}`)
//       .send({
//         email: "new@gmail.com",
//         status: "ACTIVE", // a member should NOT be able to change this
//         tierId: "some-other-tier", // or this
//       });

//     expect(res.status).toBe(200);
//     // Confirm only `email` made it into the update — not status or tierId
//     expect(prismaMock.member.update).toHaveBeenCalledWith(
//       expect.objectContaining({
//         data: { email: "new@gmail.com" },
//       }),
//     );
//   });
// });

// describe("Tier creation validation", () => {
//   it("rejects non-numeric price/duration", async () => {
//     const res = await request(app)
//       .post("/api/members/tiers")
//       .set("Authorization", `Bearer ${adminToken()}`)
//       .send({ name: "Gold", price: "not-a-number", durationDays: "30" });

//     expect(res.status).toBe(400);
//   });

//   it("creates a tier when price/duration are valid", async () => {
//     prismaMock.membershipTier.findFirst.mockResolvedValue(null); // no existing tiers yet
//     prismaMock.membershipTier.create.mockResolvedValue({
//       id: "tier-1",
//       name: "Gold",
//       price: 500,
//       durationDays: 365,
//     });

//     const res = await request(app)
//       .post("/api/members/tiers")
//       .set("Authorization", `Bearer ${adminToken()}`)
//       .send({ name: "Gold", price: "500", durationDays: "365" });

//     expect(res.status).toBe(201);
//     expect(prismaMock.membershipTier.create).toHaveBeenCalledWith({
//       data: {
//         name: "Gold",
//         price: 500,
//         durationDays: 365,
//         description: null,
//         displayOrder: 0,
//       },
//     });
//   });

//   it("assigns the next displayOrder after the current highest, so new plans go to the end of the list", async () => {
//     prismaMock.membershipTier.findFirst.mockResolvedValue({
//       displayOrder: 3,
//     });
//     prismaMock.membershipTier.create.mockResolvedValue({ id: "tier-x" });

//     const res = await request(app)
//       .post("/api/members/tiers")
//       .set("Authorization", `Bearer ${adminToken()}`)
//       .send({ name: "New Plan", price: "999", durationDays: "30" });

//     expect(res.status).toBe(201);
//     expect(prismaMock.membershipTier.create).toHaveBeenCalledWith(
//       expect.objectContaining({
//         data: expect.objectContaining({ displayOrder: 4 }),
//       }),
//     );
//   });

//   it("saves a trimmed description when one is provided", async () => {
//     prismaMock.membershipTier.findFirst.mockResolvedValue(null);
//     prismaMock.membershipTier.create.mockResolvedValue({ id: "tier-2" });

//     const res = await request(app)
//       .post("/api/members/tiers")
//       .set("Authorization", `Bearer ${adminToken()}`)
//       .send({
//         name: "Gym + Yoga",
//         price: "2200",
//         durationDays: "30",
//         description: "  Full gym access plus unlimited yoga classes.  ",
//       });

//     expect(res.status).toBe(201);
//     expect(prismaMock.membershipTier.create).toHaveBeenCalledWith({
//       data: {
//         name: "Gym + Yoga",
//         price: 2200,
//         durationDays: 30,
//         description: "Full gym access plus unlimited yoga classes.",
//         displayOrder: 0,
//       },
//     });
//   });

//   it("gives a friendly error when deleting a tier still assigned to members", async () => {
//     const fkError = new Error("Foreign key constraint failed");
//     fkError.code = "P2003";
//     prismaMock.membershipTier.delete.mockRejectedValue(fkError);

//     const res = await request(app)
//       .delete("/api/members/tiers/tier-1")
//       .set("Authorization", `Bearer ${adminToken()}`);

//     expect(res.status).toBe(400);
//     expect(res.body.error).toMatch(/still assigned/i);
//   });

//   it("deletes a tier successfully even if it has past payment history", async () => {
//     // With Payment.tierId now nullable + onDelete: SetNull, deleting a
//     // tier that has historical payments should just succeed — this is the
//     // exact regression that was previously blocking real tier deletion.
//     prismaMock.membershipTier.delete.mockResolvedValue({ id: "tier-1" });

//     const res = await request(app)
//       .delete("/api/members/tiers/tier-1")
//       .set("Authorization", `Bearer ${adminToken()}`);

//     expect(res.status).toBe(200);
//   });
// });

// describe("PUT /api/members/tiers/reorder", () => {
//   it("rewrites displayOrder to match the given array's positions", async () => {
//     prismaMock.$transaction.mockResolvedValue([]);

//     const res = await request(app)
//       .put("/api/members/tiers/reorder")
//       .set("Authorization", `Bearer ${adminToken()}`)
//       .send({ orderedIds: ["tier-c", "tier-a", "tier-b"] });

//     expect(res.status).toBe(200);
//     expect(prismaMock.$transaction).toHaveBeenCalled();
//   });

//   it("rejects an empty or missing orderedIds array", async () => {
//     const res = await request(app)
//       .put("/api/members/tiers/reorder")
//       .set("Authorization", `Bearer ${adminToken()}`)
//       .send({ orderedIds: [] });

//     expect(res.status).toBe(400);
//   });

//   it("blocks a member from reordering plans", async () => {
//     const res = await request(app)
//       .put("/api/members/tiers/reorder")
//       .set("Authorization", `Bearer ${memberToken()}`)
//       .send({ orderedIds: ["tier-a", "tier-b"] });

//     expect(res.status).toBe(403);
//   });
// });

// describe("Retiring and reactivating a plan", () => {
//   it("sets isActive to false when retiring a plan", async () => {
//     prismaMock.membershipTier.update.mockResolvedValue({
//       id: "tier-1",
//       isActive: false,
//     });

//     const res = await request(app)
//       .put("/api/members/tiers/tier-1")
//       .set("Authorization", `Bearer ${adminToken()}`)
//       .send({ isActive: false });

//     expect(res.status).toBe(200);
//     expect(prismaMock.membershipTier.update).toHaveBeenCalledWith(
//       expect.objectContaining({ data: { isActive: false } }),
//     );
//   });

//   it("sets isActive back to true when reactivating a plan", async () => {
//     prismaMock.membershipTier.update.mockResolvedValue({
//       id: "tier-1",
//       isActive: true,
//     });

//     const res = await request(app)
//       .put("/api/members/tiers/tier-1")
//       .set("Authorization", `Bearer ${adminToken()}`)
//       .send({ isActive: true });

//     expect(res.status).toBe(200);
//     expect(prismaMock.membershipTier.update).toHaveBeenCalledWith(
//       expect.objectContaining({ data: { isActive: true } }),
//     );
//   });

//   it("blocks a member from retiring a plan", async () => {
//     const res = await request(app)
//       .put("/api/members/tiers/tier-1")
//       .set("Authorization", `Bearer ${memberToken()}`)
//       .send({ isActive: false });

//     expect(res.status).toBe(403);
//   });
// });

// describe("POST /api/members/:id/renew/create-order", () => {
//   it("creates a Razorpay order for the member's tier price", async () => {
//     prismaMock.member.findUnique.mockResolvedValue({
//       id: "member-1",
//       userId: "user-2",
//       firstName: "Om",
//       lastName: "Agarwal",
//       tierId: "tier-1",
//       tier: { name: "Gold", price: 500 },
//     });
//     prismaMock.payment.create.mockResolvedValue({});

//     const res = await request(app)
//       .post("/api/members/member-1/renew/create-order")
//       .set("Authorization", `Bearer ${memberToken("user-2")}`);

//     expect(res.status).toBe(200);
//     expect(res.body.orderId).toBe("order_TESTFAKE");
//     expect(prismaMock.payment.create).toHaveBeenCalledWith(
//       expect.objectContaining({
//         data: expect.objectContaining({
//           memberId: "member-1",
//           amount: 500,
//           status: "PENDING",
//         }),
//       }),
//     );
//   });

//   it("blocks a member from creating a renewal order for someone else", async () => {
//     prismaMock.member.findUnique.mockResolvedValue({
//       id: "member-1",
//       userId: "some-other-user",
//       tier: { name: "Gold", price: 500 },
//     });

//     const res = await request(app)
//       .post("/api/members/member-1/renew/create-order")
//       .set("Authorization", `Bearer ${memberToken("user-2")}`);

//     expect(res.status).toBe(403);
//   });
// });

// describe("POST /api/members/:id/renew/verify", () => {
//   const crypto = require("crypto");

//   it("rejects a payment with an invalid signature", async () => {
//     prismaMock.member.findUnique.mockResolvedValue({
//       id: "member-1",
//       userId: "user-2",
//       tier: { durationDays: 30 },
//       endDate: new Date("2026-01-01"),
//     });

//     const res = await request(app)
//       .post("/api/members/member-1/renew/verify")
//       .set("Authorization", `Bearer ${memberToken("user-2")}`)
//       .send({
//         razorpay_order_id: "order_1",
//         razorpay_payment_id: "pay_1",
//         razorpay_signature: "not_the_real_signature",
//       });

//     expect(res.status).toBe(400);
//   });

//   it("applies the renewal for a validly signed payment", async () => {
//     process.env.RAZORPAY_KEY_SECRET = "test_secret_123";
//     const orderId = "order_1";
//     const paymentId = "pay_1";
//     const validSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(`${orderId}|${paymentId}`)
//       .digest("hex");

//     prismaMock.member.findUnique.mockResolvedValue({
//       id: "member-1",
//       userId: "user-2",
//       firstName: "Om",
//       lastName: "Agarwal",
//       tier: { name: "Gold", durationDays: 30 },
//       endDate: new Date("2026-01-01"),
//     });
//     prismaMock.payment.findUnique.mockResolvedValue({
//       id: "payment-1",
//       status: "PENDING",
//     });
//     prismaMock.$transaction.mockResolvedValue([]);

//     const res = await request(app)
//       .post("/api/members/member-1/renew/verify")
//       .set("Authorization", `Bearer ${memberToken("user-2")}`)
//       .send({
//         razorpay_order_id: orderId,
//         razorpay_payment_id: paymentId,
//         razorpay_signature: validSignature,
//       });

//     expect(res.status).toBe(200);
//     expect(prismaMock.$transaction).toHaveBeenCalled();
//   });
// });

// describe("GET /api/members/:id/certificate", () => {
//   it("generates a PDF for an admin request", async () => {
//     prismaMock.member.findUnique.mockResolvedValue({
//       id: "member-1",
//       userId: null,
//       firstName: "Om",
//       lastName: "Agarwal",
//       endDate: new Date("2026-12-31"),
//       tier: { name: "Gold" },
//     });
//     prismaMock.certificate.create.mockResolvedValue({ id: "cert-test-1" });

//     const res = await request(app)
//       .get("/api/members/member-1/certificate")
//       .set("Authorization", `Bearer ${adminToken()}`);

//     expect(res.status).toBe(200);
//     expect(res.headers["content-type"]).toBe("application/pdf");
//   });

//   it("blocks a member from downloading someone else's certificate", async () => {
//     prismaMock.member.findUnique.mockResolvedValue({
//       id: "member-1",
//       userId: "some-other-user",
//       firstName: "Om",
//       lastName: "Agarwal",
//       endDate: new Date("2026-12-31"),
//       tier: { name: "Gold" },
//     });

//     const res = await request(app)
//       .get("/api/members/member-1/certificate")
//       .set("Authorization", `Bearer ${memberToken("user-2")}`);

//     expect(res.status).toBe(403);
//   });

//   it("returns 404 for a nonexistent member", async () => {
//     prismaMock.member.findUnique.mockResolvedValue(null);

//     const res = await request(app)
//       .get("/api/members/does-not-exist/certificate")
//       .set("Authorization", `Bearer ${adminToken()}`);

//     expect(res.status).toBe(404);
//   });
// });











const request = require("supertest");
const { prismaMock } = require("./prismaMock");
const { makeToken } = require("./testhelpers");

// Certificate generation now uses Puppeteer (a real headless Chromium
// instance) — that's appropriate for production, not for a fast, offline
// unit test. Mock it so tests never need a real browser installed.
jest.mock("../src/utils/pdfRenderer.js", () => ({
  htmlToPdfBuffer: jest.fn().mockResolvedValue(Buffer.from("%PDF-fake")),
}));

// Mock the Razorpay client so tests never make real network calls to
// Razorpay's API. verifyPaymentSignature keeps its real implementation
// (pure crypto) via requireActual, so signature-checking behavior is still
// exercised here. orders.fetch is needed for the join-membership verify flow.
jest.mock("../src/utils/razorpayClient.js", () => {
  const actual = jest.requireActual("../src/utils/razorpayClient.js");
  return {
    ...actual,
    razorpay: {
      orders: {
        create: jest.fn().mockResolvedValue({
          id: "order_TESTFAKE",
          amount: 50000,
          currency: "INR",
        }),
        fetch: jest.fn(),
      },
    },
  };
});

// Mock the actual functions members.js imports — must match
// emailService.js's real exports exactly.
jest.mock("../src/utils/emailService.js", () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendEmailChangeOtpEmail: jest.fn().mockResolvedValue(undefined),
}));

// createMemberFromJoinPayment does its own Prisma work internally — mock
// the whole util so join/verify tests focus on the route's own logic
// (auth, signature check, ownership check) rather than re-testing that
// helper's internals here.
jest.mock("../src/utils/joinMembership.js", () => ({
  createMemberFromJoinPayment: jest.fn(),
}));

const { sendEmailChangeOtpEmail } = require("../src/utils/emailService.js");
const { razorpay } = require("../src/utils/razorpayClient.js");
const {
  createMemberFromJoinPayment,
} = require("../src/utils/joinMembership.js");

const app = require("./testApp");

const adminToken = () => makeToken({ userId: "admin-1", role: "ADMIN" });
const memberToken = (userId = "user-2") =>
  makeToken({ userId, role: "MEMBER" });

describe("RBAC: admin-only routes reject MEMBER role", () => {
  it("blocks a member from listing all members", async () => {
    const res = await request(app)
      .get("/api/members")
      .set("Authorization", `Bearer ${memberToken()}`);

    expect(res.status).toBe(403);
  });

  it("blocks a member from deleting a member", async () => {
    const res = await request(app)
      .delete("/api/members/some-id")
      .set("Authorization", `Bearer ${memberToken()}`);

    expect(res.status).toBe(403);
  });

  it("blocks a member from viewing the reports overview", async () => {
    const res = await request(app)
      .get("/api/members/stats/overview")
      .set("Authorization", `Bearer ${memberToken()}`);

    expect(res.status).toBe(403);
  });

  it("allows an admin to list all members", async () => {
    prismaMock.member.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get("/api/members")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
  });
});

describe("RBAC: a member can only access their own record", () => {
  it("allows a member to view their own profile by id", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "user-2",
      firstName: "Om",
      lastName: "Agarwal",
      email: "om@gmail.com",
    });

    const res = await request(app)
      .get("/api/members/member-1")
      .set("Authorization", `Bearer ${memberToken("user-2")}`);

    expect(res.status).toBe(200);
  });

  it("blocks a member from viewing someone else's profile", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "some-other-user",
      firstName: "Om",
      lastName: "Agarwal",
      email: "om@gmail.com",
    });

    const res = await request(app)
      .get("/api/members/member-1")
      .set("Authorization", `Bearer ${memberToken("user-2")}`);

    expect(res.status).toBe(403);
  });

  it("only allows a member to change their own email via PUT, ignoring other fields", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "user-2",
      email: "old@gmail.com",
    });
    prismaMock.member.update.mockResolvedValue({});

    const res = await request(app)
      .put("/api/members/member-1")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({
        email: "new@gmail.com",
        status: "ACTIVE", // a member should NOT be able to change this
        tierId: "some-other-tier", // or this
      });

    expect(res.status).toBe(200);
    expect(prismaMock.member.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { email: "new@gmail.com" },
      }),
    );
  });
});

describe("POST /api/members/:id/email/request-otp", () => {
  it("sends a code to the new email and blocks reusing the current email", async () => {
    prismaMock.member.findUnique
      .mockResolvedValueOnce({
        id: "member-1",
        userId: "user-2",
        email: "old@gmail.com",
      })
      .mockResolvedValueOnce(null); // no clash on the new email
    prismaMock.user.findUnique.mockResolvedValue(null); // no clash
    prismaMock.loginOTP.create.mockResolvedValue({});

    const res = await request(app)
      .post("/api/members/member-1/email/request-otp")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({ newEmail: "fresh@gmail.com" });

    expect(res.status).toBe(200);
    expect(sendEmailChangeOtpEmail).toHaveBeenCalledWith(
      "fresh@gmail.com",
      expect.stringMatching(/^\d{6}$/),
    );
  });

  it("rejects requesting the same email the member already has", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "user-2",
      email: "old@gmail.com",
    });

    const res = await request(app)
      .post("/api/members/member-1/email/request-otp")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({ newEmail: "old@gmail.com" });

    expect(res.status).toBe(400);
    expect(sendEmailChangeOtpEmail).not.toHaveBeenCalled();
  });

  it("rejects when the new email is already claimed by another Member or User", async () => {
    prismaMock.member.findUnique
      .mockResolvedValueOnce({
        id: "member-1",
        userId: "user-2",
        email: "old@gmail.com",
      })
      .mockResolvedValueOnce({ id: "member-99", email: "taken@gmail.com" }); // clash
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/members/member-1/email/request-otp")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({ newEmail: "taken@gmail.com" });

    expect(res.status).toBe(400);
    expect(sendEmailChangeOtpEmail).not.toHaveBeenCalled();
  });

  it("blocks a member from requesting an email change for someone else", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "some-other-user",
      email: "old@gmail.com",
    });

    const res = await request(app)
      .post("/api/members/member-1/email/request-otp")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({ newEmail: "fresh@gmail.com" });

    expect(res.status).toBe(403);
  });
});

describe("POST /api/members/:id/email/verify-otp", () => {
  it("applies the email change with a valid, unexpired OTP, updating both Member and User", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "user-2",
      email: "old@gmail.com",
    });
    prismaMock.loginOTP.findFirst.mockResolvedValue({
      id: "otp-1",
      email: "fresh@gmail.com",
      otp: "123456",
      used: false,
      expiresAt: new Date(Date.now() + 60000),
    });
    prismaMock.member.update.mockResolvedValue({
      id: "member-1",
      email: "fresh@gmail.com",
    });
    prismaMock.user.update.mockResolvedValue({});
    prismaMock.loginOTP.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/members/member-1/email/verify-otp")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({ newEmail: "fresh@gmail.com", otp: "123456" });

    expect(res.status).toBe(200);
    expect(prismaMock.member.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "member-1" },
        data: { email: "fresh@gmail.com" },
      }),
    );
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: "user-2" },
      data: { email: "fresh@gmail.com" },
    });
    expect(prismaMock.loginOTP.update).toHaveBeenCalledWith({
      where: { id: "otp-1" },
      data: { used: true },
    });
  });

  it("does not touch the User table for a member with no linked login (walk-in, never logged in)", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: null,
      email: "old@gmail.com",
    });
    prismaMock.loginOTP.findFirst.mockResolvedValue({
      id: "otp-1",
      email: "fresh@gmail.com",
      otp: "123456",
      used: false,
      expiresAt: new Date(Date.now() + 60000),
    });
    prismaMock.member.update.mockResolvedValue({});
    prismaMock.loginOTP.update.mockResolvedValue({});

    const res = await request(app)
      .post("/api/members/member-1/email/verify-otp")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ newEmail: "fresh@gmail.com", otp: "123456" });

    expect(res.status).toBe(200);
    expect(prismaMock.user.update).not.toHaveBeenCalled();
  });

  it("rejects an invalid or expired OTP", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "user-2",
      email: "old@gmail.com",
    });
    prismaMock.loginOTP.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/members/member-1/email/verify-otp")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({ newEmail: "fresh@gmail.com", otp: "000000" });

    expect(res.status).toBe(400);
    expect(prismaMock.member.update).not.toHaveBeenCalled();
  });
});

describe("Tier creation validation", () => {
  it("rejects non-numeric price/duration", async () => {
    const res = await request(app)
      .post("/api/members/tiers")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ name: "Gold", price: "not-a-number", durationDays: "30" });

    expect(res.status).toBe(400);
  });

  it("creates a tier when price/duration are valid", async () => {
    prismaMock.membershipTier.findFirst.mockResolvedValue(null);
    prismaMock.membershipTier.create.mockResolvedValue({
      id: "tier-1",
      name: "Gold",
      price: 500,
      durationDays: 365,
    });

    const res = await request(app)
      .post("/api/members/tiers")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ name: "Gold", price: "500", durationDays: "365" });

    expect(res.status).toBe(201);
    expect(prismaMock.membershipTier.create).toHaveBeenCalledWith({
      data: {
        name: "Gold",
        price: 500,
        durationDays: 365,
        description: null,
        displayOrder: 0,
      },
    });
  });

  it("assigns the next displayOrder after the current highest", async () => {
    prismaMock.membershipTier.findFirst.mockResolvedValue({ displayOrder: 3 });
    prismaMock.membershipTier.create.mockResolvedValue({ id: "tier-x" });

    const res = await request(app)
      .post("/api/members/tiers")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ name: "New Plan", price: "999", durationDays: "30" });

    expect(res.status).toBe(201);
    expect(prismaMock.membershipTier.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ displayOrder: 4 }),
      }),
    );
  });

  it("gives a friendly error when deleting a tier still assigned to members", async () => {
    const fkError = new Error("Foreign key constraint failed");
    fkError.code = "P2003";
    prismaMock.membershipTier.delete.mockRejectedValue(fkError);

    const res = await request(app)
      .delete("/api/members/tiers/tier-1")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/still assigned/i);
  });
});

describe("PUT /api/members/tiers/reorder", () => {
  it("rewrites displayOrder to match the given array's positions", async () => {
    prismaMock.$transaction.mockResolvedValue([]);

    const res = await request(app)
      .put("/api/members/tiers/reorder")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ orderedIds: ["tier-c", "tier-a", "tier-b"] });

    expect(res.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it("rejects an empty or missing orderedIds array", async () => {
    const res = await request(app)
      .put("/api/members/tiers/reorder")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ orderedIds: [] });

    expect(res.status).toBe(400);
  });

  it("blocks a member from reordering plans", async () => {
    const res = await request(app)
      .put("/api/members/tiers/reorder")
      .set("Authorization", `Bearer ${memberToken()}`)
      .send({ orderedIds: ["tier-a", "tier-b"] });

    expect(res.status).toBe(403);
  });
});

describe("Retiring, reactivating, and marking a plan Most Popular", () => {
  it("sets isActive to false when retiring a plan", async () => {
    prismaMock.membershipTier.update.mockResolvedValue({
      id: "tier-1",
      isActive: false,
    });

    const res = await request(app)
      .put("/api/members/tiers/tier-1")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(prismaMock.membershipTier.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { isActive: false } }),
    );
  });

  it("unsets isPopular on every other tier when a new one is marked popular", async () => {
    prismaMock.membershipTier.findUnique.mockResolvedValue({ id: "tier-2" });
    prismaMock.$transaction.mockResolvedValue([
      {},
      { id: "tier-2", isPopular: true },
    ]);

    const res = await request(app)
      .put("/api/members/tiers/tier-2/popular")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({});

    expect(res.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it("returns 404 when marking a nonexistent tier as popular", async () => {
    prismaMock.membershipTier.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .put("/api/members/tiers/does-not-exist/popular")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({});

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/members/:id — only INACTIVE members can be deleted", () => {
  it("blocks deleting an ACTIVE member", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      status: "ACTIVE",
    });

    const res = await request(app)
      .delete("/api/members/member-1")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(400);
    expect(prismaMock.member.delete).not.toHaveBeenCalled();
  });

  it("blocks deleting an EXPIRING member", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      status: "EXPIRING",
    });

    const res = await request(app)
      .delete("/api/members/member-1")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(400);
  });

  it("allows deleting an INACTIVE member", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      status: "INACTIVE",
      firstName: "Om",
      lastName: "Agarwal",
    });
    prismaMock.member.delete.mockResolvedValue({
      firstName: "Om",
      lastName: "Agarwal",
    });

    const res = await request(app)
      .delete("/api/members/member-1")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(prismaMock.member.delete).toHaveBeenCalledWith({
      where: { id: "member-1" },
    });
  });

  it("returns 404 for a nonexistent member", async () => {
    prismaMock.member.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/members/does-not-exist")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(404);
  });
});

describe("POST /api/members/:id/renew/create-order (member self-renew)", () => {
  it("creates a Razorpay order for the member's tier price", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "user-2",
      status: "EXPIRING",
      tierId: "tier-1",
      tier: { name: "Gold", price: 500 },
    });
    prismaMock.payment.create.mockResolvedValue({});

    const res = await request(app)
      .post("/api/members/member-1/renew/create-order")
      .set("Authorization", `Bearer ${memberToken("user-2")}`);

    expect(res.status).toBe(200);
    expect(res.body.orderId).toBe("order_TESTFAKE");
    expect(prismaMock.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          memberId: "member-1",
          amount: 500,
          status: "PENDING",
        }),
      }),
    );
  });

  it("blocks renewal while the membership is still ACTIVE", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "user-2",
      status: "ACTIVE",
      tier: { name: "Gold", price: 500 },
    });

    const res = await request(app)
      .post("/api/members/member-1/renew/create-order")
      .set("Authorization", `Bearer ${memberToken("user-2")}`);

    expect(res.status).toBe(400);
    expect(prismaMock.payment.create).not.toHaveBeenCalled();
  });

  it("blocks a member from creating a renewal order for someone else", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "some-other-user",
      status: "EXPIRING",
      tier: { name: "Gold", price: 500 },
    });

    const res = await request(app)
      .post("/api/members/member-1/renew/create-order")
      .set("Authorization", `Bearer ${memberToken("user-2")}`);

    expect(res.status).toBe(403);
  });
});

describe("POST /api/members/:id/renew/verify", () => {
  const crypto = require("crypto");

  it("rejects a payment with an invalid signature", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "user-2",
      tier: { durationDays: 30 },
      endDate: new Date("2026-01-01"),
    });

    const res = await request(app)
      .post("/api/members/member-1/renew/verify")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({
        razorpay_order_id: "order_1",
        razorpay_payment_id: "pay_1",
        razorpay_signature: "not_the_real_signature",
      });

    expect(res.status).toBe(400);
  });

  it("applies the renewal for a validly signed payment", async () => {
    process.env.RAZORPAY_KEY_SECRET = "test_secret_123";
    const orderId = "order_1";
    const paymentId = "pay_1";
    const validSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "user-2",
      firstName: "Om",
      lastName: "Agarwal",
      tier: { name: "Gold", durationDays: 30 },
      endDate: new Date("2026-01-01"),
    });
    prismaMock.payment.findUnique.mockResolvedValue({
      id: "payment-1",
      status: "PENDING",
      tierId: "tier-1",
    });
    prismaMock.membershipTier.findUnique.mockResolvedValue({
      id: "tier-1",
      durationDays: 30,
    });
    prismaMock.$transaction.mockResolvedValue([]);

    const res = await request(app)
      .post("/api/members/member-1/renew/verify")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      });

    expect(res.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it("does not re-apply a renewal for a payment already marked PAID (idempotency)", async () => {
    const crypto = require("crypto");
    const orderId = "order_already_paid";
    const paymentId = "pay_already_paid";
    const validSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "user-2",
    });
    prismaMock.payment.findUnique.mockResolvedValue({
      id: "payment-1",
      status: "PAID", // already applied — e.g. by the webhook
    });

    const res = await request(app)
      .post("/api/members/member-1/renew/verify")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      });

    expect(res.status).toBe(200);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe("PUT /api/members/:id/renew/direct (admin cash renewal)", () => {
  it("blocks renewal while the membership is still ACTIVE", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      status: "ACTIVE",
      tier: { name: "Gold", durationDays: 30 },
    });

    const res = await request(app)
      .put("/api/members/member-1/renew/direct")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it("extends from the existing endDate (not today) when it hasn't lapsed yet", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      status: "EXPIRING",
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      tier: { id: "tier-1", name: "Gold", price: 500, durationDays: 30 },
    });
    prismaMock.$transaction.mockResolvedValue([
      { id: "member-1", firstName: "Om", lastName: "Agarwal" },
      {},
    ]);

    const res = await request(app)
      .put("/api/members/member-1/renew/direct")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({});

    expect(res.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it("allows switching to a different tier as part of renewal", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      status: "INACTIVE",
      endDate: new Date("2020-01-01"), // long lapsed
      tier: { id: "tier-1", name: "Gold", price: 500, durationDays: 30 },
    });
    prismaMock.membershipTier.findUnique.mockResolvedValue({
      id: "tier-2",
      name: "Platinum",
      price: 1000,
      durationDays: 60,
    });
    prismaMock.$transaction.mockResolvedValue([
      {
        id: "member-1",
        firstName: "Om",
        lastName: "Agarwal",
        tierId: "tier-2",
      },
      {},
    ]);

    const res = await request(app)
      .put("/api/members/member-1/renew/direct")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ tierId: "tier-2" });

    expect(res.status).toBe(200);
    expect(prismaMock.membershipTier.findUnique).toHaveBeenCalledWith({
      where: { id: "tier-2" },
    });
  });

  it("blocks a member from using the admin direct-renewal route", async () => {
    const res = await request(app)
      .put("/api/members/member-1/renew/direct")
      .set("Authorization", `Bearer ${memberToken()}`)
      .send({});

    expect(res.status).toBe(403);
  });
});

describe("POST /api/members/join/create-order (self-service join)", () => {
  it("creates an order for a valid, active tier when the user has no membership yet", async () => {
    prismaMock.member.findUnique.mockResolvedValue(null); // no existing membership
    prismaMock.membershipTier.findUnique.mockResolvedValue({
      id: "tier-1",
      name: "Gold",
      price: 500,
      isActive: true,
    });

    const res = await request(app)
      .post("/api/members/join/create-order")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({ tierId: "tier-1", firstName: "Om", lastName: "Agarwal" });

    expect(res.status).toBe(200);
    expect(res.body.orderId).toBe("order_TESTFAKE");
  });

  it("rejects if the user already has a membership", async () => {
    prismaMock.member.findUnique.mockResolvedValue({ id: "member-1" });

    const res = await request(app)
      .post("/api/members/join/create-order")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({ tierId: "tier-1", firstName: "Om", lastName: "Agarwal" });

    expect(res.status).toBe(400);
  });

  it("rejects a missing first/last name", async () => {
    prismaMock.member.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/members/join/create-order")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({ tierId: "tier-1", firstName: "", lastName: "" });

    expect(res.status).toBe(400);
  });

  it("rejects a retired (isActive: false) tier", async () => {
    prismaMock.member.findUnique.mockResolvedValue(null);
    prismaMock.membershipTier.findUnique.mockResolvedValue({
      id: "tier-1",
      isActive: false,
    });

    const res = await request(app)
      .post("/api/members/join/create-order")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({ tierId: "tier-1", firstName: "Om", lastName: "Agarwal" });

    expect(res.status).toBe(400);
  });

  it("blocks an admin from using the member-only join route", async () => {
    const res = await request(app)
      .post("/api/members/join/create-order")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ tierId: "tier-1", firstName: "Om", lastName: "Agarwal" });

    expect(res.status).toBe(403);
  });
});

describe("POST /api/members/join/verify (self-service join)", () => {
  const crypto = require("crypto");

  const validSignatureFor = (orderId, paymentId) =>
    crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

  it("completes signup for a validly signed payment belonging to this user", async () => {
    const signature = validSignatureFor("order_join1", "pay_join1");
    razorpay.orders.fetch.mockResolvedValue({
      notes: {
        userId: "user-2",
        tierId: "tier-1",
        firstName: "Om",
        lastName: "Agarwal",
      },
    });
    createMemberFromJoinPayment.mockResolvedValue({
      member: { id: "member-new", firstName: "Om", lastName: "Agarwal" },
      created: true,
    });

    const res = await request(app)
      .post("/api/members/join/verify")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({
        razorpay_order_id: "order_join1",
        razorpay_payment_id: "pay_join1",
        razorpay_signature: signature,
      });

    expect(res.status).toBe(201);
    expect(createMemberFromJoinPayment).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-2", tierId: "tier-1" }),
    );
  });

  it("rejects an invalid signature", async () => {
    const res = await request(app)
      .post("/api/members/join/verify")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({
        razorpay_order_id: "order_join2",
        razorpay_payment_id: "pay_join2",
        razorpay_signature: "not_real",
      });

    expect(res.status).toBe(400);
    expect(createMemberFromJoinPayment).not.toHaveBeenCalled();
  });

  it("rejects when the Razorpay order belongs to a different user", async () => {
    const signature = validSignatureFor("order_join3", "pay_join3");
    razorpay.orders.fetch.mockResolvedValue({
      notes: { userId: "some-other-user", tierId: "tier-1" },
    });

    const res = await request(app)
      .post("/api/members/join/verify")
      .set("Authorization", `Bearer ${memberToken("user-2")}`)
      .send({
        razorpay_order_id: "order_join3",
        razorpay_payment_id: "pay_join3",
        razorpay_signature: signature,
      });

    expect(res.status).toBe(403);
    expect(createMemberFromJoinPayment).not.toHaveBeenCalled();
  });
});

describe("GET /api/members/:id/certificate", () => {
  it("generates a PDF for an admin request", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: null,
      firstName: "Om",
      lastName: "Agarwal",
      endDate: new Date("2026-12-31"),
      tier: { name: "Gold" },
    });
    prismaMock.certificate.create.mockResolvedValue({ id: "cert-test-1" });

    const res = await request(app)
      .get("/api/members/member-1/certificate")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toBe("application/pdf");
  });

  it("blocks a member from downloading someone else's certificate", async () => {
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      userId: "some-other-user",
      firstName: "Om",
      lastName: "Agarwal",
      endDate: new Date("2026-12-31"),
      tier: { name: "Gold" },
    });

    const res = await request(app)
      .get("/api/members/member-1/certificate")
      .set("Authorization", `Bearer ${memberToken("user-2")}`);

    expect(res.status).toBe(403);
  });

  it("returns 404 for a nonexistent member", async () => {
    prismaMock.member.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get("/api/members/does-not-exist/certificate")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(res.status).toBe(404);
  });
});