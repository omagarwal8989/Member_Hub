const request = require("supertest");
const { prismaMock } = require("./prismaMock");

// testApp.js also mounts members.js, which requires the Puppeteer-based PDF
// renderer at load time — mock it here too so this file doesn't need a real
// Chromium install just to test the verification endpoint.
jest.mock("../src/utils/pdfRenderer.js", () => ({
  htmlToPdfBuffer: jest.fn().mockResolvedValue(Buffer.from("%PDF-fake")),
}));

jest.mock("../src/utils/razorpayClient.js", () => {
  const actual = jest.requireActual("../src/utils/razorpayClient.js");
  return {
    ...actual,
    razorpay: { orders: { create: jest.fn() } },
  };
});

const app = require("./testApp");

describe("GET /api/certificates/verify/:certificateId", () => {
  it("requires no authentication and returns valid details for a real certificate", async () => {
    prismaMock.certificate.findUnique.mockResolvedValue({
      id: "cert-1",
      issuedAt: new Date("2026-01-01"),
      member: {
        firstName: "Om",
        lastName: "Agarwal",
        tier: { name: "Gym + Personal Training" },
      },
    });

    const res = await request(app).get("/api/certificates/verify/cert-1");

    expect(res.status).toBe(200);
    expect(res.body.valid).toBe(true);
    expect(res.body.memberName).toBe("Om Agarwal");
    expect(res.body.tierName).toBe("Gym + Personal Training");
    // Confirms no personal contact info leaks through this public endpoint
    expect(res.body.email).toBeUndefined();
  });

  it("returns valid: false for a nonexistent certificate ID", async () => {
    prismaMock.certificate.findUnique.mockResolvedValue(null);

    const res = await request(app).get(
      "/api/certificates/verify/does-not-exist",
    );

    expect(res.status).toBe(404);
    expect(res.body.valid).toBe(false);
  });
});
