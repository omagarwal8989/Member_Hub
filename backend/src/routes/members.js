const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { subject } = require("@casl/ability");
// const { randomUUID } = require("crypto");
const { randomUUID, randomInt } = require("crypto");
const authenticate = require("../middleware/authMiddleware.js");
const attachAbility = require("../middleware/attachAbility.js");
const requireAbility = require("../middleware/requireAbility.js");
const upload = require("../middleware/uploadMiddleware.js"); // Import the upload tool

const { createMemberFromJoinPayment } = require("../utils/joinMembership.js");

// const { sendWelcomeEmail } = require("../utils/emailService.js");
const { sendWelcomeEmail, sendEmailChangeOtpEmail } = require("../utils/emailService.js");


const router = express.Router();
const prisma = new PrismaClient();

// Helper: fire-and-forget activity log entry, powers the notification bell.
// Wrapped so it can NEVER throw into the caller — if the ActivityLog table
// isn't migrated yet, or anything else goes wrong, logging just silently
// fails instead of breaking the actual feature (e.g. certificate download).
const logActivity = (type, message) => {
  try {
    Promise.resolve(
      prisma.activityLog.create({ data: { type, message } }),
    ).catch((err) => console.error("Failed to log activity:", err.message));
  } catch (err) {
    console.error(
      "Failed to log activity (is the ActivityLog table migrated? run `npx prisma db push`):",
      err.message,
    );
  }
};


router.get(
  "/",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  async (req, res) => {
    try {
      const members = await prisma.member.findMany({
        include: {
          tier: true,
          // Only need the most recent payment to know how this member's
          // current membership was funded — not their full payment history.
          payments: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      });
      res.status(200).json(members);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch members", details: error.message });
    }
  },
);


router.post(
  "/",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  upload.single("document"),
  async (req, res) => {
    try {
      const { firstName, lastName, tierId } = req.body;
      const email = req.body.email?.trim().toLowerCase();
      const documentUrl = req.file ? req.file.path : null;

      const tier = await prisma.membershipTier.findUnique({
        where: { id: tierId },
      });
      if (!tier) {
        return res.status(400).json({ error: "Invalid membership tier." });
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + tier.durationDays);

      const newMember = await prisma.member.create({
        data: {
          firstName,
          lastName,
          email,
          tierId,
          endDate,
          status: "ACTIVE",
          documentUrl,
        },
      });

      await prisma.payment.create({
        data: {
          memberId: newMember.id,
          tierId,
          amount: tier.price,
          currency: "INR",
          method: "CASH",
          status: "PAID",
          periodStart: new Date(), // <-- add
          periodEnd: endDate, // <-- add (already computed above)
          razorpayOrderId: `cash_${randomUUID()}`,
        },
      });

      res
        .status(201)
        .json({ message: "Member registered successfully", newMember });

      logActivity(
        "MEMBER_ADDED",
        `New member added: ${newMember.firstName} ${newMember.lastName}`,
      );

      // Fire-and-forget, same as logActivity above — doesn't block or
      // affect the response already sent to the admin.
      sendWelcomeEmail(newMember.email, newMember.firstName, tier.name).catch(
        (err) => console.error("Welcome email failed:", err.message),
      );
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to create member", details: error.message });
    }
  },
);

// 3. Create a New Membership Tier (Admin only)
router.post(
  "/tiers",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  async (req, res) => {
    try {
      const { name, description } = req.body;
      const price = parseFloat(req.body.price);
      const durationDays = parseInt(req.body.durationDays, 10);

      if (Number.isNaN(price) || Number.isNaN(durationDays)) {
        return res
          .status(400)
          .json({ error: "Price and duration must be valid numbers." });
      }

      // New plans go to the end of the display order by default — find the
      // current highest displayOrder and add one.
      const lastTier = await prisma.membershipTier.findFirst({
        orderBy: { displayOrder: "desc" },
      });
      const nextOrder = (lastTier?.displayOrder ?? -1) + 1;

      const tier = await prisma.membershipTier.create({
        data: {
          name,
          price,
          durationDays,
          description: description?.trim() || null,
          displayOrder: nextOrder,
        },
      });
      res.status(201).json({ message: "Tier created successfully", tier });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to create tier", details: error.message });
    }
  },
);

// 4. Get All Tiers (Admin only — only used by admin create/edit forms)
router.get(
  "/tiers",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  async (req, res) => {
    try {
      const tiers = await prisma.membershipTier.findMany({
        orderBy: { displayOrder: "asc" },
      });
      res.status(200).json(tiers);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch tiers", details: error.message });
    }
  },
);

// 4.4. Reorder Tiers (Admin only) — accepts an array of tier IDs in the
// desired display order and rewrites each one's displayOrder to match its
// position in that array.
router.put(
  "/tiers/reorder",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  async (req, res) => {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        return res
          .status(400)
          .json({ error: "orderedIds must be a non-empty array." });
      }

      await prisma.$transaction(
        orderedIds.map((id, index) =>
          prisma.membershipTier.update({
            where: { id },
            data: { displayOrder: index },
          }),
        ),
      );

      res.status(200).json({ message: "Plan order updated." });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to reorder plans", details: error.message });
    }
  },
);

// 4.5. Update a Tier (Admin only)
router.put(
  "/tiers/:tierId",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  async (req, res) => {
    try {
      const {
        name,
        price,
        durationDays,
        description,
        displayOrder,
        isActive,
        isPopular,
      } = req.body;
      const tier = await prisma.membershipTier.update({
        where: { id: req.params.tierId },
        data: {
          ...(name !== undefined && { name }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(durationDays !== undefined && {
            durationDays: parseInt(durationDays, 10),
          }),
          ...(description !== undefined && {
            description: description?.trim() || null,
          }),
          ...(displayOrder !== undefined && {
            displayOrder: parseInt(displayOrder, 10),
          }),
          ...(isActive !== undefined && { isActive: Boolean(isActive) }),
          ...(isPopular !== undefined && { isPopular: Boolean(isPopular) }),
        },
      });
      res.status(200).json({ message: "Tier updated successfully", tier });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Tier not found" });
      }
      res
        .status(500)
        .json({ error: "Failed to update tier", details: error.message });
    }
  },
);

// 4.55. Set a Tier as "Most Popular" (Admin only) — unsets isPopular on
// every other tier in the same transaction, guaranteeing exactly one
// (or zero, if none has been chosen yet) tier can be popular at a time.
router.put(
  "/tiers/:tierId/popular",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  async (req, res) => {
    try {
      const { tierId } = req.params;

      const existing = await prisma.membershipTier.findUnique({
        where: { id: tierId },
      });
      if (!existing) {
        return res.status(404).json({ error: "Tier not found" });
      }

      const [, updatedTier] = await prisma.$transaction([
        prisma.membershipTier.updateMany({
          where: { id: { not: tierId } },
          data: { isPopular: false },
        }),
        prisma.membershipTier.update({
          where: { id: tierId },
          data: { isPopular: true },
        }),
      ]);

      res.status(200).json({
        message: "Popular plan updated successfully",
        tier: updatedTier,
      });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Tier not found" });
      }
      res.status(500).json({
        error: "Failed to set popular plan",
        details: error.message,
      });
    }
  },
);

// 4.6. Delete a Tier (Admin only)
router.delete(
  "/tiers/:tierId",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  async (req, res) => {
    try {
      await prisma.membershipTier.delete({ where: { id: req.params.tierId } });
      res.status(200).json({ message: "Tier deleted successfully" });
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Tier not found" });
      }
      // Foreign key constraint — members are still assigned to this tier
      if (error.code === "P2003") {
        return res.status(400).json({
          error:
            "Can't delete this tier while members are still assigned to it. Move those members to a different tier first.",
        });
      }
      res
        .status(500)
        .json({ error: "Failed to delete tier", details: error.message });
    }
  },
);

// 5. Reporting & Analytics Overview (Admin only)
// IMPORTANT: declared BEFORE "/:id" below, otherwise Express would treat
// "stats" as an :id value.
router.get(
  "/stats/overview",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  async (req, res) => {
    try {
      const [members, tiers, certificates] = await Promise.all([
        prisma.member.findMany({
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
            tierId: true,
            endDate: true,
            createdAt: true,
          },
        }),
        prisma.membershipTier.findMany(),
        prisma.certificate.findMany({ select: { issuedAt: true } }),
      ]);

      // Status breakdown
      const statusBreakdown = { ACTIVE: 0, EXPIRING: 0, INACTIVE: 0 };
      members.forEach((m) => {
        if (statusBreakdown[m.status] !== undefined)
          statusBreakdown[m.status]++;
      });

      // Tier breakdown
      const tierCounts = {};
      members.forEach((m) => {
        tierCounts[m.tierId] = (tierCounts[m.tierId] || 0) + 1;
      });
      const tierBreakdown = tiers.map((tier) => ({
        name: tier.name,
        count: tierCounts[tier.id] || 0,
      }));

      // Helper: group a list of dates into "Jan 2026" style month buckets,
      // covering the last 6 months (including months with zero entries).
      const monthKey = (date) =>
        date.toLocaleString("en-US", { month: "short", year: "numeric" });

      const last6Months = Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setDate(1); // avoid month-length rollover issues
        d.setMonth(d.getMonth() - (5 - i));
        return monthKey(d);
      });

      const bucketize = (dates) => {
        const counts = Object.fromEntries(last6Months.map((m) => [m, 0]));
        dates.forEach((date) => {
          const key = monthKey(new Date(date));
          if (counts[key] !== undefined) counts[key]++;
        });
        return last6Months.map((month) => ({ month, count: counts[month] }));
      };

      const signupsByMonth = bucketize(members.map((m) => m.createdAt));
      const certificatesByMonth = bucketize(
        certificates.map((c) => c.issuedAt),
      );

      // Members expiring in the next 30 days (excluding already-inactive ones)
      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(now.getDate() + 30);

      const expiringSoon = members
        .filter(
          (m) =>
            m.status !== "INACTIVE" &&
            new Date(m.endDate) >= now &&
            new Date(m.endDate) <= in30Days,
        )
        .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
        .map((m) => ({
          id: m.id,
          name: `${m.firstName} ${m.lastName}`,
          endDate: m.endDate,
        }));

      res.status(200).json({
        totalMembers: members.length,
        totalCertificatesIssued: certificates.length,
        statusBreakdown,
        tierBreakdown,
        signupsByMonth,
        certificatesByMonth,
        expiringSoon,
      });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch stats", details: error.message });
    }
  },
);


router.get("/me", authenticate, async (req, res) => {
  try {
    let member = await prisma.member.findUnique({
      where: { userId: req.user.userId },
      include: {
        tier: true,
        documents: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 }, // <-- add this
      },
    });

    if (!member) {
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
      });
      if (user) {
        const candidate = await prisma.member.findUnique({
          where: { email: user.email },
        });
        if (candidate && !candidate.userId) {
          member = await prisma.member.update({
            where: { id: candidate.id },
            data: { userId: user.id },
            include: {
              tier: true,
              documents: true,
              payments: { orderBy: { createdAt: "desc" }, take: 1 }, // <-- add this too
            },
          });
        }
      }
    }

    if (!member) {
      return res
        .status(404)
        .json({ error: "No member profile is linked to this account." });
    }
    res.status(200).json(member);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch profile", details: error.message });
  }
});

// 6.5. Get the logged-in MEMBER's own payment/renewal history
router.get("/me/payments", authenticate, async (req, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { userId: req.user.userId },
    });

    if (!member) {
      return res
        .status(404)
        .json({ error: "No member profile is linked to this account." });
    }

    const payments = await prisma.payment.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
      include: { tier: true },
    });

    res.status(200).json(payments);
  } catch (error) {
    res
      .status(500)
      .json({
        error: "Failed to fetch payment history",
        details: error.message,
      });
  }
});

// 7. Get a Single Member by ID (Admin, or the member viewing their own record)
// IMPORTANT: this must be declared AFTER "/tiers", "/stats", and "/me" above,
// otherwise Express would treat those words as an :id value.
router.get("/:id", authenticate, attachAbility, async (req, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: { tier: true, documents: true },
    });
    if (!member) return res.status(404).json({ error: "Member not found" });

    if (req.ability.cannot("read", subject("Member", member))) {
      return res.status(403).json({ error: "Access denied." });
    }

    res.status(200).json(member);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch member", details: error.message });
  }
});

router.get("/:id", authenticate, attachAbility, async (req, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: {
        tier: true,
        documents: true,
        payments: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    if (!member) return res.status(404).json({ error: "Member not found" });

    if (req.ability.cannot("read", subject("Member", member))) {
      return res.status(403).json({ error: "Access denied." });
    }

    res.status(200).json(member);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to fetch member", details: error.message });
  }
});


// 8. Update a Member — MEMBER-SELF-SERVICE ONLY now.
// Admins can no longer edit name or email here. If an admin enters wrong
// details, the correct fix is: delete the member once their status is
// INACTIVE, then re-add them correctly — not edit identity fields after
// the fact. A member can still update their OWN email.
router.put("/:id", authenticate, attachAbility, async (req, res) => {
  try {
    const existing = await prisma.member.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: "Member not found" });

    const canUpdateOwnEmail = req.ability.can(
      "update",
      subject("Member", existing),
      "email",
    );

    if (!canUpdateOwnEmail) {
      return res.status(403).json({ error: "Access denied." });
    }

    const email = req.body.email?.trim().toLowerCase();
    if (email === undefined) {
      return res.status(400).json({ error: "Nothing to update." });
    }

    const updatedMember = await prisma.member.update({
      where: { id: req.params.id },
      data: { email },
      include: { tier: true },
    });

    if (existing.userId) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { email },
      });
    }

    res
      .status(200)
      .json({ message: "Member updated successfully", updatedMember });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Member not found" });
    }
    res
      .status(500)
      .json({ error: "Failed to update member", details: error.message });
  }
});







// 8.5. Request an OTP to change a member's email — Step 1.
// Sends a code to the NEW address to prove ownership before anything
// changes. Reuses the LoginOTP table (same shape: email/otp/expiresAt/used).
router.post("/:id/email/request-otp", authenticate, attachAbility, async (req, res) => {
  try {
    const existing = await prisma.member.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: "Member not found" });

    const canUpdateOwnEmail = req.ability.can(
      "update",
      subject("Member", existing),
      "email",
    );
    if (!canUpdateOwnEmail) {
      return res.status(403).json({ error: "Access denied." });
    }

    const newEmail = req.body.newEmail?.trim().toLowerCase();
    if (!newEmail) {
      return res.status(400).json({ error: "New email is required." });
    }
    if (newEmail === existing.email) {
      return res
        .status(400)
        .json({ error: "That's already your current email." });
    }

    // Make sure no one else (member or user login) already owns this email.
    const [memberClash, userClash] = await Promise.all([
      prisma.member.findUnique({ where: { email: newEmail } }),
      prisma.user.findUnique({ where: { email: newEmail } }),
    ]);
    if (memberClash || userClash) {
      return res
        .status(400)
        .json({ error: "That email is already in use by another account." });
    }

    const otp = randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.loginOTP.create({ data: { email: newEmail, otp, expiresAt } });
    await sendEmailChangeOtpEmail(newEmail, otp);

    res.status(200).json({ message: "Verification code sent to new email." });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to send verification code", details: error.message });
  }
});

// 8.6. Verify the OTP and actually apply the email change — Step 2.
router.post("/:id/email/verify-otp", authenticate, attachAbility, async (req, res) => {
  try {
    const existing = await prisma.member.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: "Member not found" });

    const canUpdateOwnEmail = req.ability.can(
      "update",
      subject("Member", existing),
      "email",
    );
    if (!canUpdateOwnEmail) {
      return res.status(403).json({ error: "Access denied." });
    }

    const newEmail = req.body.newEmail?.trim().toLowerCase();
    const { otp } = req.body;
    if (!newEmail || !otp) {
      return res.status(400).json({ error: "Email and code are required." });
    }

    const record = await prisma.loginOTP.findFirst({
      where: { email: newEmail, otp, used: false },
      orderBy: { createdAt: "desc" },
    });
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ error: "Invalid or expired code." });
    }

    const updatedMember = await prisma.member.update({
      where: { id: req.params.id },
      data: { email: newEmail },
      include: { tier: true },
    });

    if (existing.userId) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { email: newEmail },
      });
    }

    await prisma.loginOTP.update({
      where: { id: record.id },
      data: { used: true },
    });

    res
      .status(200)
      .json({ message: "Email updated successfully", updatedMember });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to verify code", details: error.message });
  }
});









// 9. Delete a Member (Admin only)
// Only INACTIVE (lapsed) members can be deleted — an ACTIVE or EXPIRING
// member still has a live membership, so deleting them would silently
// destroy a paying member's record. If a member needs to be removed early
// (e.g. requested it themselves), the admin flow is: let it lapse, or
// this could later be extended with an explicit "force" override — but
// that's a deliberate future decision, not an accidental click today.
router.delete(
  "/:id",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  async (req, res) => {
    try {
      const existing = await prisma.member.findUnique({
        where: { id: req.params.id },
      });
      if (!existing) return res.status(404).json({ error: "Member not found" });

      if (existing.status !== "INACTIVE") {
        return res.status(400).json({
          error:
            "Only inactive (lapsed) members can be deleted. This member's membership is still active or expiring.",
        });
      }

      const deleted = await prisma.member.delete({
        where: { id: req.params.id },
      });
      res.status(200).json({ message: "Member deleted successfully" });

      logActivity(
        "MEMBER_DELETED",
        `Member removed: ${deleted.firstName} ${deleted.lastName}`,
      );
    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Member not found" });
      }
      res
        .status(500)
        .json({ error: "Failed to delete member", details: error.message });
    }
  },
);

// 10. Upload a Document for a Member (Admin, or the member uploading their
// own document — e.g. a signed waiver or registration form)
router.post(
  "/:id/documents",
  authenticate,
  attachAbility,
  upload.single("file"),
  async (req, res) => {
    try {
      const member = await prisma.member.findUnique({
        where: { id: req.params.id },
      });
      if (!member) return res.status(404).json({ error: "Member not found" });

      if (req.ability.cannot("read", subject("Member", member))) {
        return res.status(403).json({ error: "Access denied." });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file was uploaded." });
      }

      const document = await prisma.document.create({
        data: {
          name: req.body.name?.trim() || req.file.originalname,
          url: req.file.path,
          memberId: member.id,
        },
      });

      res
        .status(201)
        .json({ message: "Document uploaded successfully", document });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to upload document", details: error.message });
    }
  },
);

// 11. Delete a Document (Admin only — keeps compliance records like signed
// waivers protected from members accidentally removing them)
router.delete(
  "/:id/documents/:docId",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  async (req, res) => {
    try {
      const document = await prisma.document.findUnique({
        where: { id: req.params.docId },
      });
      if (!document || document.memberId !== req.params.id) {
        return res.status(404).json({ error: "Document not found" });
      }

      await prisma.document.delete({ where: { id: req.params.docId } });
      res.status(200).json({ message: "Document deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to delete document", details: error.message });
    }
  },
);

const { renderCertificateHTML } = require("../utils/certificateTemplate.js");
const { htmlToPdfBuffer } = require("../utils/pdfRenderer.js");
const {
  razorpay,
  verifyPaymentSignature,
} = require("../utils/razorpayClient.js");

// 11.5. Get a Member's full payment/renewal history (Admin only)
router.get(
  "/:id/payments",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  async (req, res) => {
    try {
      const member = await prisma.member.findUnique({
        where: { id: req.params.id },
      });
      if (!member) return res.status(404).json({ error: "Member not found" });

      const payments = await prisma.payment.findMany({
        where: { memberId: member.id },
        orderBy: { createdAt: "desc" },
        include: { tier: true },
      });

      res.status(200).json(payments);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fetch payment history",
        details: error.message,
      });
    }
  },
);

// 10. Generate and Download Certificate (Admin, or the member downloading
// their own certificate)
// Optional query params let the caller customize the certificate:
//   message         - achievement text, e.g. "is an official Gold Member"
//   signatoryName   - name printed under the signature line
//   signatoryTitle  - title printed under the signatory name
//   template        - one of "classic" | "elegant" | "modern"
router.get(
  "/:id/certificate",
  authenticate,
  attachAbility,
  async (req, res) => {
    try {
      const member = await prisma.member.findUnique({
        where: { id: req.params.id },
        include: { tier: true },
      });

      if (!member) return res.status(404).json({ error: "Member not found" });

      if (req.ability.cannot("read", subject("Member", member))) {
        return res.status(403).json({ error: "Access denied." });
      }

      const {
        message,
        signatoryName,
        signatoryTitle,
        template: templateKey,
      } = req.query;

      const achievementText =
        message?.trim() || `is an official ${member.tier.name} Member`;

      // Create the Certificate record FIRST and await it — unlike before,
      // we now need its id up front to embed in the certificate itself (the
      // verification QR code encodes a URL containing this id).
      const certificate = await prisma.certificate.create({
        data: {
          memberId: member.id,
          url: `/api/members/${member.id}/certificate`,
        },
      });

      logActivity(
        "CERTIFICATE_ISSUED",
        `Certificate issued for ${member.firstName} ${member.lastName}`,
      );

      const html = await renderCertificateHTML({
        certificateId: certificate.id,
        firstName: member.firstName,
        lastName: member.lastName,
        tierName: member.tier.name,
        achievementText,
        validUntil: new Date(member.endDate).toLocaleDateString(),
        signatoryName: signatoryName?.trim(),
        signatoryTitle: signatoryTitle?.trim(),
        templateKey,
        verifyBaseUrl: process.env.FRONTEND_URL,
      });

      const pdfBuffer = await htmlToPdfBuffer(html);

      // Set headers so the browser knows it's downloading a PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${member.firstName}-Certificate.pdf`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({
        error: "Failed to generate certificate",
        details: error.message,
      });
    }
  },
);

// 12. Recent Activity Log (Admin only) — powers the notification bell
router.get(
  "/activity/recent",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  async (req, res) => {
    try {
      const activity = await prisma.activityLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 20,
      });
      res.status(200).json(activity);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch activity", details: error.message });
    }
  },
);


router.post(
  "/:id/renew/create-order",
  authenticate,
  attachAbility,
  async (req, res) => {
    try {
      const member = await prisma.member.findUnique({
        where: { id: req.params.id },
        include: { tier: true },
      });
      if (!member) return res.status(404).json({ error: "Member not found" });

      if (req.ability.cannot("read", subject("Member", member))) {
        return res.status(403).json({ error: "Access denied." });
      }

      // Renewal is only allowed once the current plan is expiring or has
      // already lapsed — not while it's still comfortably active.
      if (member.status === "ACTIVE") {
        return res.status(400).json({
          error:
            "Your current membership is still active. You can renew once it starts expiring or after it ends.",
        });
      }

      // Let the member optionally switch tiers as part of renewal —
      // defaults to their current tier if not specified.
      const { tierId } = req.body;
      const targetTier = tierId
        ? await prisma.membershipTier.findUnique({ where: { id: tierId } })
        : member.tier;

      if (!targetTier) {
        return res.status(400).json({ error: "Invalid membership tier." });
      }

      const amountInPaise = Math.round(targetTier.price * 100);

      const order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${member.id.slice(0, 8)}_${Date.now()}`,
        notes: { memberId: member.id, tierId: targetTier.id },
      });

      // tierId here is the TARGET tier being paid for — this is what
      // /verify and the webhook read back to know which tier to apply.
      await prisma.payment.create({
        data: {
          memberId: member.id,
          tierId: targetTier.id,
          amount: targetTier.price,
          currency: "INR",
          method: "ONLINE",
          razorpayOrderId: order.id,
          status: "PENDING",
        },
      });

      res.status(200).json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        memberName: `${member.firstName} ${member.lastName}`,
        tierName: targetTier.name,
      });
    } catch (error) {
      console.error("Failed to create Razorpay order:", error);
      res.status(500).json({
        error: "Failed to create payment order",
        details: error.message,
      });
    }
  },
);


router.post(
  "/:id/renew/verify",
  authenticate,
  attachAbility,
  async (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

      const member = await prisma.member.findUnique({
        where: { id: req.params.id },
      });
      if (!member) return res.status(404).json({ error: "Member not found" });

      if (req.ability.cannot("read", subject("Member", member))) {
        return res.status(403).json({ error: "Access denied." });
      }

      const isValid = verifyPaymentSignature({
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        signature: razorpay_signature,
      });

      if (!isValid) {
        return res.status(400).json({ error: "Payment verification failed." });
      }

      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId: razorpay_order_id },
      });
      if (!payment) {
        return res.status(404).json({ error: "Payment record not found." });
      }


      if (payment.status !== "PAID") {
        const paidTier = await prisma.membershipTier.findUnique({
          where: { id: payment.tierId },
        });
        if (!paidTier) {
          return res.status(400).json({ error: "Paid tier no longer exists." });
        }

        const now = new Date();
        const baseDate = member.endDate > now ? member.endDate : now;
        const newEndDate = new Date(baseDate);
        newEndDate.setDate(newEndDate.getDate() + paidTier.durationDays);

        await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: "PAID",
              razorpayPaymentId: razorpay_payment_id,
              periodStart: baseDate, // <-- add
              periodEnd: newEndDate, // <-- add
            },
          }),
          prisma.member.update({
            where: { id: member.id },
            data: {
              endDate: newEndDate,
              status: "ACTIVE",
              tierId: paidTier.id,
            },
          }),
        ]);

        logActivity(
          "MEMBER_RENEWED",
          `${member.firstName} ${member.lastName} renewed their ${paidTier.name} membership`,
        );
      }

      res.status(200).json({ message: "Membership renewed successfully." });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to verify payment", details: error.message });
    }
  },
);

// 15. Join as a New Member — Create Order
// For a logged-in MEMBER-role user (signed up via Google or email OTP)
// who does NOT yet have a Member profile. Lets them pick a plan and pay
// online to become a member immediately — no admin involvement.
router.post("/join/create-order", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "MEMBER") {
      return res.status(403).json({ error: "Access denied." });
    }

    const existing = await prisma.member.findUnique({
      where: { userId: req.user.userId },
    });
    if (existing) {
      return res.status(400).json({ error: "You already have a membership." });
    }

    const { tierId, firstName, lastName } = req.body;
    if (!firstName?.trim() || !lastName?.trim()) {
      return res.status(400).json({ error: "Please enter your name." });
    }

    const tier = await prisma.membershipTier.findUnique({
      where: { id: tierId },
    });
    if (!tier || tier.isActive === false) {
      return res.status(400).json({ error: "Please select a valid plan." });
    }

    const amountInPaise = Math.round(tier.price * 100);

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `join_${req.user.userId.slice(0, 8)}_${Date.now()}`,
      // These notes travel with the order on Razorpay's own servers, so
      // the webhook can independently reconstruct this signup even if
      // the browser never calls /join/verify at all.
      notes: {
        type: "join",
        userId: req.user.userId,
        tierId: tier.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      },
    });

    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      tierName: tier.name,
    });
  } catch (error) {
    console.error("Failed to create join order:", error);
    res
      .status(500)
      .json({ error: "Failed to start payment", details: error.message });
  }
});

// 16. Join as a New Member — Verify Payment
router.post("/join/verify", authenticate, async (req, res) => {
  try {
    if (req.user.role !== "MEMBER") {
      return res.status(403).json({ error: "Access denied." });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      firstName,
      lastName,
    } = req.body;

    const isValid = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!isValid) {
      return res.status(400).json({ error: "Payment verification failed." });
    }

    // Re-fetch the order from Razorpay itself for the tierId — trusted,
    // since it's exactly what /create-order set, not something the
    // client could tamper with on this call.
    const order = await razorpay.orders.fetch(razorpay_order_id);
    if (order.notes?.userId !== req.user.userId) {
      return res
        .status(403)
        .json({ error: "This payment does not belong to your account." });
    }

    const { member, created } = await createMemberFromJoinPayment({
      userId: req.user.userId,
      tierId: order.notes.tierId,
      firstName: firstName || order.notes.firstName,
      lastName: lastName || order.notes.lastName,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    if (created) {
      logActivity(
        "MEMBER_ADDED",
        `${member.firstName} ${member.lastName} joined online (self sign-up)`,
      );
    }

    res.status(201).json({
      message: "Welcome! Your membership is now active.",
      member,
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to complete signup", details: error.message });
  }
});

// 14.5. Admin Direct Renewal (member paid the admin in cash, or a direct
// online transfer outside the website checkout). Skips Razorpay entirely.
// Optionally switches the member to a different tier as part of the
// renewal — this is the ONLY way a member's tier can change post-signup,
// by design, so a tier switch always comes with a matching Payment record
// instead of being a silent, unaudited field edit.
router.put(
  "/:id/renew/direct",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  async (req, res) => {
    try {
      const member = await prisma.member.findUnique({
        where: { id: req.params.id },
        include: { tier: true },
      });
      if (!member) return res.status(404).json({ error: "Member not found" });

      if (member.status === "ACTIVE") {
        return res.status(400).json({
          error:
            "This member's plan is still active. Renewal is only available once it starts expiring or after it ends.",
        });
      }

      const { tierId } = req.body;
      const targetTier = tierId
        ? await prisma.membershipTier.findUnique({ where: { id: tierId } })
        : member.tier;

      if (!targetTier) {
        return res.status(400).json({ error: "Invalid membership tier." });
      }

      // Same "extend, don't waste remaining time" logic as the online
      // renewal paths — if the current membership hasn't lapsed yet, the
      // new period stacks on top of the existing endDate instead of
      // resetting from today.
      const now = new Date();
      const baseDate = member.endDate > now ? member.endDate : now;
      const newEndDate = new Date(baseDate);
      newEndDate.setDate(newEndDate.getDate() + targetTier.durationDays);


      const [updatedMember] = await prisma.$transaction([
        prisma.member.update({
          where: { id: member.id },
          data: {
            endDate: newEndDate,
            status: "ACTIVE",
            ...(tierId && { tierId }),
          },
          include: { tier: true },
        }),
        prisma.payment.create({
          data: {
            memberId: member.id,
            tierId: targetTier.id,
            amount: targetTier.price,
            currency: "INR",
            method: "CASH",
            status: "PAID",
            periodStart: baseDate, // <-- add
            periodEnd: newEndDate, // <-- add
            razorpayOrderId: `cash_${randomUUID()}`,
          },
        }),
      ]);

      res.status(200).json({
        message: "Membership renewed successfully.",
        member: updatedMember,
      });

      logActivity(
        "MEMBER_RENEWED",
        `${updatedMember.firstName} ${updatedMember.lastName} renewed directly (${targetTier.name})`,
      );
    } catch (error) {
      res.status(500).json({
        error: "Failed to renew membership",
        details: error.message,
      });
    }
  },
);

module.exports = router;