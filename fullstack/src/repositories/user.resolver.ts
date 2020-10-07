import {
  Resolver,
  Ctx,
  Arg,
  Mutation,
  Query,
  FieldResolver,
  Root,
  UseMiddleware,
} from "type-graphql";
import { Context } from "../utils/types/Context";
import { User } from "../entities/User";
import argon2 from "argon2";
import {
  COOKIE_NAME,
  FORGOT_PASSWORD_PREFIX,
  REQUEST_ORIGIN_URL_CORS,
} from "../utils/constants";
import { UsernamePasswordInput } from "./inputTypes/UsernamePasswordInput";
import { PASSWORD_FIELD, USERNAME_OR_EMAIL_FIELD } from "../utils/field.names";
import { sendEmail } from "../utils/email";
import { v4 } from "uuid";
import { validatePassword } from "../utils/validation/password.validate";
import { validateToken } from "../utils/validation/token.validate";
import { validateRegister } from "../utils/validation/register.validate";
import { UserResponse } from "./responses/user.response";
import { isAuth } from "../middleware/isAuth";
import { validateUsername } from "../utils/validation/username.validate";

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: Context) {
    //current user, ok to show them their own email
    if (req.session.userId === user.id) {
      return user.email;
    }
    //current user tries to access someone elses email
    return "";
  }

  @Mutation(() => UserResponse)
  @UseMiddleware(isAuth)
  async changeUsername(
    @Arg("newUsername") username: string,
    @Ctx() { req }: Context
  ): Promise<UserResponse> {
    const { userId } = req.session;
    let errors = validateUsername(username);
    if (errors) {
      return { errors };
    }

    const currentUser = await User.findOne({ where: { id: userId } });
    const isUsernameTaken = await User.findOne({ where: { username } });
    if (isUsernameTaken) {
      return {
        errors: [
          {
            field: "username",
            message: "That username already exists.",
          },
        ],
      };
    }
    if (!currentUser) {
      return {
        errors: [
          {
            field: "username",
            message: "Sorry, but you are not signed in somehow...",
          },
        ],
      };
    }
    return await (await User.update(currentUser, { username })).raw[0];
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token: string,
    @Arg("newPassword") newPassword: string,
    @Ctx() { redis, req }: Context
  ): Promise<UserResponse> {
    let errors = validatePassword(newPassword, "newPassword");
    if (errors) {
      return { errors };
    }
    const key = FORGOT_PASSWORD_PREFIX + token;
    const userId = await redis.get(key);
    if (!userId) {
      const errors = validateToken(userId || undefined);
      return { errors } as UserResponse;
    }

    const userIdNum = parseInt(userId);
    const user = await User.findOne(userIdNum);
    if (!user) {
      const errors = validateToken(user || undefined);
      return { errors } as UserResponse;
    }

    await User.update(
      { id: userIdNum },
      { password: await argon2.hash(newPassword) }
    );

    await redis.del(key); //remove key after its been used

    req.session.userId = user.id; // login user after password change
    return { user };
  }

  @Mutation(() => Boolean)
  async forgotPassword(@Arg("email") email: string, @Ctx() { redis }: Context) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      //email not in db
      return true;
    }

    const token = v4(); // uuid

    await redis.set(
      FORGOT_PASSWORD_PREFIX + token,
      user.id,
      "ex",
      1000 * 60 * 60 * 24 * 3 // expires after 3 days
    );

    await sendEmail(
      email,
      `Hi, click to <a href="${REQUEST_ORIGIN_URL_CORS}/change-password/${token}">Reset Password</a>`
    );

    return true;
  }

  @Query(() => User, { nullable: true })
  async me(@Ctx() { req }: Context) {
    if (!req.session.userId) {
      return null; //not logged in
    }
    return await User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options: UsernamePasswordInput,
    @Ctx() { req }: Context
  ): Promise<UserResponse> {
    const isUsernameTaken = await User.findOne({
      where: { username: options.username },
    });
    const isEmailTaken = await User.findOne({
      where: { email: options.email.toLowerCase() },
    });
    const errors = validateRegister(options, isUsernameTaken, isEmailTaken);

    if (errors) {
      return { errors };
    }

    const hashedPassword = await argon2.hash(options.password);
    const user = User.create({
      username: options.username.toLowerCase(),
      password: hashedPassword,
      email: options.email.toLowerCase(),
    });
    try {
      await user.save();
    } catch (err) {
      console.log("Error in resolvers -> user -> register: ", err);
    }
    req.session.userId = user.id; // autolog user when registered
    return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail: string,
    @Arg("password") password: string,
    @Ctx() { req }: Context
  ): Promise<UserResponse> {
    const msg = "Your username, email or password is incorrect";
    const user = await User.findOne(
      usernameOrEmail.includes("@")
        ? { where: { email: usernameOrEmail.toLowerCase() } }
        : { where: { username: usernameOrEmail.toLowerCase() } }
    );

    if (!user) {
      return {
        errors: [
          {
            field: USERNAME_OR_EMAIL_FIELD,
            message: msg,
          },
        ],
      };
    }

    if (user.username.includes("@")) {
      return {
        errors: [
          {
            field: USERNAME_OR_EMAIL_FIELD,
            message: msg,
          },
        ],
      };
    }

    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: PASSWORD_FIELD,
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
    @Arg("options") options: UsernamePasswordInput
  ): Promise<Boolean> {
    await User.delete({ username: options.username });
    return true;
  }

  @Query(() => [User])
  getUsers(): Promise<User[]> {
    return User.find({});
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
