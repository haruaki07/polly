import SQLite3 from "better-sqlite3"

export function initDB(file) {
  const db = new SQLite3(file, {
    verbose: (msg) => console.log(`[sqlite] ${msg}`),
  })

  db.exec(/* sql */ `
    CREATE TABLE IF NOT EXISTS events (
      code VARCHAR(10) UNIQUE
    );

    CREATE TABLE IF NOT EXISTS questions (
      content VARCHAR(255) NOT NULL,
      username VARCHAR(20),
      upvotes INTEGER DEFAULT(0),
      event_code VARCHAR(10) NOT NULL,
      created_at DATETIME NOT NULL
    )
  `)

  return db
}
