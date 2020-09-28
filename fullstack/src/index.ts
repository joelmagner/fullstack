import "reflect-metadata";

import { COOKIE_NAME, REQUEST_ORIGIN_URL_CORS, __prod__ } from "./constants";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import Redis from "ioredis";
import session from "express-session";
import connectRedis from "connect-redis";
import { Context } from "apollo-server-core";
import cors from "cors";
import { createConnection } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import { Vote } from "./entities/Vote";
import { VoteResolver } from "./resolvers/vote";

const main = async () => {
  await createConnection({
    type: "postgres",
    database: "fullstack",
    username: "postgres",
    password: "joel",
    logging: !__prod__,
    synchronize: !__prod__,
    entities: [Post, User, Vote],
  });

  const app = express();
  const RedisStore = connectRedis(session);
  const redis = new Redis();
  app.use(
    cors({
      origin: REQUEST_ORIGIN_URL_CORS,
      credentials: true,
    })
  );
  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 3600 * 24, // 1 day
        httpOnly: true,
        sameSite: "lax",
        secure: __prod__, // https
      },
      saveUninitialized: false,
      secret: "dhwakjdhalsdkjsahdlsak", //TODO: create env-var for this later on.
      resave: false,
    })
  );
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver, VoteResolver],
      validate: false,
    }),
    context: ({ req, res }): Context => ({ req, res, redis }),
  });

  apolloServer.applyMiddleware({
    app,
    cors: false, //handled application-wide by package `cors`
  }); // create graphql endpoint on express

  app.listen(4000, () => {
    console.log("Server started on http://localhost:4000");
  });
};

main().catch((err) => console.log(err));
