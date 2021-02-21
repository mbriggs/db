import * as session from "./session";
import * as pool from "./pool";
import * as context from "@mbriggs/context";

export function url() {
  let url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL not set");
  }

  return url;
}

export async function exec() {
  return await session.build(url());
}

export async function execPool() {
  return await pool.build(url());
}

export function results() {
  return "results";
}

export function query() {
  return "SELECT 'results' as out;";
}

export function longQuery() {
  return "SELECT pg_sleep(60 * 60);";
}

export async function isQueryCancelled() {
  let ctx = context.background();
  let db = await exec();
  let query = `
  SELECT pid, query
  FROM pg_stat_activity
  WHERE query = 'SELECT pg_sleep(60 * 60);';
  `;

  let results = await db(ctx, query, []);
  if (results.length === 0) {
    return false;
  }

  for (let result of results) {
    let pid = result.pid;
    await db(ctx, `SELECT pg_cancel_backend($1)`, [pid]);
  }

  return true;
}

export const data = {
  example() {
    return {
      id: this.id(),
      text: this.text(),
      json: this.json(),
      list: this.list(),
    };
  },

  id() {
    return "a8d2c963-a38d-459c-8bc8-2bfeac70fb1b";
  },

  text() {
    return "some text";
  },

  json() {
    return { test: "json" };
  },

  list() {
    return ["one", "two", "three"];
  },

  query() {
    return `
    SELECT *
    FROM test_data
    WHERE id = '${this.id()}'
    `;
  },
};

export const otherData = {
  example() {
    return {
      id: this.id(),
      text: this.text(),
      json: this.json(),
      list: this.list(),
    };
  },

  id() {
    return "5a438546-c026-43c5-ab3f-98ec503e7ae2";
  },

  text() {
    return "some other text";
  },

  json() {
    return { test2: "json" };
  },

  list() {
    return ["three", "two", "one"];
  },

  query() {
    return `
    SELECT *
    FROM test_data
    WHERE id = '${this.id()}'
    `;
  },
};
