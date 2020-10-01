import { Request, Response } from "express";
import { Redis } from "ioredis";
import { userLoader } from "../loaders/user.loader";
import { voteLoader } from "../loaders/vote.loader";
export type Context = {
  req: Request & { session: Express.Session };
  res: Response;
  redis: Redis;
  userLoader: ReturnType<typeof userLoader>;
  voteLoader: ReturnType<typeof voteLoader>;
};
