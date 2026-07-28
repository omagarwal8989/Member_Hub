const request = require("supertest");
const crypto = require("crypto");
const { prismaMock } = require("./prismaMock");

process.env.RAZORPAY_WEBHOOK_SECRET = "webhook_secret_456";
process.env.RAZORPAY_KEY_ID = "rzp_test_fake";
process.env.RAZORPAY_KEY_SECRET = "test_secret_123";

const app = require("./testWebhookApp");

function signBody(bodyString) {
  return crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(bodyString)
    .digest("hex");
}

describe("Razorpay webhook", () => {
  it("rejects a request with no signature header", async () => {
    const res = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({ event: "payment.captured" }));

    expect(res.status).toBe(400);
  });

  it("rejects a request with a tampered signature", async () => {
    const body = JSON.stringify({ event: "payment.captured" });
    const res = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", "not_the_real_signature")
      .send(body);

    expect(res.status).toBe(400);
  });

  it("accepts a correctly signed payment.captured event and applies the renewal", async () => {
    const body = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: { id: "pay_TEST123", order_id: "order_TEST456" },
        },
      },
    });
    const signature = signBody(body);

    prismaMock.payment.findUnique.mockResolvedValue({
      id: "payment-1",
      memberId: "member-1",
      status: "PENDING",
    });
    prismaMock.member.findUnique.mockResolvedValue({
      id: "member-1",
      endDate: new Date("2026-01-01"),
      tier: { durationDays: 30 },
    });
    prismaMock.$transaction.mockResolvedValue([]);

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", signature)
      .send(body);

    expect(res.status).toBe(200);
    expect(prismaMock.$transaction).toHaveBeenCalled();
  });

  it("does not re-apply a renewal for a payment already marked PAID", async () => {
    const body = JSON.stringify({
      event: "payment.captured",
      payload: {
        payment: {
          entity: { id: "pay_TEST789", order_id: "order_ALREADY_PAID" },
        },
      },
    });
    const signature = signBody(body);

    prismaMock.payment.findUnique.mockResolvedValue({
      id: "payment-2",
      memberId: "member-2",
      status: "PAID", // already applied, e.g. by the /verify endpoint
    });

    const res = await request(app)
      .post("/api/payments/webhook")
      .set("Content-Type", "application/json")
      .set("x-razorpay-signature", signature)
      .send(body);

    expect(res.status).toBe(200);
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });
});

describe("Raw-body middleware does not break normal JSON routes", () => {
  it("still parses JSON correctly on unrelated routes", async () => {
    const res = await request(app).post("/api/echo").send({ hello: "world" });

    expect(res.status).toBe(200);
    expect(res.body.received).toEqual({ hello: "world" });
  });
});
