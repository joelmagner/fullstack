import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";
import path from "path";

export default {
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  type: "postgres",
  database: "fullstack",
  username: "postgres",
  password: "joel",
  logging: !__prod__,
  synchronize: !__prod__,
  entities: [Post, User],
} as any;
