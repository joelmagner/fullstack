import { PASSWORD_FIELD } from "../field.names";

export const validatePassword = (
  password: string,
  optionalPasswordField?: string
) => {
  if (password.length < 4) {
    return [
      {
        field: optionalPasswordField || PASSWORD_FIELD,
        message: "Length of password must be at least 4 characters",
      },
    ];
  }
  return null;
};
