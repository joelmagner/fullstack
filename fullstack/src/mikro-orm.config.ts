import { Post } from "./entities/Post";
import { __prod__ } from "./constants";
import path from "path";
import { User } from "./entities/User";
export default {
  migrations: {
    path: path.join(__dirname, "./migrations"),
    pattern: /^[\w-]+\d+\.[tj]s$/,
  },
  entities: [Post, User],
  dbName: "fullstack",
  user: "postgres",
  password: "joel",
  type: "postgresql",
  debug: !__prod__,
};
