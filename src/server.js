import { makeExecutableSchema } from "@graphql-tools/schema"
import cookieParser from "cookie-parser"
import "dotenv/config"
import express from "express"
import { RedisPubSub } from "graphql-redis-subscriptions"
import helmet from "helmet"
import { readFile } from "node:fs/promises"
import { createServer } from "node:http"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createServer as createViteServer, resolveConfig } from "vite"
import { WebSocketServer } from "ws"
import viteConfig from "../vite.config.js"
import { SQLiteDataSource } from "./datasource.js"
import { createApolloServer } from "./lib/apollo/server.js"
import { initDB } from "./lib/db.js"
import { resolvers } from "./resolvers.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const isDev = process.env.NODE_ENV === "development"
const HOST = process.env.HOST || "localhost"
const PORT = 3000

const database = initDB(
  isDev ? join(__dirname, "..", "polly.db") : process.env.DATABASE
)
const pubsub = new RedisPubSub({
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: +process.env.REDIS_PORT || 6379,
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
    contentSecurityPolicy: isDev ? false : undefined,
  })
)

const httpServer = createServer(app)
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/graphql",
})

const { server, expressMiddleware } = await createApolloServer({
  schema,
  httpServer,
  wsServer,
  deps: {
    pubsub,
    sqlite: new SQLiteDataSource({ database }),
  },
})

// apollo load schema, and apply plugins
await server.start()

app.use("/graphql", expressMiddleware())

// front-end
if (isDev) {
  const vite = await createViteServer({
    ...viteConfig,
    server: { middlewareMode: true },
  })

  app.use(vite.middlewares)
} else {
  const buildConfig = await resolveConfig(viteConfig, "build")
  const dist = buildConfig.build.outDir

  app.use(express.static(dist))
  app.use("*", (_, res) => {
    res.sendFile(join(dist, "index.html"))
  })
}

httpServer.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`)
})
