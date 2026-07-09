// const cron = require("node-cron");
// const { PrismaClient } = require("@prisma/client");
// const { sendRenewalReminder } = require("../utils/emailService.js");

// const prisma = new PrismaClient();

// // We will set this to run every minute for testing.
// // In production, switch this to '0 0 * * *' to run once daily at midnight.
// const startCronJob = () => {
//   cron.schedule("* * * * *", async () => {
//     console.log("⏰ Cron Job Triggered: Scanning memberships...");

//     try {
//       const now = new Date();
//       const in7Days = new Date();
//       in7Days.setDate(now.getDate() + 7);

//       // --- 1. Find ACTIVE members expiring within the next 7 days ---
//       // Bounded on BOTH sides: endDate must be between now and +7 days,
//       // otherwise already-lapsed members would incorrectly match too.
//       const expiringMembers = await prisma.member.findMany({
//         where: {
//           endDate: { gte: now, lte: in7Days },
//           status: "ACTIVE",
//         },
//       });

//       if (expiringMembers.length === 0) {
//         const [activeCount, expiringCount, inactiveCount] = await Promise.all([
//           prisma.member.count({ where: { status: "ACTIVE" } }),
//           prisma.member.count({ where: { status: "EXPIRING" } }),
//           prisma.member.count({ where: { status: "INACTIVE" } }),
//         ]);
//         console.log(
//           `✅ No ACTIVE memberships expiring in the next 7 days. ` +
//             `(Current counts — Active: ${activeCount}, Expiring: ${expiringCount}, Inactive: ${inactiveCount})`,
//         );
//       }

//       for (const member of expiringMembers) {
//         console.log(`📧 Sending renewal reminder to ${member.email}...`);

//         await sendRenewalReminder(
//           member.email,
//           member.firstName,
//           member.endDate,
//         );

//         // Update their status to EXPIRING so we don't spam them every day
//         await prisma.member.update({
//           where: { id: member.id },
//           data: { status: "EXPIRING" },
//         });
//       }

//       // --- 2. Find members whose endDate has already passed and mark them INACTIVE ---
//       // Without this, members stay stuck at EXPIRING forever, even years
//       // after their membership actually lapsed.
//       const lapsedMembers = await prisma.member.updateMany({
//         where: {
//           endDate: { lt: now },
//           status: { not: "INACTIVE" },
//         },
//         data: { status: "INACTIVE" },
//       });

//       if (lapsedMembers.count > 0) {
//         console.log(
//           `📉 Marked ${lapsedMembers.count} lapsed membership(s) as INACTIVE.`,
//         );
//       }
//     } catch (error) {
//       console.error("❌ Error running cron job:", error);
//     }
//   });
// };

// module.exports = { startCronJob };












const cron = require("node-cron");
const { PrismaClient } = require("@prisma/client");
const { emailQueue } = require("../queues/emailQueue.js");
const { startEmailWorker } = require("../queues/emailWorker.js");

const prisma = new PrismaClient();

// We will set this to run every minute for testing.
// In production, switch this to '0 0 * * *' to run once daily at midnight.
const startCronJob = () => {
  // Start the worker that actually processes queued reminder emails.
  startEmailWorker();

  cron.schedule("* * * * *", async () => {
    console.log("⏰ Cron Job Triggered: Scanning memberships...");

    try {
      const now = new Date();
      const in7Days = new Date();
      in7Days.setDate(now.getDate() + 7);

      // --- 1. Find ACTIVE members expiring within the next 7 days ---
      // Bounded on BOTH sides: endDate must be between now and +7 days,
      // otherwise already-lapsed members would incorrectly match too.
      const expiringMembers = await prisma.member.findMany({
        where: {
          endDate: { gte: now, lte: in7Days },
          status: "ACTIVE",
        },
      });

      if (expiringMembers.length === 0) {
        const [activeCount, expiringCount, inactiveCount] = await Promise.all([
          prisma.member.count({ where: { status: "ACTIVE" } }),
          prisma.member.count({ where: { status: "EXPIRING" } }),
          prisma.member.count({ where: { status: "INACTIVE" } }),
        ]);
        console.log(
          `✅ No ACTIVE memberships expiring in the next 7 days. ` +
            `(Current counts — Active: ${activeCount}, Expiring: ${expiringCount}, Inactive: ${inactiveCount})`,
        );
      }

      for (const member of expiringMembers) {
        console.log(`📬 Queuing renewal reminder for ${member.email}...`);

        // Adds the job to Redis and returns immediately — the actual
        // sending happens in emailWorker.js, decoupled from this loop.
        // A slow or temporarily-down email provider can no longer stall
        // the cron job itself.
        await emailQueue.add(
          "renewal-reminder",
          {
            email: member.email,
            firstName: member.firstName,
            endDate: member.endDate,
          },
          {
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
          },
        );

        // Update their status to EXPIRING so we don't spam them every day
        await prisma.member.update({
          where: { id: member.id },
          data: { status: "EXPIRING" },
        });
      }

      // --- 2. Find members whose endDate has already passed and mark them INACTIVE ---
      // Without this, members stay stuck at EXPIRING forever, even years
      // after their membership actually lapsed.
      const lapsedMembers = await prisma.member.updateMany({
        where: {
          endDate: { lt: now },
          status: { not: "INACTIVE" },
        },
        data: { status: "INACTIVE" },
      });

      if (lapsedMembers.count > 0) {
        console.log(
          `📉 Marked ${lapsedMembers.count} lapsed membership(s) as INACTIVE.`,
        );
      }
    } catch (error) {
      console.error("❌ Error running cron job:", error);
    }
  });
};

module.exports = { startCronJob };