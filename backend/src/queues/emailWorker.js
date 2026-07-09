const { Worker } = require("bullmq");
const { connection } = require("./connection.js");
const { sendRenewalReminder } = require("../utils/emailService.js");

let worker = null;

function startEmailWorker() {
  if (worker) return worker; // don't start it twice

  worker = new Worker(
    "renewal-reminders",
    async (job) => {
      const { email, firstName, endDate } = job.data;
      await sendRenewalReminder(email, firstName, endDate);
    },
    { connection },
  );

  worker.on("completed", (job) => {
    console.log(
      `📧 Queued reminder sent for job ${job.id} (${job.data.email})`,
    );
  });

  worker.on("failed", (job, err) => {
    console.error(`❌ Queued reminder failed for job ${job?.id}:`, err.message);
  });

  console.log("📬 Email reminder worker started.");
  return worker;
}

module.exports = { startEmailWorker };
