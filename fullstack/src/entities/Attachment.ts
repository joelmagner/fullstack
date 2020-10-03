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
import { User } from "./User";

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

  @Field(() => Boolean)
  @Column({ type: "boolean", default: false })
  profilePicture!: boolean;

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
