import React from "react";
import { Formik, Form } from "formik";
import {
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage
} from "@chakra-ui/core";
interface registerProps {}

const Register: React.FC<registerProps> = ({}) => {
  return (
    <Formik
      initialValues={{ username: "", password: "" }}
      onSubmit={values => {
        console.log(values);
      }}
    >
      {({ values, handleChange }) => (
        <Form>
          <FormControl>
            <FormLabel htmlFor="username">Username</FormLabel>
            <Input
              value={values.username}
              id="username"
              placeholder="username"
            />
            <FormErrorMessage>{values.errors.name}</FormErrorMessage>
          </FormControl>
        </Form>
      )}
    </Formik>
  );
};

export default Register;
