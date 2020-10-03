import { GraphQLUpload } from "apollo-server-express";
import { createWriteStream, unlinkSync } from "fs";
import { GraphQLScalarType } from "graphql";
import {
  Arg,
  Ctx,
  Mutation,
  Query,
  Resolver,
  UseMiddleware,
} from "type-graphql";
import { Attachment } from "../entities/Attachment";
import { isAuth } from "../middleware/isAuth";
import { UPLOAD_FIELD } from "../utils/field.names";
import { Context } from "../utils/types/Context";
import { validateUpload } from "../utils/validation/upload.validate";
import { v4 } from "uuid";
import { AttachmentResponse } from "./responses/attachment.response";

const PROFILE_ATTACHMENTS_PATH = __dirname + "/../../attachments/profile/";

@Resolver()
export class AttachmentResolver {
  @Query(() => [Attachment], { nullable: true })
  async getAttachments(@Ctx() { req }: Context): Promise<Attachment[] | null> {
    return await Attachment.find({
      where: { user: req.session.userId, profilePicture: true },
    });
  }

  @Query(() => Attachment, { nullable: true })
  async getProfilePicture(
    @Ctx() { req }: Context
  ): Promise<Attachment | undefined> {
    return await Attachment.findOne({
      where: { user: req.session.userId, profilePicture: true },
    });
  }

  @Mutation(() => AttachmentResponse)
  @UseMiddleware(isAuth)
  async addProfilePicture(
    @Ctx() { req }: Context,
    @Arg("file", () => GraphQLUpload as GraphQLScalarType)
    { createReadStream, filename, encoding, mimetype }: Attachment
  ): Promise<AttachmentResponse | undefined> {
    console.log("encoding, mimetype", encoding, mimetype);
    console.log("file", filename);
    //@todo: find new package, graphql-u pload not compatible with node 14.
    //@todo: check filesize in frontend before sending image!
    const { userId } = req.session;

    const errors = validateUpload("image", {
      encoding,
      mimetype,
    } as Attachment);

    if (errors) {
      console.log("Errors!", errors);
      return { errors };
    }

    const profilePictureExists = await Attachment.findOne({
      where: { user: userId, profilePicture: true },
    });

    const UUID = v4();
    const fileExtension = filename.split(/(?=\.)/).pop();
    const hashedFilename = UUID + fileExtension;
    console.log("new filename", hashedFilename);

    //@todo export into utils function
    new Promise((resolve, reject) => {
      createReadStream().pipe(
        createWriteStream(PROFILE_ATTACHMENTS_PATH + hashedFilename, {
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

    //already have a profile picture, remove the old one and insert the new one..
    if (profilePictureExists?.profilePicture) {
      console.log("PROFILE PICTURE ALREADY EXISTS!");
      const oldFile = profilePictureExists.filename;

      try {
        unlinkSync(PROFILE_ATTACHMENTS_PATH + oldFile);
      } catch (err) {
        console.log("Couldn't delete old file");
        return {
          errors: [
            {
              field: UPLOAD_FIELD,
              message: "Couldn't delete old picture, please try again later...",
            },
          ],
        };
      }

      const uploadResult = await Attachment.update(
        { user: userId },
        { filename: hashedFilename, mimetype, encoding, user: userId }
      );

      console.log("Updated existing profile picture", uploadResult);
      return uploadResult.raw[0];
    } else {
      const uploadResult = await Attachment.insert({
        createReadStream,
        encoding,
        mimetype,
        filename: hashedFilename,
        user: userId,
        profilePicture: true,
      });
      console.log(
        "Inserted new profile picture for the first time",
        uploadResult
      );
      return uploadResult.raw[0];
    }
  }
}
