import { withUrqlClient } from "next-urql";
import React from "react";
import { PostFeed } from "../components/PostFeed";
import { Upload } from "../components/Upload";
import { urqlClient } from "../utils/urqlClient";
const Index = () => {
  return (
    <>
      <PostFeed />
    </>
  );
};
export default withUrqlClient(urqlClient)(Index);
