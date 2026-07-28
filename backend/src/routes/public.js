const express = require("express");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();



// // Public by design — the landing page's pricing AND programs sections need
// // real tier data without requiring login. Deliberately returns only the
// // fields relevant to public display (name, price, duration, description) —
// // nothing else about how tiers are configured internally.
// router.get("/tiers", async (req, res) => {
//   try {
//     const tiers = await prisma.membershipTier.findMany({
//       where: { isActive: true }, // retired plans never show publicly
//       select: {
//         id: true,
//         name: true,
//         price: true,
//         durationDays: true,
//         description: true,
//       },
//       orderBy: { displayOrder: "asc" },
//     });
//     res.status(200).json(tiers);
//   } catch (error) {
//     res.status(500).json({ error: "Failed to fetch tiers" });
//   }
// });




router.get("/tiers", async (req, res) => {
  try {
    const tiers = await prisma.membershipTier.findMany({
      where: { isActive: true }, // retired plans never show publicly
      select: {
        id: true,
        name: true,
        price: true,
        durationDays: true,
        description: true,
        isPopular: true, // <-- add this
      },
      orderBy: { displayOrder: "asc" },
    });
    res.status(200).json(tiers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch tiers" });
  }
});


module.exports = router;