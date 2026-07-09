// const express = require("express");
// const { PrismaClient } = require("@prisma/client");
// const authenticate = require("../middleware/authMiddleware.js");
// const requireAdmin = require("../middleware/requireAdmin.js");
// const upload = require("../middleware/uploadMiddleware.js"); // Import the upload tool

// const router = express.Router();
// const prisma = new PrismaClient();

// // Helper: true if the requester is an admin, or the member record
// // belongs to their own linked account.
// const isSelfOrAdmin = (req, member) =>
//   req.user.role === "ADMIN" ||
//   (member.userId && member.userId === req.user.userId);

// // Helper: fire-and-forget activity log entry, powers the notification bell.
// // Wrapped so it can NEVER throw into the caller — if the ActivityLog table
// // isn't migrated yet, or anything else goes wrong, logging just silently
// // fails instead of breaking the actual feature (e.g. certificate download).
// const logActivity = (type, message) => {
//   try {
//     Promise.resolve(
//       prisma.activityLog.create({ data: { type, message } }),
//     ).catch((err) => console.error("Failed to log activity:", err.message));
//   } catch (err) {
//     console.error(
//       "Failed to log activity (is the ActivityLog table migrated? run `npx prisma db push`):",
//       err.message,
//     );
//   }
// };

// // 1. Get All Members (Admin only — members shouldn't see the whole directory)
// router.get("/", authenticate, requireAdmin, async (req, res) => {
//   try {
//     const members = await prisma.member.findMany({
//       include: { tier: true },
//     });
//     res.status(200).json(members);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Failed to fetch members", details: error.message });
//   }
// });

// // 2. Create a New Member with File Upload (Admin only)
// router.post(
//   "/",
//   authenticate,
//   requireAdmin,
//   upload.single("document"),
//   async (req, res) => {
//     try {
//       const { firstName, lastName, tierId, endDate } = req.body;
//       const email = req.body.email?.trim().toLowerCase();
//       // req.file.path comes from Cloudinary after a successful upload
//       const documentUrl = req.file ? req.file.path : null;

//       const newMember = await prisma.member.create({
//         data: {
//           firstName,
//           lastName,
//           email,
//           tierId,
//           endDate: new Date(endDate),
//           documentUrl, // Make sure this field exists in your schema!
//         },
//       });
//       res
//         .status(201)
//         .json({ message: "Member registered successfully", newMember });

//       logActivity(
//         "MEMBER_ADDED",
//         `New member added: ${newMember.firstName} ${newMember.lastName}`,
//       );
//     } catch (error) {
//       res
//         .status(500)
//         .json({ error: "Failed to create member", details: error.message });
//     }
//   },
// );

// // 3. Create a New Membership Tier (Admin only)
// router.post("/tiers", authenticate, requireAdmin, async (req, res) => {
//   try {
//     const { name } = req.body;
//     const price = parseFloat(req.body.price);
//     const durationDays = parseInt(req.body.durationDays, 10);

//     if (Number.isNaN(price) || Number.isNaN(durationDays)) {
//       return res
//         .status(400)
//         .json({ error: "Price and duration must be valid numbers." });
//     }

//     const tier = await prisma.membershipTier.create({
//       data: { name, price, durationDays },
//     });
//     res.status(201).json({ message: "Tier created successfully", tier });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Failed to create tier", details: error.message });
//   }
// });

// // 4. Get All Tiers (Admin only — only used by admin create/edit forms)
// router.get("/tiers", authenticate, requireAdmin, async (req, res) => {
//   try {
//     const tiers = await prisma.membershipTier.findMany();
//     res.status(200).json(tiers);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Failed to fetch tiers", details: error.message });
//   }
// });

// // 4.5. Update a Tier (Admin only)
// router.put("/tiers/:tierId", authenticate, requireAdmin, async (req, res) => {
//   try {
//     const { name, price, durationDays } = req.body;
//     const tier = await prisma.membershipTier.update({
//       where: { id: req.params.tierId },
//       data: {
//         ...(name !== undefined && { name }),
//         ...(price !== undefined && { price: parseFloat(price) }),
//         ...(durationDays !== undefined && {
//           durationDays: parseInt(durationDays, 10),
//         }),
//       },
//     });
//     res.status(200).json({ message: "Tier updated successfully", tier });
//   } catch (error) {
//     if (error.code === "P2025") {
//       return res.status(404).json({ error: "Tier not found" });
//     }
//     res
//       .status(500)
//       .json({ error: "Failed to update tier", details: error.message });
//   }
// });

// // 4.6. Delete a Tier (Admin only)
// router.delete(
//   "/tiers/:tierId",
//   authenticate,
//   requireAdmin,
//   async (req, res) => {
//     try {
//       await prisma.membershipTier.delete({ where: { id: req.params.tierId } });
//       res.status(200).json({ message: "Tier deleted successfully" });
//     } catch (error) {
//       if (error.code === "P2025") {
//         return res.status(404).json({ error: "Tier not found" });
//       }
//       // Foreign key constraint — members are still assigned to this tier
//       if (error.code === "P2003") {
//         return res.status(400).json({
//           error:
//             "Can't delete this tier while members are still assigned to it. Move those members to a different tier first.",
//         });
//       }
//       res
//         .status(500)
//         .json({ error: "Failed to delete tier", details: error.message });
//     }
//   },
// );

// // 5. Reporting & Analytics Overview (Admin only)
// // IMPORTANT: declared BEFORE "/:id" below, otherwise Express would treat
// // "stats" as an :id value.
// router.get("/stats/overview", authenticate, requireAdmin, async (req, res) => {
//   try {
//     const [members, tiers, certificates] = await Promise.all([
//       prisma.member.findMany({
//         select: {
//           id: true,
//           firstName: true,
//           lastName: true,
//           status: true,
//           tierId: true,
//           endDate: true,
//           createdAt: true,
//         },
//       }),
//       prisma.membershipTier.findMany(),
//       prisma.certificate.findMany({ select: { issuedAt: true } }),
//     ]);

//     // Status breakdown
//     const statusBreakdown = { ACTIVE: 0, EXPIRING: 0, INACTIVE: 0 };
//     members.forEach((m) => {
//       if (statusBreakdown[m.status] !== undefined) statusBreakdown[m.status]++;
//     });

//     // Tier breakdown
//     const tierCounts = {};
//     members.forEach((m) => {
//       tierCounts[m.tierId] = (tierCounts[m.tierId] || 0) + 1;
//     });
//     const tierBreakdown = tiers.map((tier) => ({
//       name: tier.name,
//       count: tierCounts[tier.id] || 0,
//     }));

//     // Helper: group a list of dates into "Jan 2026" style month buckets,
//     // covering the last 6 months (including months with zero entries).
//     const monthKey = (date) =>
//       date.toLocaleString("en-US", { month: "short", year: "numeric" });

//     const last6Months = Array.from({ length: 6 }).map((_, i) => {
//       const d = new Date();
//       d.setDate(1); // avoid month-length rollover issues
//       d.setMonth(d.getMonth() - (5 - i));
//       return monthKey(d);
//     });

//     const bucketize = (dates) => {
//       const counts = Object.fromEntries(last6Months.map((m) => [m, 0]));
//       dates.forEach((date) => {
//         const key = monthKey(new Date(date));
//         if (counts[key] !== undefined) counts[key]++;
//       });
//       return last6Months.map((month) => ({ month, count: counts[month] }));
//     };

//     const signupsByMonth = bucketize(members.map((m) => m.createdAt));
//     const certificatesByMonth = bucketize(certificates.map((c) => c.issuedAt));

//     // Members expiring in the next 30 days (excluding already-inactive ones)
//     const now = new Date();
//     const in30Days = new Date();
//     in30Days.setDate(now.getDate() + 30);

//     const expiringSoon = members
//       .filter(
//         (m) =>
//           m.status !== "INACTIVE" &&
//           new Date(m.endDate) >= now &&
//           new Date(m.endDate) <= in30Days,
//       )
//       .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
//       .map((m) => ({
//         id: m.id,
//         name: `${m.firstName} ${m.lastName}`,
//         endDate: m.endDate,
//       }));

//     res.status(200).json({
//       totalMembers: members.length,
//       totalCertificatesIssued: certificates.length,
//       statusBreakdown,
//       tierBreakdown,
//       signupsByMonth,
//       certificatesByMonth,
//       expiringSoon,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Failed to fetch stats", details: error.message });
//   }
// });

// // 6. Get the logged-in MEMBER's own profile
// // IMPORTANT: declared BEFORE "/:id" below, otherwise Express would treat
// // "me" as an :id value.
// router.get("/me", authenticate, async (req, res) => {
//   try {
//     let member = await prisma.member.findUnique({
//       where: { userId: req.user.userId },
//       include: { tier: true, documents: true },
//     });

//     // Fallback: this account may have registered before the matching
//     // Member record existed, or the emails didn't match exactly at the
//     // time. Retry the link here by matching on the User's current email,
//     // instead of only ever trying once at registration time.
//     if (!member) {
//       const user = await prisma.user.findUnique({
//         where: { id: req.user.userId },
//       });
//       if (user) {
//         const candidate = await prisma.member.findUnique({
//           where: { email: user.email },
//         });
//         if (candidate && !candidate.userId) {
//           member = await prisma.member.update({
//             where: { id: candidate.id },
//             data: { userId: user.id },
//             include: { tier: true, documents: true },
//           });
//         }
//       }
//     }

//     if (!member) {
//       return res
//         .status(404)
//         .json({ error: "No member profile is linked to this account." });
//     }
//     res.status(200).json(member);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Failed to fetch profile", details: error.message });
//   }
// });

// // 7. Get a Single Member by ID (Admin, or the member viewing their own record)
// // IMPORTANT: this must be declared AFTER "/tiers", "/stats", and "/me" above,
// // otherwise Express would treat those words as an :id value.
// router.get("/:id", authenticate, async (req, res) => {
//   try {
//     const member = await prisma.member.findUnique({
//       where: { id: req.params.id },
//       include: { tier: true, documents: true },
//     });
//     if (!member) return res.status(404).json({ error: "Member not found" });

//     if (!isSelfOrAdmin(req, member)) {
//       return res.status(403).json({ error: "Access denied." });
//     }

//     res.status(200).json(member);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Failed to fetch member", details: error.message });
//   }
// });

// // 8. Update a Member (Admin can edit everything; a member can only update
// // their own email address)
// router.put("/:id", authenticate, async (req, res) => {
//   try {
//     const existing = await prisma.member.findUnique({
//       where: { id: req.params.id },
//     });
//     if (!existing) return res.status(404).json({ error: "Member not found" });

//     if (!isSelfOrAdmin(req, existing)) {
//       return res.status(403).json({ error: "Access denied." });
//     }

//     const { firstName, lastName, tierId, endDate, status } = req.body;
//     const email = req.body.email?.trim().toLowerCase();
//     const isAdmin = req.user.role === "ADMIN";

//     // Non-admins may only ever change their own email address — tier,
//     // status, name, and expiry stay admin-controlled.
//     const data = isAdmin
//       ? {
//           ...(firstName !== undefined && { firstName }),
//           ...(lastName !== undefined && { lastName }),
//           ...(email !== undefined && { email }),
//           ...(tierId !== undefined && { tierId }),
//           ...(endDate !== undefined && { endDate: new Date(endDate) }),
//           ...(status !== undefined && { status }),
//         }
//       : { ...(email !== undefined && { email }) };

//     const updatedMember = await prisma.member.update({
//       where: { id: req.params.id },
//       data,
//       include: { tier: true },
//     });

//     // Keep login credentials in sync whenever the email actually changes
//     // for a member who has a linked login — otherwise that account gets
//     // silently locked out of its own login.
//     if (email !== undefined && existing.userId) {
//       await prisma.user.update({
//         where: { id: existing.userId },
//         data: { email },
//       });
//     }

//     res
//       .status(200)
//       .json({ message: "Member updated successfully", updatedMember });
//   } catch (error) {
//     if (error.code === "P2025") {
//       return res.status(404).json({ error: "Member not found" });
//     }
//     res
//       .status(500)
//       .json({ error: "Failed to update member", details: error.message });
//   }
// });

// // 9. Delete a Member (Admin only)
// router.delete("/:id", authenticate, requireAdmin, async (req, res) => {
//   try {
//     const deleted = await prisma.member.delete({
//       where: { id: req.params.id },
//     });
//     res.status(200).json({ message: "Member deleted successfully" });

//     logActivity(
//       "MEMBER_DELETED",
//       `Member removed: ${deleted.firstName} ${deleted.lastName}`,
//     );
//   } catch (error) {
//     if (error.code === "P2025") {
//       return res.status(404).json({ error: "Member not found" });
//     }
//     res
//       .status(500)
//       .json({ error: "Failed to delete member", details: error.message });
//   }
// });

// // 10. Upload a Document for a Member (Admin, or the member uploading their
// // own document — e.g. a signed waiver or registration form)
// router.post(
//   "/:id/documents",
//   authenticate,
//   upload.single("file"),
//   async (req, res) => {
//     try {
//       const member = await prisma.member.findUnique({
//         where: { id: req.params.id },
//       });
//       if (!member) return res.status(404).json({ error: "Member not found" });

//       if (!isSelfOrAdmin(req, member)) {
//         return res.status(403).json({ error: "Access denied." });
//       }

//       if (!req.file) {
//         return res.status(400).json({ error: "No file was uploaded." });
//       }

//       const document = await prisma.document.create({
//         data: {
//           name: req.body.name?.trim() || req.file.originalname,
//           url: req.file.path,
//           memberId: member.id,
//         },
//       });

//       res
//         .status(201)
//         .json({ message: "Document uploaded successfully", document });
//     } catch (error) {
//       res
//         .status(500)
//         .json({ error: "Failed to upload document", details: error.message });
//     }
//   },
// );

// // 11. Delete a Document (Admin only — keeps compliance records like signed
// // waivers protected from members accidentally removing them)
// router.delete(
//   "/:id/documents/:docId",
//   authenticate,
//   requireAdmin,
//   async (req, res) => {
//     try {
//       const document = await prisma.document.findUnique({
//         where: { id: req.params.docId },
//       });
//       if (!document || document.memberId !== req.params.id) {
//         return res.status(404).json({ error: "Document not found" });
//       }

//       await prisma.document.delete({ where: { id: req.params.docId } });
//       res.status(200).json({ message: "Document deleted successfully" });
//     } catch (error) {
//       res
//         .status(500)
//         .json({ error: "Failed to delete document", details: error.message });
//     }
//   },
// );

// const PDFDocument = require("pdfkit");

// // Template presets: accent color + border style per style key
// const CERTIFICATE_TEMPLATES = {
//   classic: { accent: "#2563eb", borderColor: "#2563eb" },
//   elegant: { accent: "#b45309", borderColor: "#b45309" },
//   modern: { accent: "#111827", borderColor: "#111827" },
// };

// // 10. Generate and Download Certificate (Admin, or the member downloading
// // their own certificate)
// // Optional query params let the caller customize the certificate:
// //   message         - achievement text, e.g. "is an official Gold Member"
// //   signatoryName   - name printed under the signature line
// //   signatoryTitle  - title printed under the signatory name
// //   template        - one of "classic" | "elegant" | "modern"
// router.get("/:id/certificate", authenticate, async (req, res) => {
//   try {
//     const member = await prisma.member.findUnique({
//       where: { id: req.params.id },
//       include: { tier: true },
//     });

//     if (!member) return res.status(404).json({ error: "Member not found" });

//     if (!isSelfOrAdmin(req, member)) {
//       return res.status(403).json({ error: "Access denied." });
//     }

//     const {
//       message,
//       signatoryName,
//       signatoryTitle,
//       template: templateKey,
//     } = req.query;

//     const template =
//       CERTIFICATE_TEMPLATES[templateKey] || CERTIFICATE_TEMPLATES.classic;
//     const achievementText =
//       message?.trim() || `is an official ${member.tier.name} Member`;

//     // Set headers so the browser knows it's downloading a PDF
//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader(
//       "Content-Disposition",
//       `attachment; filename=${member.firstName}-Certificate.pdf`,
//     );

//     // Create the PDF Document
//     const doc = new PDFDocument({ size: "A4", layout: "landscape" });

//     // Log this issuance for reporting purposes. Fire-and-forget so a slow
//     // or failed DB write never blocks the actual PDF download.
//     prisma.certificate
//       .create({
//         data: {
//           memberId: member.id,
//           url: `/api/members/${member.id}/certificate`,
//         },
//       })
//       .catch((err) =>
//         console.error("Failed to log certificate issuance:", err.message),
//       );

//     logActivity(
//       "CERTIFICATE_ISSUED",
//       `Certificate issued for ${member.firstName} ${member.lastName}`,
//     );

//     // Pipe the PDF directly to the Express response object
//     doc.pipe(res);

//     // Design the Certificate
//     doc
//       .lineWidth(2)
//       .strokeColor(template.borderColor)
//       .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
//       .stroke();
//     doc.strokeColor("black").lineWidth(1); // reset for later strokes

//     doc
//       .fontSize(40)
//       .fillColor("black")
//       .text("Certificate of Membership", { align: "center", margin: 50 });
//     doc.moveDown();

//     doc.fontSize(20).text("This is to certify that", { align: "center" });
//     doc.moveDown();

//     doc
//       .fontSize(35)
//       .fillColor(template.accent)
//       .text(`${member.firstName} ${member.lastName}`, { align: "center" });
//     doc.moveDown();
//     doc.fillColor("black"); // Reset color

//     doc.fontSize(20).text(achievementText, { align: "center" });
//     doc.moveDown();
//     doc.text(`Valid until: ${new Date(member.endDate).toLocaleDateString()}`, {
//       align: "center",
//     });

//     // Signature block (only if a signatory name was provided)
//     if (signatoryName?.trim()) {
//       const lineY = doc.page.height - 110;
//       const lineX1 = doc.page.width / 2 - 100;
//       const lineX2 = doc.page.width / 2 + 100;

//       doc
//         .moveTo(lineX1, lineY)
//         .lineTo(lineX2, lineY)
//         .strokeColor(template.borderColor)
//         .stroke();

//       doc
//         .fontSize(14)
//         .fillColor("black")
//         .text(signatoryName.trim(), 0, lineY + 8, {
//           align: "center",
//         });
//       if (signatoryTitle?.trim()) {
//         doc
//           .fontSize(11)
//           .fillColor("#6b7280")
//           .text(signatoryTitle.trim(), { align: "center" });
//       }
//     }

//     // Finalize the PDF and end the stream
//     doc.end();
//   } catch (error) {
//     res.status(500).json({
//       error: "Failed to generate certificate",
//       details: error.message,
//     });
//   }
// });

// // 12. Recent Activity Log (Admin only) — powers the notification bell
// router.get("/activity/recent", authenticate, requireAdmin, async (req, res) => {
//   try {
//     const activity = await prisma.activityLog.findMany({
//       orderBy: { createdAt: "desc" },
//       take: 20,
//     });
//     res.status(200).json(activity);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Failed to fetch activity", details: error.message });
//   }
// });

// module.exports = router;

// const express = require("express");
// const { PrismaClient } = require("@prisma/client");
// const { subject } = require("@casl/ability");
// const authenticate = require("../middleware/authMiddleware.js");
// const attachAbility = require("../middleware/attachAbility.js");
// const requireAbility = require("../middleware/requireAbility.js");
// const upload = require("../middleware/uploadMiddleware.js"); // Import the upload tool

// const router = express.Router();
// const prisma = new PrismaClient();

// // Helper: fire-and-forget activity log entry, powers the notification bell.
// // Wrapped so it can NEVER throw into the caller — if the ActivityLog table
// // isn't migrated yet, or anything else goes wrong, logging just silently
// // fails instead of breaking the actual feature (e.g. certificate download).
// const logActivity = (type, message) => {
//   try {
//     Promise.resolve(
//       prisma.activityLog.create({ data: { type, message } }),
//     ).catch((err) => console.error("Failed to log activity:", err.message));
//   } catch (err) {
//     console.error(
//       "Failed to log activity (is the ActivityLog table migrated? run `npx prisma db push`):",
//       err.message,
//     );
//   }
// };

// // 1. Get All Members (Admin only — members shouldn't see the whole directory)
// router.get(
//   "/",
//   authenticate,
//   attachAbility,
//   requireAbility("manage", "all"),
//   async (req, res) => {
//     try {
//       const members = await prisma.member.findMany({
//         include: { tier: true },
//       });
//       res.status(200).json(members);
//     } catch (error) {
//       res
//         .status(500)
//         .json({ error: "Failed to fetch members", details: error.message });
//     }
//   },
// );

// // 2. Create a New Member with File Upload (Admin only)
// router.post(
//   "/",
//   authenticate,
//   attachAbility,
//   requireAbility("manage", "all"),
//   upload.single("document"),
//   async (req, res) => {
//     try {
//       const { firstName, lastName, tierId, endDate } = req.body;
//       const email = req.body.email?.trim().toLowerCase();
//       // req.file.path comes from Cloudinary after a successful upload
//       const documentUrl = req.file ? req.file.path : null;

//       const newMember = await prisma.member.create({
//         data: {
//           firstName,
//           lastName,
//           email,
//           tierId,
//           endDate: new Date(endDate),
//           documentUrl, // Make sure this field exists in your schema!
//         },
//       });
//       res
//         .status(201)
//         .json({ message: "Member registered successfully", newMember });

//       logActivity(
//         "MEMBER_ADDED",
//         `New member added: ${newMember.firstName} ${newMember.lastName}`,
//       );
//     } catch (error) {
//       res
//         .status(500)
//         .json({ error: "Failed to create member", details: error.message });
//     }
//   },
// );

// // 3. Create a New Membership Tier (Admin only)
// router.post(
//   "/tiers",
//   authenticate,
//   attachAbility,
//   requireAbility("manage", "all"),
//   async (req, res) => {
//     try {
//       const { name } = req.body;
//       const price = parseFloat(req.body.price);
//       const durationDays = parseInt(req.body.durationDays, 10);

//       if (Number.isNaN(price) || Number.isNaN(durationDays)) {
//         return res
//           .status(400)
//           .json({ error: "Price and duration must be valid numbers." });
//       }

//       const tier = await prisma.membershipTier.create({
//         data: { name, price, durationDays },
//       });
//       res.status(201).json({ message: "Tier created successfully", tier });
//     } catch (error) {
//       res
//         .status(500)
//         .json({ error: "Failed to create tier", details: error.message });
//     }
//   },
// );

// // 4. Get All Tiers (Admin only — only used by admin create/edit forms)
// router.get(
//   "/tiers",
//   authenticate,
//   attachAbility,
//   requireAbility("manage", "all"),
//   async (req, res) => {
//     try {
//       const tiers = await prisma.membershipTier.findMany();
//       res.status(200).json(tiers);
//     } catch (error) {
//       res
//         .status(500)
//         .json({ error: "Failed to fetch tiers", details: error.message });
//     }
//   },
// );

// // 4.5. Update a Tier (Admin only)
// router.put(
//   "/tiers/:tierId",
//   authenticate,
//   attachAbility,
//   requireAbility("manage", "all"),
//   async (req, res) => {
//     try {
//       const { name, price, durationDays } = req.body;
//       const tier = await prisma.membershipTier.update({
//         where: { id: req.params.tierId },
//         data: {
//           ...(name !== undefined && { name }),
//           ...(price !== undefined && { price: parseFloat(price) }),
//           ...(durationDays !== undefined && {
//             durationDays: parseInt(durationDays, 10),
//           }),
//         },
//       });
//       res.status(200).json({ message: "Tier updated successfully", tier });
//     } catch (error) {
//       if (error.code === "P2025") {
//         return res.status(404).json({ error: "Tier not found" });
//       }
//       res
//         .status(500)
//         .json({ error: "Failed to update tier", details: error.message });
//     }
//   },
// );

// // 4.6. Delete a Tier (Admin only)
// router.delete(
//   "/tiers/:tierId",
//   authenticate,
//   attachAbility,
//   requireAbility("manage", "all"),
//   async (req, res) => {
//     try {
//       await prisma.membershipTier.delete({ where: { id: req.params.tierId } });
//       res.status(200).json({ message: "Tier deleted successfully" });
//     } catch (error) {
//       if (error.code === "P2025") {
//         return res.status(404).json({ error: "Tier not found" });
//       }
//       // Foreign key constraint — members are still assigned to this tier
//       if (error.code === "P2003") {
//         return res.status(400).json({
//           error:
//             "Can't delete this tier while members are still assigned to it. Move those members to a different tier first.",
//         });
//       }
//       res
//         .status(500)
//         .json({ error: "Failed to delete tier", details: error.message });
//     }
//   },
// );

// // 5. Reporting & Analytics Overview (Admin only)
// // IMPORTANT: declared BEFORE "/:id" below, otherwise Express would treat
// // "stats" as an :id value.
// router.get(
//   "/stats/overview",
//   authenticate,
//   attachAbility,
//   requireAbility("manage", "all"),
//   async (req, res) => {
//     try {
//       const [members, tiers, certificates] = await Promise.all([
//         prisma.member.findMany({
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//             status: true,
//             tierId: true,
//             endDate: true,
//             createdAt: true,
//           },
//         }),
//         prisma.membershipTier.findMany(),
//         prisma.certificate.findMany({ select: { issuedAt: true } }),
//       ]);

//       // Status breakdown
//       const statusBreakdown = { ACTIVE: 0, EXPIRING: 0, INACTIVE: 0 };
//       members.forEach((m) => {
//         if (statusBreakdown[m.status] !== undefined)
//           statusBreakdown[m.status]++;
//       });

//       // Tier breakdown
//       const tierCounts = {};
//       members.forEach((m) => {
//         tierCounts[m.tierId] = (tierCounts[m.tierId] || 0) + 1;
//       });
//       const tierBreakdown = tiers.map((tier) => ({
//         name: tier.name,
//         count: tierCounts[tier.id] || 0,
//       }));

//       // Helper: group a list of dates into "Jan 2026" style month buckets,
//       // covering the last 6 months (including months with zero entries).
//       const monthKey = (date) =>
//         date.toLocaleString("en-US", { month: "short", year: "numeric" });

//       const last6Months = Array.from({ length: 6 }).map((_, i) => {
//         const d = new Date();
//         d.setDate(1); // avoid month-length rollover issues
//         d.setMonth(d.getMonth() - (5 - i));
//         return monthKey(d);
//       });

//       const bucketize = (dates) => {
//         const counts = Object.fromEntries(last6Months.map((m) => [m, 0]));
//         dates.forEach((date) => {
//           const key = monthKey(new Date(date));
//           if (counts[key] !== undefined) counts[key]++;
//         });
//         return last6Months.map((month) => ({ month, count: counts[month] }));
//       };

//       const signupsByMonth = bucketize(members.map((m) => m.createdAt));
//       const certificatesByMonth = bucketize(
//         certificates.map((c) => c.issuedAt),
//       );

//       // Members expiring in the next 30 days (excluding already-inactive ones)
//       const now = new Date();
//       const in30Days = new Date();
//       in30Days.setDate(now.getDate() + 30);

//       const expiringSoon = members
//         .filter(
//           (m) =>
//             m.status !== "INACTIVE" &&
//             new Date(m.endDate) >= now &&
//             new Date(m.endDate) <= in30Days,
//         )
//         .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
//         .map((m) => ({
//           id: m.id,
//           name: `${m.firstName} ${m.lastName}`,
//           endDate: m.endDate,
//         }));

//       res.status(200).json({
//         totalMembers: members.length,
//         totalCertificatesIssued: certificates.length,
//         statusBreakdown,
//         tierBreakdown,
//         signupsByMonth,
//         certificatesByMonth,
//         expiringSoon,
//       });
//     } catch (error) {
//       res
//         .status(500)
//         .json({ error: "Failed to fetch stats", details: error.message });
//     }
//   },
// );

// // 6. Get the logged-in MEMBER's own profile
// // IMPORTANT: declared BEFORE "/:id" below, otherwise Express would treat
// // "me" as an :id value.
// router.get("/me", authenticate, async (req, res) => {
//   try {
//     let member = await prisma.member.findUnique({
//       where: { userId: req.user.userId },
//       include: { tier: true, documents: true },
//     });

//     // Fallback: this account may have registered before the matching
//     // Member record existed, or the emails didn't match exactly at the
//     // time. Retry the link here by matching on the User's current email,
//     // instead of only ever trying once at registration time.
//     if (!member) {
//       const user = await prisma.user.findUnique({
//         where: { id: req.user.userId },
//       });
//       if (user) {
//         const candidate = await prisma.member.findUnique({
//           where: { email: user.email },
//         });
//         if (candidate && !candidate.userId) {
//           member = await prisma.member.update({
//             where: { id: candidate.id },
//             data: { userId: user.id },
//             include: { tier: true, documents: true },
//           });
//         }
//       }
//     }

//     if (!member) {
//       return res
//         .status(404)
//         .json({ error: "No member profile is linked to this account." });
//     }
//     res.status(200).json(member);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Failed to fetch profile", details: error.message });
//   }
// });

// // 7. Get a Single Member by ID (Admin, or the member viewing their own record)
// // IMPORTANT: this must be declared AFTER "/tiers", "/stats", and "/me" above,
// // otherwise Express would treat those words as an :id value.
// router.get("/:id", authenticate, attachAbility, async (req, res) => {
//   try {
//     const member = await prisma.member.findUnique({
//       where: { id: req.params.id },
//       include: { tier: true, documents: true },
//     });
//     if (!member) return res.status(404).json({ error: "Member not found" });

//     if (req.ability.cannot("read", subject("Member", member))) {
//       return res.status(403).json({ error: "Access denied." });
//     }

//     res.status(200).json(member);
//   } catch (error) {
//     res
//       .status(500)
//       .json({ error: "Failed to fetch member", details: error.message });
//   }
// });

// // 8. Update a Member (Admin can edit everything; a member can only update
// // their own email address)
// router.put("/:id", authenticate, attachAbility, async (req, res) => {
//   try {
//     const existing = await prisma.member.findUnique({
//       where: { id: req.params.id },
//     });
//     if (!existing) return res.status(404).json({ error: "Member not found" });

//     const isAdmin = req.ability.can("manage", "all");
//     const canUpdateOwnEmail = req.ability.can(
//       "update",
//       subject("Member", existing),
//       "email",
//     );

//     if (!isAdmin && !canUpdateOwnEmail) {
//       return res.status(403).json({ error: "Access denied." });
//     }

//     const { firstName, lastName, tierId, endDate, status } = req.body;
//     const email = req.body.email?.trim().toLowerCase();

//     // Non-admins may only ever change their own email address — tier,
//     // status, name, and expiry stay admin-controlled.
//     const data = isAdmin
//       ? {
//           ...(firstName !== undefined && { firstName }),
//           ...(lastName !== undefined && { lastName }),
//           ...(email !== undefined && { email }),
//           ...(tierId !== undefined && { tierId }),
//           ...(endDate !== undefined && { endDate: new Date(endDate) }),
//           ...(status !== undefined && { status }),
//         }
//       : { ...(email !== undefined && { email }) };

//     const updatedMember = await prisma.member.update({
//       where: { id: req.params.id },
//       data,
//       include: { tier: true },
//     });

//     // Keep login credentials in sync whenever the email actually changes
//     // for a member who has a linked login — otherwise that account gets
//     // silently locked out of its own login.
//     if (email !== undefined && existing.userId) {
//       await prisma.user.update({
//         where: { id: existing.userId },
//         data: { email },
//       });
//     }

//     res
//       .status(200)
//       .json({ message: "Member updated successfully", updatedMember });
//   } catch (error) {
//     if (error.code === "P2025") {
//       return res.status(404).json({ error: "Member not found" });
//     }
//     res
//       .status(500)
//       .json({ error: "Failed to update member", details: error.message });
//   }
// });

// // 9. Delete a Member (Admin only)
// router.delete(
//   "/:id",
//   authenticate,
//   attachAbility,
//   requireAbility("manage", "all"),
//   async (req, res) => {
//     try {
//       const deleted = await prisma.member.delete({
//         where: { id: req.params.id },
//       });
//       res.status(200).json({ message: "Member deleted successfully" });

//       logActivity(
//         "MEMBER_DELETED",
//         `Member removed: ${deleted.firstName} ${deleted.lastName}`,
//       );
//     } catch (error) {
//       if (error.code === "P2025") {
//         return res.status(404).json({ error: "Member not found" });
//       }
//       res
//         .status(500)
//         .json({ error: "Failed to delete member", details: error.message });
//     }
//   },
// );

// // 10. Upload a Document for a Member (Admin, or the member uploading their
// // own document — e.g. a signed waiver or registration form)
// router.post(
//   "/:id/documents",
//   authenticate,
//   attachAbility,
//   upload.single("file"),
//   async (req, res) => {
//     try {
//       const member = await prisma.member.findUnique({
//         where: { id: req.params.id },
//       });
//       if (!member) return res.status(404).json({ error: "Member not found" });

//       if (req.ability.cannot("read", subject("Member", member))) {
//         return res.status(403).json({ error: "Access denied." });
//       }

//       if (!req.file) {
//         return res.status(400).json({ error: "No file was uploaded." });
//       }

//       const document = await prisma.document.create({
//         data: {
//           name: req.body.name?.trim() || req.file.originalname,
//           url: req.file.path,
//           memberId: member.id,
//         },
//       });

//       res
//         .status(201)
//         .json({ message: "Document uploaded successfully", document });
//     } catch (error) {
//       res
//         .status(500)
//         .json({ error: "Failed to upload document", details: error.message });
//     }
//   },
// );

// // 11. Delete a Document (Admin only — keeps compliance records like signed
// // waivers protected from members accidentally removing them)
// router.delete(
//   "/:id/documents/:docId",
//   authenticate,
//   attachAbility,
//   requireAbility("manage", "all"),
//   async (req, res) => {
//     try {
//       const document = await prisma.document.findUnique({
//         where: { id: req.params.docId },
//       });
//       if (!document || document.memberId !== req.params.id) {
//         return res.status(404).json({ error: "Document not found" });
//       }

//       await prisma.document.delete({ where: { id: req.params.docId } });
//       res.status(200).json({ message: "Document deleted successfully" });
//     } catch (error) {
//       res
//         .status(500)
//         .json({ error: "Failed to delete document", details: error.message });
//     }
//   },
// );

// const PDFDocument = require("pdfkit");

// // Template presets: accent color + border style per style key
// const CERTIFICATE_TEMPLATES = {
//   classic: { accent: "#2563eb", borderColor: "#2563eb" },
//   elegant: { accent: "#b45309", borderColor: "#b45309" },
//   modern: { accent: "#111827", borderColor: "#111827" },
// };

// // 10. Generate and Download Certificate (Admin, or the member downloading
// // their own certificate)
// // Optional query params let the caller customize the certificate:
// //   message         - achievement text, e.g. "is an official Gold Member"
// //   signatoryName   - name printed under the signature line
// //   signatoryTitle  - title printed under the signatory name
// //   template        - one of "classic" | "elegant" | "modern"
// router.get(
//   "/:id/certificate",
//   authenticate,
//   attachAbility,
//   async (req, res) => {
//     try {
//       const member = await prisma.member.findUnique({
//         where: { id: req.params.id },
//         include: { tier: true },
//       });

//       if (!member) return res.status(404).json({ error: "Member not found" });

//       if (req.ability.cannot("read", subject("Member", member))) {
//         return res.status(403).json({ error: "Access denied." });
//       }

//       const {
//         message,
//         signatoryName,
//         signatoryTitle,
//         template: templateKey,
//       } = req.query;

//       const template =
//         CERTIFICATE_TEMPLATES[templateKey] || CERTIFICATE_TEMPLATES.classic;
//       const achievementText =
//         message?.trim() || `is an official ${member.tier.name} Member`;

//       // Set headers so the browser knows it's downloading a PDF
//       res.setHeader("Content-Type", "application/pdf");
//       res.setHeader(
//         "Content-Disposition",
//         `attachment; filename=${member.firstName}-Certificate.pdf`,
//       );

//       // Create the PDF Document
//       const doc = new PDFDocument({ size: "A4", layout: "landscape" });

//       // Log this issuance for reporting purposes. Fire-and-forget so a slow
//       // or failed DB write never blocks the actual PDF download.
//       prisma.certificate
//         .create({
//           data: {
//             memberId: member.id,
//             url: `/api/members/${member.id}/certificate`,
//           },
//         })
//         .catch((err) =>
//           console.error("Failed to log certificate issuance:", err.message),
//         );

//       logActivity(
//         "CERTIFICATE_ISSUED",
//         `Certificate issued for ${member.firstName} ${member.lastName}`,
//       );

//       // Pipe the PDF directly to the Express response object
//       doc.pipe(res);

//       // Design the Certificate
//       doc
//         .lineWidth(2)
//         .strokeColor(template.borderColor)
//         .rect(20, 20, doc.page.width - 40, doc.page.height - 40)
//         .stroke();
//       doc.strokeColor("black").lineWidth(1); // reset for later strokes

//       doc
//         .fontSize(40)
//         .fillColor("black")
//         .text("Certificate of Membership", { align: "center", margin: 50 });
//       doc.moveDown();

//       doc.fontSize(20).text("This is to certify that", { align: "center" });
//       doc.moveDown();

//       doc
//         .fontSize(35)
//         .fillColor(template.accent)
//         .text(`${member.firstName} ${member.lastName}`, { align: "center" });
//       doc.moveDown();
//       doc.fillColor("black"); // Reset color

//       doc.fontSize(20).text(achievementText, { align: "center" });
//       doc.moveDown();
//       doc.text(
//         `Valid until: ${new Date(member.endDate).toLocaleDateString()}`,
//         {
//           align: "center",
//         },
//       );

//       // Signature block (only if a signatory name was provided)
//       if (signatoryName?.trim()) {
//         const lineY = doc.page.height - 110;
//         const lineX1 = doc.page.width / 2 - 100;
//         const lineX2 = doc.page.width / 2 + 100;

//         doc
//           .moveTo(lineX1, lineY)
//           .lineTo(lineX2, lineY)
//           .strokeColor(template.borderColor)
//           .stroke();

//         doc
//           .fontSize(14)
//           .fillColor("black")
//           .text(signatoryName.trim(), 0, lineY + 8, {
//             align: "center",
//           });
//         if (signatoryTitle?.trim()) {
//           doc
//             .fontSize(11)
//             .fillColor("#6b7280")
//             .text(signatoryTitle.trim(), { align: "center" });
//         }
//       }

//       // Finalize the PDF and end the stream
//       doc.end();
//     } catch (error) {
//       res.status(500).json({
//         error: "Failed to generate certificate",
//         details: error.message,
//       });
//     }
//   },
// );

// // 12. Recent Activity Log (Admin only) — powers the notification bell
// router.get(
//   "/activity/recent",
//   authenticate,
//   attachAbility,
//   requireAbility("manage", "all"),
//   async (req, res) => {
//     try {
//       const activity = await prisma.activityLog.findMany({
//         orderBy: { createdAt: "desc" },
//         take: 20,
//       });
//       res.status(200).json(activity);
//     } catch (error) {
//       res
//         .status(500)
//         .json({ error: "Failed to fetch activity", details: error.message });
//     }
//   },
// );

// module.exports = router;
















const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { subject } = require("@casl/ability");
const authenticate = require("../middleware/authMiddleware.js");
const attachAbility = require("../middleware/attachAbility.js");
const requireAbility = require("../middleware/requireAbility.js");
const upload = require("../middleware/uploadMiddleware.js"); // Import the upload tool

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

// 1. Get All Members (Admin only — members shouldn't see the whole directory)
router.get(
  "/",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  async (req, res) => {
    try {
      const members = await prisma.member.findMany({
        include: { tier: true },
      });
      res.status(200).json(members);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch members", details: error.message });
    }
  },
);

// 2. Create a New Member with File Upload (Admin only)
router.post(
  "/",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  upload.single("document"),
  async (req, res) => {
    try {
      const { firstName, lastName, tierId, endDate } = req.body;
      const email = req.body.email?.trim().toLowerCase();
      // req.file.path comes from Cloudinary after a successful upload
      const documentUrl = req.file ? req.file.path : null;

      const newMember = await prisma.member.create({
        data: {
          firstName,
          lastName,
          email,
          tierId,
          endDate: new Date(endDate),
          documentUrl, // Make sure this field exists in your schema!
        },
      });
      res
        .status(201)
        .json({ message: "Member registered successfully", newMember });

      logActivity(
        "MEMBER_ADDED",
        `New member added: ${newMember.firstName} ${newMember.lastName}`,
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
      const { name } = req.body;
      const price = parseFloat(req.body.price);
      const durationDays = parseInt(req.body.durationDays, 10);

      if (Number.isNaN(price) || Number.isNaN(durationDays)) {
        return res
          .status(400)
          .json({ error: "Price and duration must be valid numbers." });
      }

      const tier = await prisma.membershipTier.create({
        data: { name, price, durationDays },
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
      const tiers = await prisma.membershipTier.findMany();
      res.status(200).json(tiers);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Failed to fetch tiers", details: error.message });
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
      const { name, price, durationDays } = req.body;
      const tier = await prisma.membershipTier.update({
        where: { id: req.params.tierId },
        data: {
          ...(name !== undefined && { name }),
          ...(price !== undefined && { price: parseFloat(price) }),
          ...(durationDays !== undefined && {
            durationDays: parseInt(durationDays, 10),
          }),
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

// 6. Get the logged-in MEMBER's own profile
// IMPORTANT: declared BEFORE "/:id" below, otherwise Express would treat
// "me" as an :id value.
router.get("/me", authenticate, async (req, res) => {
  try {
    let member = await prisma.member.findUnique({
      where: { userId: req.user.userId },
      include: { tier: true, documents: true },
    });

    // Fallback: this account may have registered before the matching
    // Member record existed, or the emails didn't match exactly at the
    // time. Retry the link here by matching on the User's current email,
    // instead of only ever trying once at registration time.
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
            include: { tier: true, documents: true },
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

// 8. Update a Member (Admin can edit everything; a member can only update
// their own email address)
router.put("/:id", authenticate, attachAbility, async (req, res) => {
  try {
    const existing = await prisma.member.findUnique({
      where: { id: req.params.id },
    });
    if (!existing) return res.status(404).json({ error: "Member not found" });

    const isAdmin = req.ability.can("manage", "all");
    const canUpdateOwnEmail = req.ability.can(
      "update",
      subject("Member", existing),
      "email",
    );

    if (!isAdmin && !canUpdateOwnEmail) {
      return res.status(403).json({ error: "Access denied." });
    }

    const { firstName, lastName, tierId, endDate, status } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    // Non-admins may only ever change their own email address — tier,
    // status, name, and expiry stay admin-controlled.
    const data = isAdmin
      ? {
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(email !== undefined && { email }),
          ...(tierId !== undefined && { tierId }),
          ...(endDate !== undefined && { endDate: new Date(endDate) }),
          ...(status !== undefined && { status }),
        }
      : { ...(email !== undefined && { email }) };

    const updatedMember = await prisma.member.update({
      where: { id: req.params.id },
      data,
      include: { tier: true },
    });

    // Keep login credentials in sync whenever the email actually changes
    // for a member who has a linked login — otherwise that account gets
    // silently locked out of its own login.
    if (email !== undefined && existing.userId) {
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

// 9. Delete a Member (Admin only)
router.delete(
  "/:id",
  authenticate,
  attachAbility,
  requireAbility("manage", "all"),
  async (req, res) => {
    try {
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

      // Log this issuance for reporting purposes. Fire-and-forget so a slow
      // or failed DB write never blocks the actual PDF download.
      prisma.certificate
        .create({
          data: {
            memberId: member.id,
            url: `/api/members/${member.id}/certificate`,
          },
        })
        .catch((err) =>
          console.error("Failed to log certificate issuance:", err.message),
        );

      logActivity(
        "CERTIFICATE_ISSUED",
        `Certificate issued for ${member.firstName} ${member.lastName}`,
      );

      const html = renderCertificateHTML({
        firstName: member.firstName,
        lastName: member.lastName,
        achievementText,
        validUntil: new Date(member.endDate).toLocaleDateString(),
        signatoryName: signatoryName?.trim(),
        signatoryTitle: signatoryTitle?.trim(),
        templateKey,
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

module.exports = router;