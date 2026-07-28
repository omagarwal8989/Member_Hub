const request = require("supertest");
const { prismaMock } = require("./prismaMock");

// testApp.js also mounts members.js, which requires Puppeteer at load time.
jest.mock("../src/utils/pdfRenderer.js", () => ({
  htmlToPdfBuffer: jest.fn().mockResolvedValue(Buffer.from("%PDF-fake")),
}));
jest.mock("../src/utils/razorpayClient.js", () => {
  const actual = jest.requireActual("../src/utils/razorpayClient.js");
  return { ...actual, razorpay: { orders: { create: jest.fn() } } };
});

const app = require("./testApp");

describe("GET /api/public/tiers", () => {
  it("requires no authentication and returns tier pricing", async () => {
    prismaMock.membershipTier.findMany.mockResolvedValue([
      { id: "tier-1", name: "Gym Only", price: 1500, durationDays: 30 },
      { id: "tier-2", name: "Gym + Yoga", price: 2200, durationDays: 30 },
    ]);

    const res = await request(app).get("/api/public/tiers");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe("Gym Only");
    // Confirms no sensitive/internal fields leak through this public route
    expect(res.body[0].members).toBeUndefined();
  });

  it("only queries active (non-retired) tiers", async () => {
    prismaMock.membershipTier.findMany.mockResolvedValue([]);

    await request(app).get("/api/public/tiers");

    expect(prismaMock.membershipTier.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { isActive: true } }),
    );
  });

  it("returns an empty array gracefully when no tiers are configured yet", async () => {
    prismaMock.membershipTier.findMany.mockResolvedValue([]);

    const res = await request(app).get("/api/public/tiers");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});