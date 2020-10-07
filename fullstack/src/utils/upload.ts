import { createWriteStream } from "fs";
import { Stream } from "stream";
import { AttachmentResponse } from "../repositories/responses/attachment.response";
import { PROFILE_ATTACHMENTS_PATH_ABSOLUTE } from "./constants";
import { UPLOAD_FIELD } from "./field.names";

export const uploadFile = (
  createReadStream: () => Stream,
  filename: string
): Promise<AttachmentResponse | boolean> => {
  return new Promise((resolve, reject) => {
    createReadStream().pipe(
      createWriteStream(PROFILE_ATTACHMENTS_PATH_ABSOLUTE + filename, {
        autoClose: true,
      })
        .on("error", (err: unknown) => {
          console.log("Error occurred in fileupload", err);
          reject(false);
          return [
            {
              field: UPLOAD_FIELD,
              message: "Error occurred in fileupload...",
            },
          ];
        })
        .on("finish", () => {
          resolve(true);
          return true;
        })
    );
  });
};
