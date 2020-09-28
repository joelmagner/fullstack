import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
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
            vote: (_result, args, cache, info) => {
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
                console.log("votestatus", data.voteStatus, "val", value);

                //if user is reVoting on the same value, remove it.
                // const checkUnVote = (votePassed: boolean) => {
                //   return votePassed ? value : value === -1 ? 1 : -1;
                // };
                // const newPoints =
                //   (data.votes as number) + checkUnVote(result.vote as boolean);

                const hasAlreadyVoted = (storedValue: number) => {
                  const isNull = () => storedValue === null;
                  const reVotingSame = () => storedValue === value;
                  const changingVote = () => storedValue !== value;

                  console.log("VOTE STATUS", _result.vote);

                  if (isNull()) {
                    console.log("isNull");
                    return value;
                  }

                  if (reVotingSame()) {
                    return _result.vote ? value : value === -1 ? 1 : -1;
                  }

                  if (changingVote()) {
                    console.log("changingVote", _result.vote);
                    return !_result.vote ? 1 * value : 2 * value;
                  }

                  return value;

                  //return votePassed ? value : value === -1 ? 1 : -1;
                };

                const newPoints =
                  (data.votes as number) +
                  hasAlreadyVoted(data.voteStatus as number);
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
              const allFields = cache.inspectFields("Query");
              const fieldInfos = allFields.filter(
                (info) => info.fieldName === "posts"
              );

              //force reload of data
              fieldInfos.forEach((field) => {
                cache.invalidate("Query", "posts", field.arguments || {});
              });
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
