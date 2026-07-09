// const request = require("supertest");
// const { prismaMock } = require("./prismaMock");
// const { makeToken } = require("./testhelpers");

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
//       data: { name: "Gold", price: 500, durationDays: 365 },
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
//     prismaMock.certificate.create.mockResolvedValue({});

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
const { makeToken } = require("./testHelpers");

// Certificate generation now uses Puppeteer (a real headless Chromium
// instance) — that's appropriate for production, not for a fast, offline
// unit test. Mock it so tests never need a real browser installed.
jest.mock("../src/utils/pdfRenderer.js", () => ({
  htmlToPdfBuffer: jest.fn().mockResolvedValue(Buffer.from("%PDF-fake")),
}));

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
      userId: "user-2", // matches the token's userId below
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
      userId: "some-other-user", // does NOT match the token's userId
      firstName: "Om",
      lastName: "Agarwal",
      email: "om@gmail.com",
    });

    const res = await request(app)
      .get("/api/members/member-1")
      .set("Authorization", `Bearer ${memberToken("user-2")}`);

    expect(res.status).toBe(403);
  });

  it("only allows a member to change their own email, ignoring other fields", async () => {
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
    // Confirm only `email` made it into the update — not status or tierId
    expect(prismaMock.member.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { email: "new@gmail.com" },
      }),
    );
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
      data: { name: "Gold", price: 500, durationDays: 365 },
    });
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
    prismaMock.certificate.create.mockResolvedValue({});

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