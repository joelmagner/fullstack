import { passwordField } from "./field.names";

export const validatePassword = (
  password: string,
  optionalPasswordField?: string
) => {
  if (password.length < 4) {
    return [
      {
        field: optionalPasswordField || passwordField,
        message: "Length of password must be at least 4 characters",
      },
    ];
  }
  return null;
};
