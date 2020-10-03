import { Field, ObjectType } from "type-graphql";
import { Attachment } from "../../entities/Attachment";
import { FieldError } from "./FieldError";

@ObjectType()
export class AttachmentResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => Attachment, { nullable: true })
  attachment?: Attachment;
}
