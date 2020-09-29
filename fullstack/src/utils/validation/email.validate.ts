import { EMAIL_FIELD } from "../field.names";

export const validateEmail = (email: string) => {
  if (!email.match(/\w+@\w+\.\w+/)) {
    return [
      {
        field: EMAIL_FIELD,
        message: "That is not a valid email address",
      },
    ];
  }
  return null;
};
