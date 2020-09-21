import { User } from "../entities/User";
import { UsernamePasswordInput } from "../resolvers/UsernamePasswordInput";
import { validateEmail } from "./email.validate";
import { emailField, usernameField } from "./field.names";
import { validatePassword } from "./password.validate";
import { validateUsername } from "./username.validate";

export const validateRegister = (
  options: UsernamePasswordInput,
  isUsernameTaken?: User | null,
  isEmailTaken?: User | null
) => {
  if (isUsernameTaken !== undefined) {
    return [
      {
        field: usernameField,
        message: "That username already exists",
      },
    ];
  }

  if (isEmailTaken !== undefined) {
    return [
      {
        field: emailField,
        message: "That email already exists",
      },
    ];
  }

  const username = validateUsername(options.username);
  const email = validateEmail(options.email);
  const password = validatePassword(options.password);
  console.log(username, email, password);
  if (username) {
    return username;
  }
  if (email) {
    return email;
  }
  if (password) {
    return password;
  }
  return null;
};
