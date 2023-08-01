import cookieParser from "cookie-parser"
import express from "express"
import { RedisPubSub } from "graphql-redis-subscriptions"
import helmet from "helmet"
import { createServer } from "node:http"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { createServer as createViteServer, resolveConfig } from "vite"
import { WebSocketServer } from "ws"
import viteConfig from "../vite.config.js"
import { SQLiteDataSource } from "./datasource.js"
import { createApolloServer } from "./lib/apollo/server.js"
import { initDB } from "./lib/db.js"

global.__dirname = dirname(fileURLToPath(import.meta.url))
const isDev = process.env.NODE_ENV === "development"
const PORT = 3000

const database = initDB(join(__dirname, "..", "pooly.db"))
const pubsub = new RedisPubSub({
  connection: {
    host: "localhost",
    port: 6379,
  },
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
  httpServer,
  wsServer,
  deps: {
    pubsub,
    sqlite: new SQLiteDataSource({ database }),
  },
})

// apollo load schema, and apply plugins
await server.start()

app.use("/graphql", expressMiddleware)

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

httpServer.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`)
})
