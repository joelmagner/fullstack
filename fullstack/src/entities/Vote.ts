import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Post } from "./Post";
import { User } from "./User";

// m to n
// user <-> posts
// a user can upvote many posts, and many users can upvote the same post
//
@ObjectType()
@Entity()
export class Vote extends BaseEntity {
  @Field()
  @PrimaryColumn()
  userId: number;

  @Field()
  @PrimaryColumn({ type: "int" })
  postId: number;

  @Field()
  @Column({ type: "int" })
  value: number;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.votes)
  user: User;

  @Field(() => Post, { nullable: true })
  @ManyToOne(() => Post, (post) => post.votes, { onDelete: "CASCADE" })
  post: Post;
}
