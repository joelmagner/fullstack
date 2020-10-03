import { Attachment } from "../../entities/Attachment";
import { UPLOAD_FIELD } from "../field.names";

export type UPLOAD_TYPE = "image" | "video" | "any";

export const validateUpload = (type: UPLOAD_TYPE, file: Attachment) => {
  if (type === "image") {
    const jpg = "image/jpg";
    const jpeg = "image/jpeg";
    const png = "image/png";
    if (
      !(
        file.mimetype === png ||
        file.mimetype === jpg ||
        file.mimetype === jpeg
      )
    ) {
      return [
        {
          field: UPLOAD_FIELD,
          message: `Invalid filetype ${file.mimetype}, please convert the file to any of these formats['.jpg', '.jpeg', '.png']`,
        },
      ];
    }
  }
  return null;
};
