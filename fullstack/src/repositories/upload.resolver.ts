import { GraphQLUpload } from "apollo-server-express";
import { createWriteStream } from "fs";
import { GraphQLScalarType } from "graphql";
import { Arg, Mutation, Resolver } from "type-graphql";
import { Upload } from "../entities/Upload";

@Resolver()
export class UploadResolver {
  @Mutation(() => Boolean)
  async addProfilePicture(
    @Arg("file", () => GraphQLUpload as GraphQLScalarType)
    { createReadStream, filename, encoding, mimetype }: Upload
  ): Promise<boolean> {
    console.log("encoing, mimetype", encoding, mimetype);
    console.log("file", filename);
    //@todo: find new package, graphql-upload not compatible with node 14.
    //@todo: add logic to only upload valid filetypes. png, jpeg, jpg
    return new Promise((resolve, reject) => {
      const fileDate = Date.now();
      createReadStream().pipe(
        createWriteStream(
          __dirname + `/../../images/${fileDate.toString() + "_" + filename}`,
          {
            autoClose: true,
          }
        )
          .on("error", (err: unknown) => {
            console.log("Error occurred in fileupload", err);
            reject(false);
          })
          .on("finish", () => resolve(true))
      );
    });
  }
}
