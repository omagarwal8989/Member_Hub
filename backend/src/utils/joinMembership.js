const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Shared by both the browser-side /join/verify confirmation AND the
// Razorpay webhook fallback, so a new member's account gets created
// reliably even if the browser closes right after payment succeeds.
// Idempotent: if this user already has a Member, or this exact payment
// was already applied by the other path, it's a safe no-op.
async function createMemberFromJoinPayment({
  userId,
  tierId,
  firstName,
  lastName,
  razorpayOrderId,
  razorpayPaymentId,
}) {
  const existing = await prisma.member.findUnique({ where: { userId } });
  if (existing) return { member: existing, created: false };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found for this payment.");

  const tier = await prisma.membershipTier.findUnique({
    where: { id: tierId },
  });
  if (!tier) throw new Error("Tier not found for this payment.");

  const endDate = new Date();
  endDate.setDate(endDate.getDate() + tier.durationDays);

  try {
    const member = await prisma.$transaction(async (tx) => {
      const newMember = await tx.member.create({
        data: {
          userId: user.id,
          firstName: firstName?.trim() || "Member",
          lastName: lastName?.trim() || "",
          email: user.email,
          tierId: tier.id,
          endDate,
          status: "ACTIVE",
        },
      });


      // await tx.payment.create({
      //   data: {
      //     memberId: newMember.id,
      //     tierId: tier.id,
      //     amount: tier.price,
      //     currency: "INR",
      //     method: "ONLINE",
      //     razorpayOrderId,
      //     razorpayPaymentId: razorpayPaymentId || null,
      //     status: "PAID",
      //   },
      // });

      
      await tx.payment.create({
        data: {
          memberId: newMember.id,
          tierId: tier.id,
          amount: tier.price,
          currency: "INR",
          method: "ONLINE",
          razorpayOrderId,
          razorpayPaymentId: razorpayPaymentId || null,
          status: "PAID",
          periodStart: now, // <-- add (reuse the `now` already computed above for endDate)
          periodEnd: endDate, // <-- add (already computed above)
        },
      });
      return newMember;
    });
    return { member, created: true };
  } catch (err) {
    // Race with the webhook/verify path running at nearly the same
    // moment — someone else already created this exact payment/member.
    // Treat as success rather than erroring.
    if (err.code === "P2002") {
      const already = await prisma.member.findUnique({ where: { userId } });
      if (already) return { member: already, created: false };
    }
    throw err;
  }
}

module.exports = { createMemberFromJoinPayment };
