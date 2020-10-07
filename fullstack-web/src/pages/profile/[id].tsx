import { Box, Button, CircularProgress, Image } from "@chakra-ui/core";
import { Formik, Form } from "formik";
import { withUrqlClient } from "next-urql";
import { useRouter } from "next/router";
import React, { useState } from "react";
import { InputField } from "../../components/InputField";
import { Layout } from "../../components/Layout";
import { Upload } from "../../components/Upload";
import {
  useAddProfilePictureMutation,
  useChangeUsernameMutation,
  useGetProfilePictureQuery,
  useMeQuery,
} from "../../generated/graphql";
import { isServer } from "../../utils/isServer";
import { toErrorMap } from "../../utils/toErrorMap";
import { urqlClient } from "../../utils/urqlClient";

interface ProfileProps {}

//@todo change username,
//@todo change password by providing current password.
//@todo upload profile picture here.
const Profile: React.FC<ProfileProps> = ({}) => {
  const router = useRouter();
  const [, changeUsername] = useChangeUsernameMutation();
  const [{ data, fetching, error }] = useMeQuery({
    pause: isServer(), // only run on client
  });
  let file: any = null;
  const [{ data: profilePicture }] = useGetProfilePictureQuery();
  const [, addProfilePicture] = useAddProfilePictureMutation();
  const [profilePicUrl, setProfilePicUrl] = useState(
    "/attachments/profile/" + profilePicture?.getProfilePicture?.filename
  );
  const props = {
    name: "upload",
    multiple: false,
    // customRequest: addProfilePicture,
    data: (response: any) => (file = response),
  };

  if (fetching) {
    return (
      <Layout>
        <CircularProgress
          mt={1}
          size="64px"
          isIndeterminate
          color="green"
        ></CircularProgress>
        {"loading..."}
      </Layout>
    );
  }

  if (error) {
    return <Layout>{error}</Layout>;
  } else {
    return (
      <Layout variant="small">
        <Formik
          initialValues={{
            username: data?.me?.username || "",
            password: "",
            upload: null,
          }}
          onSubmit={async (values, { setErrors }) => {
            //profile
            const addedProfilePicture = await addProfilePicture({ file });

            setProfilePicUrl(
              "/attachments/profile/" +
                addedProfilePicture.data?.addProfilePicture.attachment?.filename
            );
            //username
            if (data?.me?.username != values.username) {
              const updateUsername = await changeUsername({
                newUsername: values.username,
              });

              if (updateUsername.data?.changeUsername.errors) {
                setErrors(
                  toErrorMap(updateUsername.data.changeUsername.errors)
                );
              }
            }

            //@todo: add username validation for submittion.
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <InputField
                name="username"
                placeholder="Username"
                label="Username"
              />
              <Box mt={4}>
                <InputField
                  name="password"
                  placeholder="Password"
                  label="Password"
                />
              </Box>
              <Upload name="upload" file={file} />
              {profilePicture?.getProfilePicture?.filename ? (
                <Image
                  src={"http://localhost:4000" + profilePicUrl}
                  maxH={"200px"}
                />
              ) : null}
              <Button
                mt={4}
                type="submit"
                isLoading={isSubmitting}
                variantColor="teal"
              >
                Update Profile
              </Button>
            </Form>
          )}
        </Formik>
      </Layout>
    );
  }
};
export default withUrqlClient(urqlClient)(Profile);
