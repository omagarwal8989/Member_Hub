// const express = require("express");
// const { PrismaClient } = require("@prisma/client");
// // const { verifyWebhookSignature } = require("../utils/razorpayClient.js");
// const { razorpay , verifyWebhookSignature } = require("../utils/razorpayClient.js");
// const { createMemberFromJoinPayment } = require("../utils/joinMembership.js");

// const router = express.Router();
// const prisma = new PrismaClient();

// // This is the reliable half of the payment confirmation flow. The /verify
// // endpoint in members.js handles the common case (browser calls it right
// // after Razorpay Checkout succeeds), but if the browser is closed or the
// // network drops before that call completes, the renewal would never apply.
// // Razorpay calls this endpoint directly from their servers regardless of
// // what the customer's browser does, so it's the source of truth.
// //
// // IMPORTANT: this route relies on receiving the raw, unparsed request body
// // — see server.js, where express.raw() is applied specifically to this
// // path before the global express.json() middleware.
// router.post("/webhook", async (req, res) => {
//   const signature = req.headers["x-razorpay-signature"];
//   const rawBody = req.body; // Buffer, thanks to express.raw() in server.js

//   if (!signature || !Buffer.isBuffer(rawBody)) {
//     return res.status(400).json({ error: "Malformed webhook request." });
//   }

//   const isValid = verifyWebhookSignature({
//     rawBody: rawBody.toString(),
//     signature,
//   });

//   if (!isValid) {
//     return res.status(400).json({ error: "Invalid webhook signature." });
//   }

//   let event;
//   try {
//     event = JSON.parse(rawBody.toString());
//   } catch {
//     return res.status(400).json({ error: "Invalid JSON body." });
//   }

//   // if (event.event === "payment.captured") {
//   //   const razorpayPayment = event.payload.payment.entity;
//   //   const orderId = razorpayPayment.order_id;

//   //   try {
//   //     const payment = await prisma.payment.findUnique({
//   //       where: { razorpayOrderId: orderId },
//   //     });

//   //     // Idempotency guard: if /verify already applied this renewal (or a
//   //     // duplicate webhook delivery already did), don't do it twice.
//   //     if (payment && payment.status !== "PAID") {
//   //       const member = await prisma.member.findUnique({
//   //         where: { id: payment.memberId },
//   //         include: { tier: true },
//   //       });

//   //       if (member) {
//   //         const now = new Date();
//   //         const baseDate = member.endDate > now ? member.endDate : now;
//   //         const newEndDate = new Date(baseDate);
//   //         newEndDate.setDate(newEndDate.getDate() + member.tier.durationDays);

//   //         await prisma.$transaction([
//   //           prisma.payment.update({
//   //             where: { id: payment.id },
//   //             data: { status: "PAID", razorpayPaymentId: razorpayPayment.id },
//   //           }),
//   //           prisma.member.update({
//   //             where: { id: member.id },
//   //             data: { endDate: newEndDate, status: "ACTIVE" },
//   //           }),
//   //         ]);
//   //       }
//   //     }
//   //   } catch (err) {
//   //     // Deliberately still respond 200 below — Razorpay retries failing
//   //     // webhooks aggressively, and a transient DB error here shouldn't
//   //     // trigger a retry storm. The failure is logged for manual follow-up.
//   //     console.error("Webhook processing error:", err.message);
//   //   }
//   // }

//   // if (event.event === "payment.captured") {
//   //   const razorpayPayment = event.payload.payment.entity;
//   //   const orderId = razorpayPayment.order_id;

//   //   try {
//   //     const payment = await prisma.payment.findUnique({
//   //       where: { razorpayOrderId: orderId },
//   //     });

//   //     if (payment && payment.status !== "PAID") {
//   //       const member = await prisma.member.findUnique({
//   //         where: { id: payment.memberId },
//   //       });

//   //       const paidTier = payment.tierId
//   //         ? await prisma.membershipTier.findUnique({
//   //             where: { id: payment.tierId },
//   //           })
//   //         : null;

//   //       if (member && paidTier) {
//   //         const now = new Date();
//   //         const baseDate = member.endDate > now ? member.endDate : now;
//   //         const newEndDate = new Date(baseDate);
//   //         newEndDate.setDate(newEndDate.getDate() + paidTier.durationDays);

//   //         await prisma.$transaction([
//   //           prisma.payment.update({
//   //             where: { id: payment.id },
//   //             data: { status: "PAID", razorpayPaymentId: razorpayPayment.id },
//   //           }),
//   //           prisma.member.update({
//   //             where: { id: member.id },
//   //             data: {
//   //               endDate: newEndDate,
//   //               status: "ACTIVE",
//   //               tierId: paidTier.id,
//   //             },
//   //           }),
//   //         ]);
//   //       }
//   //     }
//   //   } catch (err) {
//   //     console.error("Webhook processing error:", err.message);
//   //   }
//   // }

//   if (event.event === "payment.captured") {
//     const razorpayPayment = event.payload.payment.entity;
//     const orderId = razorpayPayment.order_id;

//     try {
//       const payment = await prisma.payment.findUnique({
//         where: { razorpayOrderId: orderId },
//       });

//       if (payment && payment.status !== "PAID") {
//         const member = await prisma.member.findUnique({
//           where: { id: payment.memberId },
//           include: { tier: true },
//         });

//         if (member) {
//           const now = new Date();
//           const baseDate = member.endDate > now ? member.endDate : now;
//           const newEndDate = new Date(baseDate);
//           newEndDate.setDate(newEndDate.getDate() + member.tier.durationDays);

//           await prisma.$transaction([
//             prisma.payment.update({
//               where: { id: payment.id },
//               data: { status: "PAID", razorpayPaymentId: razorpayPayment.id },
//             }),
//             prisma.member.update({
//               where: { id: member.id },
//               data: { endDate: newEndDate, status: "ACTIVE" },
//             }),
//           ]);
//         }
//       } else if (!payment) {
//         // No Payment row exists yet — this may be a first-time "join"
//         // payment, where the Member (and its Payment row) are only
//         // created once payment is confirmed. Check the order's notes.
//         const order = await razorpay.orders.fetch(orderId);
//         if (order.notes?.type === "join") {
//           const { created } = await createMemberFromJoinPayment({
//             userId: order.notes.userId,
//             tierId: order.notes.tierId,
//             firstName: order.notes.firstName,
//             lastName: order.notes.lastName,
//             razorpayOrderId: orderId,
//             razorpayPaymentId: razorpayPayment.id,
//           });
//           if (created) {
//             prisma.activityLog
//               .create({
//                 data: {
//                   type: "MEMBER_ADDED",
//                   message: "New member joined online (via webhook)",
//                 },
//               })
//               .catch(() => {});
//           }
//         }
//       }
//     } catch (err) {
//       console.error("Webhook processing error:", err.message);
//     }
//   }

//   res.status(200).json({ received: true });
// });

// module.exports = router;










const express = require("express");
const { PrismaClient } = require("@prisma/client");
const {
  razorpay,
  verifyWebhookSignature,
} = require("../utils/razorpayClient.js");
const { createMemberFromJoinPayment } = require("../utils/joinMembership.js");

const router = express.Router();
const prisma = new PrismaClient();

// This is the reliable half of the payment confirmation flow. The /verify
// endpoint in members.js handles the common case (browser calls it right
// after Razorpay Checkout succeeds), but if the browser is closed or the
// network drops before that call completes, the renewal would never apply.
// Razorpay calls this endpoint directly from their servers regardless of
// what the customer's browser does, so it's the source of truth.
//
// IMPORTANT: this route relies on receiving the raw, unparsed request body
// — see server.js, where express.raw() is applied specifically to this
// path before the global express.json() middleware.
//
// The ENTIRE handler is wrapped in one try/catch — a thrown error here
// (signature check, JSON parsing, or DB call) must never crash the whole
// server. Razorpay also retries failing webhooks aggressively, so on any
// unexpected error we still respond 200 to avoid a retry storm, logging
// the failure for manual follow-up instead.
router.post("/webhook", async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = req.body; // Buffer, thanks to express.raw() in server.js

    if (!signature || !Buffer.isBuffer(rawBody)) {
      return res.status(400).json({ error: "Malformed webhook request." });
    }

    const isValid = verifyWebhookSignature({
      rawBody: rawBody.toString(),
      signature,
    });

    if (!isValid) {
      return res.status(400).json({ error: "Invalid webhook signature." });
    }

    let event;
    try {
      event = JSON.parse(rawBody.toString());
    } catch {
      return res.status(400).json({ error: "Invalid JSON body." });
    }

    if (event.event === "payment.captured") {
      const razorpayPayment = event.payload.payment.entity;
      const orderId = razorpayPayment.order_id;

      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: orderId },
      });

      // if (payment && payment.status !== "PAID") {
      //   // Idempotency guard: if /verify already applied this renewal (or a
      //   // duplicate webhook delivery already did), don't do it twice.
      //   const member = await prisma.member.findUnique({
      //     where: { id: payment.memberId },
      //     include: { tier: true },
      //   });

      //   if (member) {
      //     const now = new Date();
      //     const baseDate = member.endDate > now ? member.endDate : now;
      //     const newEndDate = new Date(baseDate);
      //     newEndDate.setDate(newEndDate.getDate() + member.tier.durationDays);

      //     await prisma.$transaction([
      //       prisma.payment.update({
      //         where: { id: payment.id },
      //         data: { status: "PAID", razorpayPaymentId: razorpayPayment.id },
      //       }),
      //       prisma.member.update({
      //         where: { id: member.id },
      //         data: { endDate: newEndDate, status: "ACTIVE" },
      //       }),
      //     ]);
      //   }
      // }

      
      if (payment && payment.status !== "PAID") {
        const member = await prisma.member.findUnique({
          where: { id: payment.memberId },
          include: { tier: true },
        });

        if (member) {
          const now = new Date();
          const baseDate = member.endDate > now ? member.endDate : now;
          const newEndDate = new Date(baseDate);
          newEndDate.setDate(newEndDate.getDate() + member.tier.durationDays);

          await prisma.$transaction([
            prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: "PAID",
                razorpayPaymentId: razorpayPayment.id,
                periodStart: baseDate, // <-- add
                periodEnd: newEndDate, // <-- add
              },
            }),
            prisma.member.update({
              where: { id: member.id },
              data: { endDate: newEndDate, status: "ACTIVE" },
            }),
          ]);
        }
      }


      else if (!payment) {
        // No Payment row exists yet — this may be a first-time "join"
        // payment, where the Member (and its Payment row) are only
        // created once payment is confirmed. Check the order's notes.
        const order = await razorpay.orders.fetch(orderId);
        if (order.notes?.type === "join") {
          const { created } = await createMemberFromJoinPayment({
            userId: order.notes.userId,
            tierId: order.notes.tierId,
            firstName: order.notes.firstName,
            lastName: order.notes.lastName,
            razorpayOrderId: orderId,
            razorpayPaymentId: razorpayPayment.id,
          });
          if (created) {
            prisma.activityLog
              .create({
                data: {
                  type: "MEMBER_ADDED",
                  message: "New member joined online (via webhook)",
                },
              })
              .catch(() => {});
          }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err.message);
    // Still respond 200 — see comment above the route.
    res.status(200).json({ received: true });
  }
});

module.exports = router;