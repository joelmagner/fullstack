import { NavBar } from "../components/NavBar";
import { withUrqlClient } from "next-urql";
import { urqlClient } from "../utils/urqlClient";
import { usePostsQuery } from "../generated/graphql";
const Index = () => {
  const [{ data }] = usePostsQuery();
  return (
    <>
      <NavBar />
      <div>Hello world!</div>
      {data
        ? data.posts.map((post) => <div key={post.id}>{post.title}</div>)
        : null}
    </>
  );
};
export default withUrqlClient(urqlClient)(Index);
// @todo: ssr this later.
