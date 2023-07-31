import { ApolloServer } from "@apollo/server"
import { expressMiddleware } from "@apollo/server/express4"
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer"
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default"
import { makeExecutableSchema } from "@graphql-tools/schema"
import cookie from "cookie"
import cookieParser from "cookie-parser"
import express from "express"
import { readFile } from "fs/promises"
import { RedisPubSub } from "graphql-redis-subscriptions"
import { useServer } from "graphql-ws/lib/use/ws"
import { createServer } from "http"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { WebSocketServer } from "ws"
import { SQLiteDataSource } from "./datasource.js"
import { initDB } from "./db.js"
import { jwt } from "./jwt.js"
import { resolvers } from "./resolvers.js"
import helmet from "helmet"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = 3000

const database = initDB(join(__dirname, "..", "pooly.db"))
const pubsub = new RedisPubSub({
  connection: {
    host: "localhost",
    port: 6379,
  },
})

const typeDefs = await readFile(join(__dirname, "schema.graphql"), {
  encoding: "utf-8",
})
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})

const app = express()
app.use(
  express.json(),
  cookieParser(),
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "development" ? false : undefined,
  })
)

const httpServer = createServer(app)

// Set up WebSocket server.
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
})
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

// Set up ApolloServer.
const server = new ApolloServer({
  schema,
  plugins: [
    process.env.NODE_ENV === "development"
      ? ApolloServerPluginLandingPageLocalDefault({
          footer: false,
          includeCookies: true,
        })
      : ApolloServerPluginLandingPageProductionDefault({
          footer: false,
          includeCookies: true,
        }),

    // Proper shutdown for the HTTP server.
    ApolloServerPluginDrainHttpServer({ httpServer }),

    // Proper shutdown for the WebSocket server.
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

await server.start()
app.use(
  "/graphql",
  expressMiddleware(server, {
    context: async ({ req, res }) => {
      const tokenCookie = req.cookies.token

      if (process.env.NODE_ENV === "development") {
        res.setHeader(
          "Access-Control-Allow-Origin",
          "https://sandbox.embed.apollographql.com"
        )
        res.setHeader("Access-Control-Allow-Credentials", "true")
      }

      return {
        token: tokenCookie ? { payload: jwt.verifyToken(tokenCookie) } : null,
        dataSources: {
          sqlite: new SQLiteDataSource({ database }),
        },
        pubsub,
        res,
      }
    },
  })
)

httpServer.listen(PORT, () => {
  console.log(`Query endpoint ready at http://localhost:${PORT}/graphql`)
  console.log(`Subscription endpoint ready at ws://localhost:${PORT}/graphql`)
})
