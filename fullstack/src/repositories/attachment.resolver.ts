import { GraphQLUpload } from "apollo-server-express";
import { unlinkSync } from "fs";
import { GraphQLScalarType } from "graphql";
import {
  Arg,
  Ctx,
  FieldResolver,
  Mutation,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { Attachment } from "../entities/Attachment";
import { isAuth } from "../middleware/isAuth";
import { UPLOAD_FIELD } from "../utils/field.names";
import { Context } from "../utils/types/Context";
import { validateUpload } from "../utils/validation/upload.validate";
import { v4 } from "uuid";
import { AttachmentResponse } from "./responses/attachment.response";
import { UploadType } from "../utils/types/UploadType";
import { uploadFile } from "../utils/upload";
import { PROFILE_ATTACHMENTS_PATH_RELATIVE } from "../utils/constants";

const PROFILE_ATTACHMENTS_PATH = __dirname + "/../../attachments/profile/";

@Resolver(Attachment)
export class AttachmentResolver {
  @FieldResolver(() => String)
  imagePathname(@Root() root: Attachment) {
    return PROFILE_ATTACHMENTS_PATH_RELATIVE + root.filename;
  }

  @Query(() => [Attachment], { nullable: true })
  async getAttachments(@Ctx() { req }: Context): Promise<Attachment[] | null> {
    return await Attachment.find({
      where: { user: req.session.userId },
    });
  }

  @Query(() => Attachment, { nullable: true })
  async getProfilePicture(
    @Ctx() { req }: Context
  ): Promise<Attachment | undefined> {
    const { userId } = req.session;
    return await Attachment.findOne({
      where: {
        user: userId,
        uploadType: UploadType.ProfilePicture,
      },
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
      console.log("Errors: ", errors);
      return { errors };
    }
    const hasProfilePicture = await Attachment.findOne({
      where: { user: userId, uploadType: UploadType.ProfilePicture },
    });

    const UUID = v4();
    const fileExtension = filename.split(/(?=\.)/).pop();
    const hashedFilename = UUID + fileExtension;

    //@todo export into utils function
    //already have a profile picture, remove the old one and insert the new one..
    if (hasProfilePicture?.uploadType === UploadType.ProfilePicture) {
      const oldFile = hasProfilePicture.filename;

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

      await uploadFile(createReadStream, hashedFilename);
      await Attachment.update(
        { user: userId },
        { filename: hashedFilename, mimetype, encoding, user: userId }
      );
      console.log("returnar här!");
      const res = await Attachment.findOne({
        user: userId,
        uploadType: UploadType.ProfilePicture,
      });
      console.log(res);
      return { attachment: res };
    } else {
      console.log("inserting new image!");

      await uploadFile(createReadStream, hashedFilename);
      const uploadResult = await Attachment.insert({
        createReadStream,
        encoding,
        mimetype,
        filename: hashedFilename,
        user: userId,
        uploadType: UploadType.ProfilePicture,
      });

      return uploadResult.raw[0];
    }
  }
}
