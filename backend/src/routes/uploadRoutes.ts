import { Router } from "express";
import path from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3 from "../utils/aws";
import authMiddleware, { AuthRequest } from "../middleware/authMiddleware";
import { validate } from "../middleware/validate";
import { presignUploadSchema } from "../schemas/uploadSchemas";

const router = Router();

router.use(authMiddleware);

router.post(
  "/presign",
  validate(presignUploadSchema),
  async (req: AuthRequest, res) => {
    try {
      const { filename, contentType } = req.body;

      // Sanitize filename to prevent directory traversal or invalid characters
      const baseName = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `uploads/${Date.now()}-${baseName}`;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(s3, command, {
        expiresIn: 300,
      });

      return res.json({
        uploadUrl,
        key,
      });
    } catch (error) {
      console.error("Presign error:", error);

      return res.status(500).json({
        message: "Failed to generate upload URL",
      });
    }
  },
);

export default router;
