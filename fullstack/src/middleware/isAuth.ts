import { Context } from "../types";
import { MiddlewareFn } from "type-graphql";

// Runs before resolver
// Used after Mutation/Query decorator
export const isAuth: MiddlewareFn<Context> = ({ context }, next) => {
  if (!context.req.session.userId) {
    throw new Error("not authenticated");
  }
  return next();
};
