import { USERNAME_FIELD } from "../field.names";

export const validateUsername = (username: string) => {
  if (!username.match(/(^[a-zA-Z0-9]+$)/)) {
    return [
      {
        field: USERNAME_FIELD,
        message: "The username has invalid formatting",
      },
    ];
  }

  if (username.length < 4) {
    return [
      {
        field: USERNAME_FIELD,
        message: "Length of username must be at least 4 characters",
      },
    ];
  }

  return null;
};
