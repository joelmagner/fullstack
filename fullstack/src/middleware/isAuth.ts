import { Context } from "../utils/types/Context";
import { MiddlewareFn } from "type-graphql";
import { NOT_AUTHORIZED } from "../utils/constants";

// Runs before resolver
// Used after Mutation/Query decorator
export const isAuth: MiddlewareFn<Context> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error(NOT_AUTHORIZED);
  }
  return next();
};
