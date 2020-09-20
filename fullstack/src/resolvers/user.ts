import {
  Resolver,
  Ctx,
  Arg,
  Mutation,
  InputType,
  Field,
  ObjectType,
  Query,
} from "type-graphql";
import { Context } from "../types";
import { User } from "../entities/User";
import argon2 from "argon2";
import { COOKIE_NAME } from "../constants";

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
  async me(@Ctx() { em, req }: Context) {
    if (!req.session.userId) {
      return null; //not logged in
    }
    const user = await em.findOne(User, { id: req.session.userId });
    return user;
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: Context
  ): Promise<UserResponse> {
    const isUsernameTaken = await em.findOne(User, {
      username: options.username,
    });

    if (isUsernameTaken !== null) {
      return {
        errors: [
          {
            field: "username",
            message: "That username already exists",
          },
        ],
      };
    }

    if (!options.username.match(/(^[a-zA-Z0-9]+$)/)) {
      return {
        errors: [
          {
            field: "username",
            message: "The username has invalid formatting",
          },
        ],
      };
    }

    if (options.username.length < 4) {
      return {
        errors: [
          {
            field: "username",
            message: "Length of username must be at least 4 characters",
          },
        ],
      };
    }

    if (options.password.length < 4) {
      return {
        errors: [
          {
            field: "password",
            message: "Length of password must be at least 4 characters",
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, {
      username: options.username.toLowerCase(),
      password: hashedPassword,
    });
    try {
      await em.persistAndFlush(user);
    } catch (err) {
      console.log("Error in resolvers -> user -> register: ", err);
    }
    req.session.userId = user.id; // autolog user when registered
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { em, req }: Context
  ): Promise<UserResponse> {
    const msg = "Your username or password is incorrect";
    const user = await em.findOne(User, {
      username: options.username.toLowerCase(),
    });
    if (!user) {
      return {
        errors: [
          {
            field: "username",
            message: msg,
          },
        ],
      };
    }
    const valid = await argon2.verify(user.password, options.password);
    if (!valid) {
      return {
        errors: [
          {
            field: "password",
            message: msg,
          },
        ],
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

  @Mutation(() => Boolean)
  async logout(@Ctx() { req, res }: Context): Promise<Boolean> {
    return await new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME); // @todo: replace with env-var
        resolve(err ? false : true);
        return;
      })
    );
  }
}
