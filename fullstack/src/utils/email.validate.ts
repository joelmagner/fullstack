import { emailField } from "./field.names";

export const validateEmail = (email: string) => {
  if (!email.match(/\w+@\w+\.\w+/)) {
    return [
      {
        field: emailField,
        message: "That is not a valid email address",
      },
    ];
  }
  return null;
};
