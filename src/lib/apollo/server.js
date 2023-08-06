import { ApolloServer } from "@apollo/server"
import { expressMiddleware as _expressMiddleware } from "@apollo/server/express4"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default"
import cookie from "cookie"
import { useServer } from "graphql-ws/lib/use/ws"
import { jwt } from "../jwt.js"

/**
 *
 * @param {{
 *   schema: import("graphql").GraphQLSchema,
 *   httpServer: import("http").Server,
 *   wsServer: import("ws").WebSocketServer,
 *   deps: {
 *     pubsub: import("graphql-subscriptions").PubSubEngine,
 *     sqlite: import('../../datasource.js').SQLiteDataSource
 *   }
 * }} param0
 * @returns
 */
export async function createApolloServer({
  schema,
  httpServer,
  wsServer,
  deps: { pubsub, sqlite },
}) {
  const isDev = process.env.NODE_ENV === "development"

  // setup graphql endpoint on websocket server
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        const cookies = cookie.parse(ctx.extra.request.headers.cookie)

        return {
          pubsub,
          token: cookies.token
            ? { payload: jwt.verifyToken(cookies.token) }
            : null,
        }
      },
    },
    wsServer
  )

  const server = new ApolloServer({
    schema,
    plugins: [
      isDev
        ? ApolloServerPluginLandingPageLocalDefault({
            footer: false,
            includeCookies: true,
          })
        : ApolloServerPluginLandingPageProductionDefault({
            footer: false,
            includeCookies: true,
          }),

      // proper shutdown for the HTTP server.
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // proper shutdown for the WebSocket server.
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose()
            },
          }
        },
      },
    ],
  })

  const expressMiddleware = () =>
    _expressMiddleware(server, {
      context: async ({ req, res }) => {
        const tokenCookie = req.cookies.token

        if (isDev) {
          res.setHeader(
            "Access-Control-Allow-Origin",
            "https://sandbox.embed.apollographql.com"
          )
          res.setHeader("Access-Control-Allow-Credentials", "true")
        }

        return {
          token: tokenCookie ? { payload: jwt.verifyToken(tokenCookie) } : null,
          dataSources: { sqlite },
          pubsub,
          res,
        }
      },
    })

  return {
    server,
    expressMiddleware,
  }
}
