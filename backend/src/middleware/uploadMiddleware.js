const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const isPdf = file.mimetype === "application/pdf";

    // For "raw" resource type, Cloudinary treats public_id as the literal
    // filename — it does NOT auto-append an extension the way it does for
    // images. Without the extension baked in here, downloaded files have
    // no extension at all, so the OS/browser doesn't know they're PDFs.
    const safeBaseName = file.originalname
      .replace(/\.[^/.]+$/, "") // strip any existing extension
      .replace(/[^a-zA-Z0-9_-]/g, "_"); // strip spaces/special chars
    const uniquePublicId = isPdf
      ? `${Date.now()}-${safeBaseName}.pdf`
      : `${Date.now()}-${safeBaseName}`;

    return {
      folder: "member_docs", // Folder name in your Cloudinary
      allowed_formats: ["jpg", "png", "pdf"],
      // Cloudinary blocks direct delivery of PDFs uploaded as "image"
      // resource type (a security restriction on free/default accounts).
      // Uploading PDFs as "raw" instead avoids that restriction.
      resource_type: isPdf ? "raw" : "image",
      public_id: uniquePublicId,
      // Even with "raw" + the account-level PDF/ZIP delivery restriction
      // lifted, Cloudinary can still block a specific file if it wasn't
      // explicitly marked public at upload time.
      access_mode: "public",
    };
  },
});

const upload = multer({ storage: storage });

module.exports = upload;