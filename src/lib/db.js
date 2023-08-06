// @ts-nocheck

import SQLite3 from "better-sqlite3"
import dedent from "dedent"

/**
 *
 * @param {*} file
 * @returns {import("better-sqlite3").Database}
 */
export function initDB(file) {
  const db = new SQLite3(file, {
    verbose: (msg) => {
      if (process.env.NODE_ENV === "development") {
        console.log(`/* sqlite */\n${dedent(msg)}\n`)
      }
    },
  })

  db.exec(/* sql */ `
    CREATE TABLE IF NOT EXISTS events (
      code VARCHAR(10) UNIQUE,
      name VARCHAR(100) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      id VARCHAR(50) PRIMARY KEY,
      content VARCHAR(255) NOT NULL,
      username VARCHAR(20),
      event_code VARCHAR(10) NOT NULL,
      created_at DATETIME NOT NULL,
      user_uuid VARCHAR(50)
    );

    CREATE TABLE IF NOT EXISTS question_upvotes (
      question_id VARCHAR(50) NOT NULL,
      user_uuid VARCHAR(50) NOT NULL,
      FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE
    );
  `)

  return db
}
