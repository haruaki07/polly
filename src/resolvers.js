import { GraphQLError } from "graphql"
import { withFilter } from "graphql-subscriptions"
import { randomUUID } from "node:crypto"
import { jwt } from "./lib/jwt.js"

class AuthenticationError extends GraphQLError {
  constructor() {
    super("You are not authorized to access this resource.", {
      extensions: { code: "UNAUTHORIZED" },
    })
  }
}

export const resolvers = {
  Query: {
    events: (_, __, { dataSources }) => {
      return dataSources.sqlite.findEvents()
    },
    event: (_, { code }, { dataSources, token }) => {
      if (!token || token.payload.event_code !== code)
        throw new AuthenticationError()
      return dataSources.sqlite.findEventByCode(code)
    },
  },
  Mutation: {
    createEvent: (_, { input: { name } }, { dataSources, res }) => {
      const event = dataSources.sqlite.createEvent({ name })

      const token = jwt.createToken({
        event_code: event.code,
        admin: true,
        uuid: randomUUID(),
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

        const token = jwt.createToken({
          event_code: event.code,
          uuid: randomUUID(),
        })
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
        user_uuid: token.payload.uuid,
      })

      pubsub.publish("EVENT_NEW_QUESTION", { eventNewQuestion: q })

      return q
    },
    upvoteQuestion: async (
      _,
      { input: { id } },
      { dataSources, pubsub, token }
    ) => {
      if (!token) throw new AuthenticationError()

      const question = await dataSources.sqlite.findQuestionUpvoteByUserId.load(
        {
          questionId: id,
          userId: token.payload.uuid,
        }
      )
      if (question)
        throw new GraphQLError("Cannot upvote same question multiple times", {
          extensions: { code: "BAD_USER_INPUT" },
        })

      const { upvotes } = dataSources.sqlite.incrQuestionUpvote(
        id,
        token.payload.uuid
      )

      pubsub.publish("QUESTION_UPVOTES_UPDATE", {
        event_code: token.payload.event_code,
        eventQuestionsUpvote: {
          question_id: id,
          upvotes,
        },
      })

      return upvotes
    },
    undoUpvoteQuestion: async (
      _,
      { input: { id } },
      { dataSources, pubsub, token }
    ) => {
      if (!token) throw new AuthenticationError()

      const question = await dataSources.sqlite.findQuestionUpvoteByUserId.load(
        {
          questionId: id,
          userId: token.payload.uuid,
        }
      )
      if (!question)
        throw new GraphQLError("Not upvoted yet", {
          extensions: { code: "BAD_USER_INPUT" },
        })

      const { upvotes } = dataSources.sqlite.decrQuestionUpvote(
        id,
        token.payload.uuid
      )

      pubsub.publish("QUESTION_UPVOTES_UPDATE", {
        event_code: token.payload.event_code,
        eventQuestionsUpvote: {
          question_id: id,
          upvotes,
        },
      })

      return upvotes
    },
    deleteQuestion: (_, { input: { id } }, { dataSources, pubsub, token }) => {
      try {
        if (!token) throw new AuthenticationError()

        const question = dataSources.sqlite.findQuestionOwner(id)
        if (!question)
          throw new GraphQLError("Question not found", {
            extensions: { code: "BAD_USER_INPUT" },
          })

        if (question.user_uuid !== token.payload.uuid)
          throw new AuthenticationError()

        dataSources.sqlite.deleteQuestion(id)

        pubsub.publish("EVENT_DELETE_QUESTION", {
          event_code: token.payload.event_code,
          eventDeleteQuestion: id,
        })

        return { success: true, message: "success" }
      } catch (e) {
        return { success: false, message: e.message }
      }
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
    eventDeleteQuestion: {
      subscribe: withFilter(
        (_, __, { pubsub, token }) => {
          if (!token) new AuthenticationError()
          return pubsub.asyncIterator("EVENT_DELETE_QUESTION")
        },
        (payload, _, { token }) => {
          return payload.event_code === token.payload.event_code
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
  Question: {
    owner: ({ user_uuid }, _, { token }) => {
      return user_uuid === token.payload.uuid
    },
    upvotes: async ({ id }, _, { dataSources }) => {
      const row = await dataSources.sqlite.countQuestionUpvotes.load(id)

      return row.upvotes
    },
    canUpvote: async ({ id }, _, { dataSources, token }) => {
      const exist = await dataSources.sqlite.findQuestionUpvoteByUserId.load({
        questionId: id,
        userId: token.payload.uuid,
      })

      return !exist
    },
  },
}
