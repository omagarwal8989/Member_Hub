const Razorpay = require("razorpay");
const crypto = require("crypto");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Verifies the signature Razorpay Checkout hands back to the browser after
// a successful payment. This is the client-side confirmation — see the
// webhook handler for the server-to-server confirmation, which is the one
// that can't be skipped by closing the browser mid-flow.
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

// Verifies a Razorpay webhook request came from Razorpay and wasn't
// tampered with. `rawBody` must be the exact, unparsed request body string
// — HMACs are computed over exact bytes, so a re-serialized JSON object
// (even with identical values) can produce a different signature.
function verifyWebhookSignature({ rawBody, signature }) {
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest("hex");
  return expected === signature;
}

module.exports = { razorpay, verifyPaymentSignature, verifyWebhookSignature };
