import { withFilter } from "graphql-subscriptions"
import { jwt } from "./lib/jwt.js"
import { GraphQLError, valueFromASTUntyped } from "graphql"

class AuthenticationError extends GraphQLError {
  constructor() {
    super("You are not authorized to access this resource.", {
      extensions: { code: "UNAUTHENTICATED" },
    })
  }
}

export const resolvers = {
  Query: {
    events: (_, __, { dataSources }) => {
      return dataSources.sqlite.findEvents()
    },
    event: (_, { code }, { dataSources, token }) => {
      if (!token) throw new AuthenticationError()
      return dataSources.sqlite.findEventByCode(code)
    },
  },
  Mutation: {
    createEvent: (_, __, { dataSources, res }) => {
      const event = dataSources.sqlite.createEvent()

      const token = jwt.createToken({
        event_code: event.code,
        admin: true,
      })
      res.cookie(
        "token",
        token,
        process.env.NODE_ENV === "development"
          ? { sameSite: "None", secure: true }
          : {}
      )

      return event
    },
    joinEvent: (_, { code }, { dataSources, res }) => {
      try {
        const event = dataSources.sqlite.findEventByCode(code)
        if (!event)
          throw new GraphQLError("Event not found", {
            extensions: { code: "BAD_USER_INPUT" },
          })

        const token = jwt.createToken({ event_code: event.code })
        res.cookie(
          "token",
          token,
          process.env.NODE_ENV === "development"
            ? { sameSite: "None", secure: true }
            : {}
        )

        return {
          success: true,
          token,
        }
      } catch (e) {
        return {
          success: false,
          message: e.message,
          token: null,
        }
      }
    },
    createQuestion: (
      _,
      { input: { content, username } },
      { dataSources, pubsub, token }
    ) => {
      if (!token) throw new AuthenticationError()

      const q = dataSources.sqlite.createQuestion({
        content,
        username,
        event_code: token.payload.event_code,
      })

      pubsub.publish("EVENT_NEW_QUESTION", { eventNewQuestion: q })

      return q
    },
    upvoteQuestion: (_, { input: { id } }, { dataSources, pubsub, token }) => {
      if (!token) throw new AuthenticationError()

      const { upvotes } = dataSources.sqlite.incrQuestionUpvote(id)

      pubsub.publish("QUESTION_UPVOTES_UPDATE", {
        event_code: token.payload.event_code,
        eventQuestionsUpvote: {
          question_id: id,
          upvotes,
        },
      })

      return upvotes
    },
  },
  Subscription: {
    eventNewQuestion: {
      subscribe: withFilter(
        (_, __, { pubsub, token }) => {
          if (!token) new AuthenticationError()
          return pubsub.asyncIterator("EVENT_NEW_QUESTION")
        },
        (payload, _, { token }) => {
          return (
            payload.eventNewQuestion.event_code === token.payload.event_code
          )
        }
      ),
    },
    eventQuestionsUpvote: {
      subscribe: withFilter(
        (_, __, { pubsub, token }) => {
          if (!token) new AuthenticationError()
          return pubsub.asyncIterator("QUESTION_UPVOTES_UPDATE")
        },
        (payload, _, { token }) => {
          return payload.event_code === token.payload.event_code
        }
      ),
    },
  },
  Event: {
    questions: ({ code }, _, { dataSources }) => {
      return dataSources.sqlite.findEventQuestions(code)
    },
  },
}
