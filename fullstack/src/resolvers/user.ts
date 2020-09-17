import {
  Resolver,
  Ctx,
  Arg,
  Mutation,
  InputType,
  Field,
  ObjectType,
  Query
} from "type-graphql";
import { Context } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";

@InputType()
class UsernamePasswordInput {
  @Field()
  username!: string;

  @Field()
  password!: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => User, { nullable: true })
  me(@Ctx() { em, req }: Context) {
    if (!req.session.userId) {
      return null; //not logged in
    }
    const user = em.findOne(User, { id: req.session.userId });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: Context
  ): Promise<UserResponse> {
    const checkUsername = await em.findOne(User, {
      username: options.username
    });
    if (checkUsername) {
      return {
        errors: [
          {
            field: options.username,
            message: "That username already exists"
          }
        ]
      };
    }
    if (options.username.length < 3) {
      return {
        errors: [
          {
            field: options.username,
            message: "Length of username must be at least 3 characters"
          }
        ]
      };
    }
    if (options.password.length < 4) {
      return {
        errors: [
          {
            field: options.password,
            message: "Length of password must be at least 4 characters"
          }
        ]
      };
    }
    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username.toLowerCase(),
      password: hashedPassword
    });
    try {
      await em.persistAndFlush(user);
    } catch (err) {
      console.log("message: ", err);
    }
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: Context
  ): Promise<UserResponse> {
    const msg = "Your username or password is incorrect";
    const user = await em.findOne(User, {
      username: options.username.toLowerCase()
    });
    if (!user) {
      return {
        errors: [
          {
            field: options.username,
            message: msg
          }
        ]
      };
    }
    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: options.password,
            message: msg
          }
        ]
      };
    }
    //store user id session
    //sets cookie on the user to keep them logged in
    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  async deleteUser(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em }: Context
  ): Promise<Boolean> {
    await em.nativeDelete(User, { username: options.username });
    return true;
  }

  @Query(() => [User])
  getUsers(@Ctx() { em }: Context): Promise<User[]> {
    return em.find(User, {});
  }
}
