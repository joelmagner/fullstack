import { User } from "../../entities/User";

export const validateToken = (token?: string, userId?: User) => {
  if (!token) {
    return [
      {
        field: "token",
        message: "Token has been used or expired.",
      },
    ];
  }
  if (!userId) {
    return [
      {
        field: "token",
        message: "User no longer exists.",
      },
    ];
  }
  return null;
};
