import { Stream } from "stream";
import { Field, ObjectType } from "type-graphql";
import {
  BaseEntity,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@ObjectType()
@Entity()
export class Upload extends BaseEntity {
  @Field()
  @PrimaryColumn()
  id: number;

  @Field(() => String)
  filename: string;

  @Field(() => String)
  mimetype: string;

  @Field(() => String)
  encoding: string;

  createReadStream: () => Stream;

  @Field(() => String)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn()
  updatedAt: Date;
}
