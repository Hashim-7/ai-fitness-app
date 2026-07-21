import { vi } from "vitest";

export const getSignedUrl = vi
  .fn()
  .mockResolvedValue("https://fake-s3-upload-url.com/test-file");
