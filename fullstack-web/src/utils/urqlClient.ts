import { cacheExchange, Resolver, Cache } from "@urql/exchange-graphcache";
import { multipartFetchExchange } from "@urql/exchange-multipart-fetch";
import Router from "next/router";
import {
  dedupExchange,
  Exchange,
  fetchExchange,
  stringifyVariables,
} from "urql";
import { pipe, tap } from "wonka";
import {
  LogoutMutation,
  MeQuery,
  MeDocument,
  LoginMutation,
  RegisterMutation,
  VoteMutationVariables,
  DeletePostMutationVariables,
  UpdatePostMutationVariables,
} from "../generated/graphql";
import { updateQuery } from "./updateQuery";
import gql from "graphql-tag";
import { isServer } from "./isServer";

// Global error-handler
export const errorExchange: Exchange = ({ forward }) => (ops$) => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      if (error) {
        if (error?.message.includes("not authenticated")) {
          Router.replace("/login");
        }
      }
    })
  );
};

const invalidateAllPosts = (cache: Cache) => {
  const allFields = cache.inspectFields("Query");
  const fieldInfos = allFields.filter((info) => info.fieldName === "posts");

  //force reload of data
  fieldInfos.forEach((field) => {
    cache.invalidate("Query", "posts", field.arguments || {});
  });
};

const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;

    const allFields = cache.inspectFields(entityKey);
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    const results: string[] = [];
    const fieldKey = `${fieldName}(${stringifyVariables(fieldArgs)})`;
    const isInCache = cache.resolve(
      cache.resolveFieldByKey(entityKey, fieldKey) as string,
      "posts"
    );
    info.partial = !isInCache;
    let hasMore: boolean = true;
    fieldInfos.forEach((field) => {
      const key = cache.resolveFieldByKey(entityKey, field.fieldKey) as string;
      const data = cache.resolve(key, "posts") as string[];
      if (!!!cache.resolve(key, "hasMore")) {
        hasMore = false;
      }
      results.push(...data);
    });
    return {
      __typename: "PaginatedPosts",
      hasMore,
      posts: results,
    };
  };
};

export const urqlClient = (ssrExchange: any, ctx: any) => {
  let cookie = "";
  if (isServer()) {
    cookie = ctx?.req?.headers?.cookie;
  }
  return {
    url: "http://localhost:4000/graphql",
    fetchOptions: {
      credentials: "include" as const, // get the cookie
      headers: cookie ? { cookie } : undefined,
    },
    exchanges: [
      dedupExchange,
      multipartFetchExchange,
      cacheExchange({
        keys: {
          PaginatedPosts: () => null,
        },
        resolvers: {
          Query: {
            posts: cursorPagination(),
          },
        },
        updates: {
          Mutation: {
            updatePost: (_result, args, cache, _info) => {
              cache.invalidate({
                __typename: "Post",
                id: (args as UpdatePostMutationVariables).id,
              });
            },
            deletePost: (_result, args, cache, _info) => {
              cache.invalidate({
                __typename: "Post",
                id: (args as DeletePostMutationVariables).id,
              });
            },
            vote: (result, args, cache, _info) => {
              const { postId, value } = args as VoteMutationVariables;
              const data = cache.readFragment(
                gql`
                  fragment _ on Post {
                    id
                    votes
                    voteStatus
                  }
                `,
                { id: postId } as any
              );

              if (data) {
                const votingHandler = (storedValue: number) => {
                  const isNull = () => storedValue === null;
                  const reVotingSame = () => storedValue === value;
                  const changingVote = () => storedValue !== value;

                  if (isNull()) {
                    return value;
                  } else if (reVotingSame()) {
                    return result.vote ? value : value === -1 ? 1 : -1;
                  } else if (changingVote()) {
                    return !result.vote ? 1 * value : 2 * value;
                  }

                  return value;
                };

                const newPoints =
                  (data.votes as number) +
                  votingHandler(data.voteStatus as number);
                cache.writeFragment(
                  gql`
                    fragment __ on Post {
                      votes
                      voteStatus
                    }
                  `,
                  { id: postId, votes: newPoints, voteStatus: value } as any
                );
              }
            },
            createPost: (_results, _args, cache, _info) => {
              invalidateAllPosts(cache);
            },
            logout: (results, _args, cache, _info) => {
              updateQuery<LogoutMutation, MeQuery>(
                cache,
                { query: MeDocument },
                results,
                () => ({ me: null })
              );
            },
            login: (results, _args, cache, _info) => {
              updateQuery<LoginMutation, MeQuery>(
                cache,
                { query: MeDocument },
                results,
                (result, query) => {
                  if (result.login.errors) {
                    return query;
                  } else {
                    return {
                      me: result.login.user,
                    };
                  }
                }
              );
              invalidateAllPosts(cache);
            },
            register: (_result, _args, cache, _info) => {
              updateQuery<RegisterMutation, MeQuery>(
                cache,
                { query: MeDocument },
                _result,
                (result, query) => {
                  if (result.register.errors) {
                    return query;
                  } else {
                    return {
                      me: result.register.user,
                    };
                  }
                }
              );
            },
          },
        },
      }),
      errorExchange,
      ssrExchange,
      fetchExchange,
    ],
  };
};
