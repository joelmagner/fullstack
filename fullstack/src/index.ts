import "reflect-metadata";
import { MikroORM } from "@mikro-orm/core";
import { __prod__ } from "./constants";
import mikroConfig from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema } from "type-graphql";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import redis from "redis";
import session from "express-session";
import connectRedis from "connect-redis";
import { Context } from "apollo-server-core";

const main = async () => {
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up(); // run migrations

  const app = express();
  const RedisStore = connectRedis(session);
  const redisClient = redis.createClient();
  app.use(
    session({
      name: "qid",
      store: new RedisStore({
        client: redisClient,
        disableTouch: true
      }),
      cookie: {
        maxAge: 1000 * 3600 * 24, // 1 day
        httpOnly: true,
        sameSite: "lax",
        secure: __prod__ // https
      },
      saveUninitialized: false,
      secret: "dhwakjdhalsdkjsahdlsak", //TODO: create env-var for this later on.
      resave: false
    })
  );
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false
    }),
    context: ({ req, res }): Context => ({ em: orm.em, req, res })
  });

  apolloServer.applyMiddleware({ app }); // create graphql endpoint on express

  app.listen(4000, () => {
    console.log("Server started on http://localhost:4000");
  });
};

main().catch(err => console.log(err));
