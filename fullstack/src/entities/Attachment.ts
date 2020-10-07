import { Stream } from "stream";
import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UploadType } from "../utils/types/UploadType";
import { User } from "./User";

import { registerEnumType } from "type-graphql";

registerEnumType(UploadType, {
  name: "UploadType",
  description: "Specifies the type of attached file",
});
@ObjectType()
@Entity()
export class Attachment extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.attachments)
  user: User;

  @Field()
  @Column()
  filename!: string;

  @Field()
  @Column()
  mimetype!: string;

  @Field(() => UploadType)
  @Column({ type: "enum", default: UploadType.Default, enum: UploadType })
  uploadType!: UploadType;

  @Field()
  @Column()
  encoding!: string;

  createReadStream: () => Stream;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
