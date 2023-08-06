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
    const stmt = this.#db.prepare(
      `INSERT INTO questions (content, username, event_code, user_uuid, created_at)
       VALUES (?, ?, ?, ?, ?)
       RETURNING rowid AS id, *`
    )
    return stmt.get(
      content,
      username,
      event_code,
      user_uuid,
      new Date().toISOString()
    )
  }

  findEventQuestions(eventCode) {
    const stmt = this.#db.prepare(
      `SELECT rowid AS id, content, username, upvotes, created_at, user_uuid
       FROM questions 
       WHERE event_code=?`
    )
    return stmt.all(eventCode)
  }

  incrQuestionUpvote(id) {
    const stmt = this.#db.prepare(
      `UPDATE questions SET upvotes = upvotes + 1 
       WHERE rowid = ? 
       RETURNING upvotes`
    )
    return stmt.get(id)
  }

  findQuestionOwner(id) {
    const stmt = this.#db.prepare(
      `SELECT rowid, user_uuid FROM questions WHERE rowid = ?`
    )
    return stmt.get(id)
  }

  deleteQuestion(id) {
    const stmt = this.#db.prepare(
      `DELETE FROM questions WHERE rowid = ? RETURNING rowid as id`
    )
    return stmt.get(id)
  }
}
