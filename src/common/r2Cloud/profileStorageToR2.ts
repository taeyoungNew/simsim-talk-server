import { DeleteObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { r2Client } from "./r2Client";

export const uploadProfileToR2 = async ({
  file,
  key,
}: {
  file: Express.Multer.File;
  key: string;
}): Promise<string> => {
  await r2Client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key, // ✅ 고정 key
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return key;
};

export const deleteProfileToR2 = async ({
  key,
}: {
  key: string;
}): Promise<string> => {
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key, // ✅ 고정 key
    }),
  );

  return key;
};
