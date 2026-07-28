const QRCode = require("qrcode");

// Change this to your actual business name.
const BUSINESS_NAME = "MemberHub Fitness & Wellness";

const TEMPLATES = {
  classic: {
    accent: "#2563eb",
    accentSoft: "#eff6ff",
    fontHeading: "'Fraunces', Georgia, serif",
  },
  elegant: {
    accent: "#b45309",
    accentSoft: "#fffbeb",
    fontHeading: "'Fraunces', Georgia, serif",
  },
  modern: {
    accent: "#111827",
    accentSoft: "#f3f4f6",
    fontHeading: "'Helvetica Neue', Arial, sans-serif",
  },
};

// Picks a badge icon based on keywords in the tier name, so a "Gym + Yoga"
// tier looks visually distinct from a "Personal Training" or plain "Gym"
// tier on the finished certificate, without needing a schema change.
function getTierIcon(tierName = "") {
  const name = tierName.toLowerCase();
  if (name.includes("personal") || name.includes("trainer")) {
    return `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 2l2.4 6.9L21 11l-6.6 2.1L12 20l-2.4-6.9L3 11l6.6-2.1L12 2z"/></svg>`; // star burst
  }
  if (name.includes("yoga")) {
    return `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 4a2 2 0 100 4 2 2 0 000-4z"/><path d="M5 20c1-4 4-6 7-6s6 2 7 6"/><path d="M8 13l-3 3M16 13l3 3"/></svg>`; // simple figure/lotus-ish
  }
  if (name.includes("gym")) {
    return `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M6.5 6.5l11 11M4 9l3-3 2 2-3 3-2-2zM15 18l3-3 2 2-3 3-2-2zM2 11l2-2M20 13l2 2"/></svg>`; // dumbbell-ish
  }
  return `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="5"/><path d="M8 13l-2 8 6-3 6 3-2-8"/></svg>`; // generic award medal
}

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function renderCertificateHTML({
  certificateId,
  firstName,
  lastName,
  tierName,
  achievementText,
  validUntil,
  signatoryName,
  signatoryTitle,
  templateKey,
  verifyBaseUrl,
}) {
  const t = TEMPLATES[templateKey] || TEMPLATES.classic;
  const tierIcon = getTierIcon(tierName);

  const verifyUrl = `${verifyBaseUrl || "http://localhost:5173"}/verify/${certificateId}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    width: 180,
    margin: 1,
    color: { dark: "#111827", light: "#FFFFFF00" },
  });

  const signatureBlock = signatoryName
    ? `
      <div class="signature">
        <div class="signature-line"></div>
        <p class="signatory-name">${escapeHtml(signatoryName)}</p>
        ${signatoryTitle ? `<p class="signatory-title">${escapeHtml(signatoryTitle)}</p>` : ""}
      </div>`
    : `<div class="signature-spacer"></div>`;

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@500;600&display=swap" rel="stylesheet">
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
    background: #fafafa;
  }
  .certificate {
    box-sizing: border-box;
    width: 280mm;
    height: 193mm;
    position: relative;
    background: linear-gradient(180deg, ${t.accentSoft} 0%, white 22%);
    border: 2px solid ${t.accent};
    border-radius: 4px;
    padding: 14mm 20mm;
    display: flex;
    flex-direction: column;
  }
  /* Corner flourishes */
  .corner { position: absolute; width: 16mm; height: 16mm; border: 2px solid ${t.accent}; }
  .corner.tl { top: 6mm; left: 6mm; border-right: none; border-bottom: none; }
  .corner.tr { top: 6mm; right: 6mm; border-left: none; border-bottom: none; }
  .corner.bl { bottom: 6mm; left: 6mm; border-right: none; border-top: none; }
  .corner.br { bottom: 6mm; right: 6mm; border-left: none; border-top: none; }

  .brand-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: ${t.accent};
  }
  .brand-name {
    font-size: 13px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #6b7280;
    font-weight: 600;
  }

  .body-content { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }

  .title {
    font-family: ${t.fontHeading};
    font-size: 38px;
    font-weight: 600;
    color: #111827;
    margin: 10px 0 4px 0;
  }
  .subtitle { font-size: 16px; color: #6b7280; margin: 0 0 6px 0; }
  .recipient-name {
    font-family: ${t.fontHeading};
    font-size: 36px;
    font-weight: 600;
    color: ${t.accent};
    margin: 4px 0 14px 0;
  }
  .tier-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: ${t.accentSoft};
    color: ${t.accent};
    border: 1px solid ${t.accent};
    padding: 5px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 14px;
  }
  .achievement { font-size: 16px; color: #1f2937; margin: 0 0 6px 0; max-width: 170mm; line-height: 1.5; }
  .valid-until { font-size: 13px; color: #6b7280; margin: 0; }

  .footer-row {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    border-top: 1px solid #e5e7eb;
    padding-top: 10px;
    margin-top: 10px;
  }
  .cert-meta { font-size: 10px; color: #9ca3af; text-align: left; }
  .cert-meta strong { color: #6b7280; }
  .qr-block { text-align: center; }
  .qr-block img { width: 20mm; height: 20mm; display: block; }
  .qr-caption { font-size: 8px; color: #9ca3af; margin-top: 2px; }

  .signature { text-align: right; min-width: 55mm; }
  .signature-line { width: 55mm; border-top: 1.5px solid ${t.accent}; margin-bottom: 6px; margin-left: auto; }
  .signatory-name { font-size: 13px; font-weight: 600; color: #111827; margin: 0; }
  .signatory-title { font-size: 10px; color: #6b7280; margin: 2px 0 0 0; }
  .signature-spacer { min-width: 55mm; }
</style>
</head>
<body>
  <div class="certificate">
    <div class="corner tl"></div>
    <div class="corner tr"></div>
    <div class="corner bl"></div>
    <div class="corner br"></div>

    <div class="brand-row">
      <span class="brand-name">${escapeHtml(BUSINESS_NAME)}</span>
    </div>

    <div class="body-content">
      <div style="color: ${t.accent};">${tierIcon}</div>
      <p class="title">Certificate of Membership</p>
      <p class="subtitle">This is to certify that</p>
      <p class="recipient-name">${escapeHtml(firstName)} ${escapeHtml(lastName)}</p>
      <span class="tier-badge">${escapeHtml(tierName)} Member</span>
      <p class="achievement">${escapeHtml(achievementText)}</p>
      <p class="valid-until">Valid until ${escapeHtml(validUntil)}</p>
    </div>

    <div class="footer-row">
      <div class="cert-meta">
        <strong>Certificate ID:</strong> ${escapeHtml(certificateId)}<br/>
        Scan to verify authenticity
      </div>
      <div class="qr-block">
        <img src="${qrDataUrl}" alt="Verify QR code" />
      </div>
      ${signatureBlock}
    </div>
  </div>
</body>
</html>`;
}

module.exports = { renderCertificateHTML };