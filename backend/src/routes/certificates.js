const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

// Public by design — this is what the QR code on a certificate links to.
// Deliberately returns only enough to confirm authenticity (name, tier,
// issue date) and nothing else about the member (no email, no contact
// info, no internal IDs beyond the certificate's own id).
router.get("/verify/:certificateId", async (req, res) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: req.params.certificateId },
      include: {
        member: {
          include: { tier: true },
        },
      },
    });

    if (!certificate) {
      return res.status(404).json({ valid: false });
    }

    res.status(200).json({
      valid: true,
      certificateId: certificate.id,
      issuedAt: certificate.issuedAt,
      memberName: `${certificate.member.firstName} ${certificate.member.lastName}`,
      tierName: certificate.member.tier.name,
    });
  } catch (error) {
    res.status(500).json({ valid: false, error: "Verification failed." });
  }
});

module.exports = router;
