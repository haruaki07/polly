// @ts-nocheck

import SQLite3 from "better-sqlite3"

/**
 *
 * @param {*} file
 * @returns {import("better-sqlite3").Database}
 */
export function initDB(file) {
  const db = new SQLite3(file, {
    verbose: (msg) => console.log(`[sqlite] ${msg}`),
  })

  db.exec(/* sql */ `
    CREATE TABLE IF NOT EXISTS events (
      code VARCHAR(10) UNIQUE,
      name VARCHAR(100) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS questions (
      content VARCHAR(255) NOT NULL,
      username VARCHAR(20),
      upvotes INTEGER DEFAULT(0),
      event_code VARCHAR(10) NOT NULL,
      created_at DATETIME NOT NULL,
      user_uuid VARCHAR(50)
    )
  `)

  return db
}
