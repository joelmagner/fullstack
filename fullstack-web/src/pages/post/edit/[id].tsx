import { Box, Button, CircularProgress } from "@chakra-ui/core";
import { Formik, Form } from "formik";
import { withUrqlClient } from "next-urql";
import { Router, useRouter } from "next/router";
import React from "react";
import { InputField } from "../../../components/InputField";
import { Layout } from "../../../components/Layout";
import { PostInput, useUpdatePostMutation } from "../../../generated/graphql";
import { getPostFromUrl } from "../../../utils/getPostFromUrl";
import { toErrorMap } from "../../../utils/toErrorMap";
import { urqlClient } from "../../../utils/urqlClient";

interface EditPostProps {}

const EditPost: React.FC<EditPostProps> = ({}) => {
  const router = useRouter();
  const [{ data, fetching, error }] = getPostFromUrl();
  const [, updatePost] = useUpdatePostMutation();
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
  }
  if (!data?.post) {
    return (
      <Layout>
        <Box>Post could not be found...</Box>
      </Layout>
    );
  } else {
    return (
      <Layout variant="small">
        <Formik
          initialValues={{ title: data.post.title, text: data.post.text }}
          onSubmit={async (values: PostInput, { setErrors }) => {
            const response = await updatePost({
              id: data.post!.id,
              input: values,
            });
            if (response.data?.updatePost?.errors) {
              setErrors(toErrorMap(response.data.updatePost.errors));
            } else if (response.data?.updatePost?.post) {
              router.push("/");
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <InputField
                textarea={false}
                name="title"
                placeholder="title"
                label="Title"
              />
              <Box mt={4}>
                <InputField
                  textarea
                  name="text"
                  placeholder="text..."
                  label="Text"
                />
              </Box>
              <Button
                mt={4}
                type="submit"
                isLoading={isSubmitting}
                variantColor="teal"
              >
                Create Post
              </Button>
            </Form>
          )}
        </Formik>
      </Layout>
    );
  }
};
export default withUrqlClient(urqlClient)(EditPost);
