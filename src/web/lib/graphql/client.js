import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from "@apollo/client/core"
import { GraphQLWsLink } from "@apollo/client/link/subscriptions"
import { createClient } from "graphql-ws"
import { getOperationAST } from "graphql/utilities"

const link = ApolloLink.split(
  (op) => {
    // check if it is a subscription
    const operationAST = getOperationAST(op.query, op.operationName)
    return !!operationAST && operationAST.operation === "subscription"
  },
  new GraphQLWsLink(
    createClient({
      url: "ws://localhost:3000/graphql",
    })
  ),
  new HttpLink({
    uri: "http://localhost:3000/graphql",
  })
)

const client = new ApolloClient({
  cache: new InMemoryCache(),
  credentials: "same-origin",
  link,
})

export default client
