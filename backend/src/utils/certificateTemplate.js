// Renders the certificate as an HTML string, later converted to a PDF by
// Puppeteer. Using real HTML/CSS here (instead of PDFKit's manual
// .text()/.rect() coordinate calls) means fonts, spacing, and borders are
// all just normal CSS — much easier to adjust or restyle later.

const TEMPLATES = {
  classic: {
    accent: "#2563eb",
    accentSoft: "#eff6ff",
    fontHeading: "'Georgia', serif",
  },
  elegant: {
    accent: "#b45309",
    accentSoft: "#fffbeb",
    fontHeading: "'Georgia', serif",
  },
  modern: {
    accent: "#111827",
    accentSoft: "#f3f4f6",
    fontHeading: "'Helvetica Neue', Arial, sans-serif",
  },
};

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderCertificateHTML({
  firstName,
  lastName,
  achievementText,
  validUntil,
  signatoryName,
  signatoryTitle,
  templateKey,
}) {
  const t = TEMPLATES[templateKey] || TEMPLATES.classic;

  const signatureBlock = signatoryName
    ? `
      <div class="signature">
        <div class="signature-line"></div>
        <p class="signatory-name">${escapeHtml(signatoryName)}</p>
        ${signatoryTitle ? `<p class="signatory-title">${escapeHtml(signatoryTitle)}</p>` : ""}
      </div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  @page { size: A4 landscape; margin: 0; }
  body {
    margin: 0;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    width: 297mm;
    height: 210mm;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
  }
  .certificate {
    box-sizing: border-box;
    width: 277mm;
    height: 190mm;
    border: 3px solid ${t.accent};
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 20mm;
    position: relative;
    background: linear-gradient(180deg, ${t.accentSoft} 0%, white 25%);
  }
  .title {
    font-family: ${t.fontHeading};
    font-size: 42px;
    font-weight: bold;
    color: #111827;
    margin: 0 0 18px 0;
    letter-spacing: 1px;
  }
  .subtitle {
    font-size: 18px;
    color: #4b5563;
    margin: 0 0 10px 0;
  }
  .recipient-name {
    font-family: ${t.fontHeading};
    font-size: 40px;
    font-weight: bold;
    color: ${t.accent};
    margin: 6px 0 18px 0;
  }
  .achievement {
    font-size: 18px;
    color: #1f2937;
    margin: 0 0 8px 0;
    max-width: 180mm;
  }
  .valid-until {
    font-size: 14px;
    color: #6b7280;
    margin: 0;
  }
  .signature {
    margin-top: 24px;
  }
  .signature-line {
    width: 60mm;
    border-top: 1.5px solid ${t.accent};
    margin: 0 auto 8px auto;
  }
  .signatory-name {
    font-size: 15px;
    font-weight: 600;
    color: #111827;
    margin: 0;
  }
  .signatory-title {
    font-size: 12px;
    color: #6b7280;
    margin: 2px 0 0 0;
  }
</style>
</head>
<body>
  <div class="certificate">
    <p class="title">Certificate of Membership</p>
    <p class="subtitle">This is to certify that</p>
    <p class="recipient-name">${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
    <p class="achievement">${escapeHtml(achievementText)}</p>
    <p class="valid-until">Valid until: ${escapeHtml(validUntil)}</p>
    ${signatureBlock}
  </div>
</body>
</html>`;
}

module.exports = { renderCertificateHTML };
