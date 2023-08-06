import { randomUUID } from "node:crypto"
import Dataloader from "dataloader"

export class SQLiteDataSource {
  #db

  /**
   *
   * @param {{
   *   database: import("better-sqlite3").Database
   * }} param0
   */
  constructor({ database }) {
    this.#db = database
  }

  findEvents() {
    const stmt = this.#db.prepare("SELECT code, name FROM events")
    return stmt.all()
  }

  findEventByCode(code) {
    const stmt = this.#db.prepare(
      "SELECT code, name FROM events WHERE code = ?"
    )
    return stmt.get(code)
  }

  createEvent({ name }) {
    const code = Math.random().toString().slice(2, 8)
    const stmt = this.#db.prepare(
      "INSERT INTO events (code, name) VALUES (?, ?) RETURNING code, name"
    )
    return stmt.get(code, name)
  }

  createQuestion({ content, username, user_uuid, event_code }) {
    const id = randomUUID()
    const stmt = this.#db.prepare(
      `INSERT INTO questions (id, content, username, event_code, user_uuid, created_at)
       VALUES (?, ?, ?, ?, ?, ?)
       RETURNING *`
    )
    return stmt.get(
      id,
      content,
      username,
      event_code,
      user_uuid,
      new Date().toISOString()
    )
  }

  findEventQuestions(eventCode) {
    const stmt = this.#db.prepare(
      `SELECT id, content, username, created_at, user_uuid
       FROM questions 
       WHERE event_code=?`
    )
    return stmt.all(eventCode)
  }

  findQuestionUpvoteByUserId = new Dataloader(
    async (keys) => {
      const rows = this.#db
        .prepare(
          `SELECT question_id
         FROM question_upvotes 
         WHERE question_id IN (${keys.map(() => "?").join(",")}) 
         AND user_uuid = ?`
        )
        .all(
          keys.map((k) => k.questionId),
          keys[0].userId
        )

      // dataloader need to return array order same as keys order
      const map = rows.reduce(
        /** @param {any} r */
        (c, r) => {
          c[r.question_id] = r
          return c
        },
        {}
      )

      return keys.map((k) => map[k.questionId])
    },
    { cache: false }
  )

  countQuestionUpvotes = new Dataloader(
    async (ids) => {
      const rows = this.#db
        .prepare(
          `SELECT question_id, COUNT(question_id) as upvotes
         FROM question_upvotes
         WHERE question_id IN (${ids.map(() => "?").join(",")})`
        )
        .all(ids)

      // dataloader need to return array order same as keys order
      const map = rows.reduce(
        /** @param {any} r */
        (c, r) => {
          c[r.question_id] = r
          return c
        },
        {}
      )

      return ids.map((id) => map[id] ?? { question_id: id, upvotes: 0 })
    },
    { cache: false }
  )

  incrQuestionUpvote(questionId, user_uuid) {
    const stmt = this.#db.prepare(
      `INSERT INTO question_upvotes (question_id, user_uuid)
       VALUES (:qid, :uid)
       RETURNING (
         SELECT COUNT(question_id)
         FROM question_upvotes 
         WHERE question_id=:qid
       ) as upvotes`
    )

    return stmt.get({ qid: questionId, uid: user_uuid })
  }

  decrQuestionUpvote(questionId, user_uuid) {
    const stmt = this.#db.prepare(
      `DELETE FROM question_upvotes
       WHERE question_id=:qid AND user_uuid=:uid
       RETURNING (
         SELECT COUNT(question_id)
         FROM question_upvotes 
         WHERE question_id=:qid
       ) as upvotes`
    )

    return stmt.get({ qid: questionId, uid: user_uuid })
  }

  findQuestionOwner(id) {
    const stmt = this.#db.prepare(
      `SELECT id, user_uuid FROM questions WHERE id = ?`
    )
    return stmt.get(id)
  }

  deleteQuestion(id) {
    const stmt = this.#db.prepare(
      `DELETE FROM questions WHERE id = ? RETURNING id`
    )
    return stmt.get(id)
  }
}
