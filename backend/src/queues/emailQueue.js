const { Queue } = require("bullmq");
const { connection } = require("./connection.js");

// The cron job (reminderCron.js) pushes jobs onto this queue instead of
// sending emails directly and waiting on each one. A separate worker
// process (emailWorker.js) picks jobs up and actually sends them — this
// way a slow or failing email provider never blocks the cron job itself
// from finishing its scan.
const emailQueue = new Queue("renewal-reminders", { connection });

module.exports = { emailQueue };
