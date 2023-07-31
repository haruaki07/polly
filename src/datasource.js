export class SQLiteDataSource {
  /**
   *
   * @param {{
   *   database: import("better-sqlite3").Database
   * }} param0
   */
  constructor({ database }) {
    this.db = database
  }

  findEvents() {
    const stmt = this.db.prepare("SELECT code FROM events")
    return stmt.all()
  }

  findEventByCode(code) {
    const stmt = this.db.prepare("SELECT code FROM events WHERE code = ?")
    return stmt.get(code)
  }

  createEvent() {
    const code = Math.random().toString().slice(2, 8)
    const stmt = this.db.prepare(
      "INSERT INTO events (code) VALUES (?) RETURNING code"
    )
    return stmt.get(code)
  }

  createQuestion({ content, username, event_code }) {
    const stmt = this.db.prepare(
      `INSERT INTO questions (content, username, event_code, created_at)
       VALUES (?, ?, ?, ?)
       RETURNING rowid AS id, *`
    )
    return stmt.get(content, username, event_code, new Date().toISOString())
  }

  findEventQuestions(eventCode) {
    const stmt = this.db.prepare(
      `SELECT rowid AS id, content, username, upvotes, created_at
       FROM questions 
       WHERE event_code=?`
    )
    return stmt.all(eventCode)
  }

  incrQuestionUpvote(id) {
    const stmt = this.db.prepare(
      `UPDATE questions SET upvotes = upvotes + 1 
       WHERE rowid = ? 
       RETURNING upvotes`
    )
    return stmt.get(id)
  }
}
