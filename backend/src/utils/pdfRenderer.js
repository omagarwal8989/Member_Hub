// const puppeteer = require("puppeteer");

// // Launching a full Chromium instance takes a second or more — doing that on
// // every single certificate download would make the endpoint painfully slow.
// // Instead we launch it once, lazily, and keep reusing the same browser
// // instance. Each request still gets its own fresh page/tab.
// let browserPromise = null;

// function getBrowser() {
//   if (!browserPromise) {
//     browserPromise = puppeteer.launch({
//       headless: "new",
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });
//   }
//   return browserPromise;
// }

// // Renders an HTML string to a PDF Buffer (A4 landscape, matching the
// // certificate's page size).
// async function htmlToPdfBuffer(html) {
//   const browser = await getBrowser();
//   const page = await browser.newPage();
//   try {
//     await page.setContent(html, { waitUntil: "networkidle0" });
//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       landscape: true,
//       printBackground: true,
//     });
//     return pdfBuffer;
//   } finally {
//     await page.close();
//   }
// }

// // Close the shared browser cleanly if the server process exits, so it
// // doesn't leave an orphaned Chromium process running.
// process.on("SIGINT", async () => {
//   if (browserPromise) (await browserPromise).close();
//   process.exit(0);
// });
// process.on("SIGTERM", async () => {
//   if (browserPromise) (await browserPromise).close();
//   process.exit(0);
// });

// module.exports = { htmlToPdfBuffer };












// const puppeteer = require("puppeteer");

// // Launching a full Chromium instance takes a second or more — doing that on
// // every single certificate download would make the endpoint painfully slow.
// // Instead we launch it once, lazily, and keep reusing the same browser
// // instance. Each request still gets its own fresh page/tab.
// let browserPromise = null;

// function getBrowser() {
//   if (!browserPromise) {
//     browserPromise = puppeteer.launch({
//       headless: "new",
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });
//   }
//   return browserPromise;
// }

// // Renders an HTML string to a PDF Buffer (A4 landscape, matching the
// // certificate's page size).
// async function htmlToPdfBuffer(html) {
//   const browser = await getBrowser();
//   const page = await browser.newPage();
//   try {
//     await page.setContent(html, { waitUntil: "networkidle0" });
//     const pdfBytes = await page.pdf({
//       format: "A4",
//       landscape: true,
//       printBackground: true,
//     });
//     // Puppeteer returns a Uint8Array (not a true Node Buffer) in recent
//     // versions. Express's res.send() doesn't reliably treat a raw
//     // Uint8Array as binary data — without this conversion it can get
//     // serialized incorrectly, producing a PDF that "downloads" but won't
//     // actually open.
//     return Buffer.from(pdfBytes);
//   } finally {
//     await page.close();
//   }
// }

// // Close the shared browser cleanly if the server process exits, so it
// // doesn't leave an orphaned Chromium process running.
// process.on("SIGINT", async () => {
//   if (browserPromise) (await browserPromise).close();
//   process.exit(0);
// });
// process.on("SIGTERM", async () => {
//   if (browserPromise) (await browserPromise).close();
//   process.exit(0);
// });

// module.exports = { htmlToPdfBuffer };







const puppeteer = require("puppeteer");

// Launching a full Chromium instance takes a second or more — doing that on
// every single certificate download would make the endpoint painfully slow.
// Instead we launch it once, lazily, and keep reusing the same browser
// instance. Each request still gets its own fresh page/tab.
let browserPromise = null;

function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      // In Docker, PUPPETEER_EXECUTABLE_PATH points to an apt-installed
      // Chromium instead of Puppeteer's own bundled copy. Locally (no env
      // var set), this is undefined and Puppeteer just uses its own.
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });
  }
  return browserPromise;
}

// Renders an HTML string to a PDF Buffer (A4 landscape, matching the
// certificate's page size).
async function htmlToPdfBuffer(html) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    const pdfBytes = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
    });
    // Puppeteer returns a Uint8Array (not a true Node Buffer) in recent
    // versions. Express's res.send() doesn't reliably treat a raw
    // Uint8Array as binary data — without this conversion it can get
    // serialized incorrectly, producing a PDF that "downloads" but won't
    // actually open.
    return Buffer.from(pdfBytes);
  } finally {
    await page.close();
  }
}

// Close the shared browser cleanly if the server process exits, so it
// doesn't leave an orphaned Chromium process running.
process.on("SIGINT", async () => {
  if (browserPromise) (await browserPromise).close();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  if (browserPromise) (await browserPromise).close();
  process.exit(0);
});

module.exports = { htmlToPdfBuffer };