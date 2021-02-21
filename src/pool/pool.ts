import "pg-native";
import pg from "pg";
import * as context from "@mbriggs/context";
import debug from "debug";
import { partial } from "lodash";

import type { Query } from "../interfaces";
import * as metadata from "../metadata";

const log = debug("db:pool");
const logData = debug("db:pool:data");

export async function connect(connectionString: string) {
  let pool = new pg.native.Pool({ connectionString });

  pool.on("connect", async (client) => {
    await metadata.configure(client, async (fn) => {
      let c = await pool.connect();
      await fn(c);
      c.release();
    });

    client.on("notice", (msg) => log("notice: %s", msg));
    client.on("error", (err) => {
      log("error: %O", err.stack);
      throw err;
    });
  });

  log("pool established for %s", connectionString);

  return pool;
}

export async function query(
  pool: pg.Pool,
  ctx: context.Context,
  queryText: string,
  values: any[]
): Promise<any[]> {
  let client = await pool.connect();

  let [result, cancelled] = await context.runAsync(ctx, run(client, ctx, queryText, values));
  if (cancelled) {
    log("query cancelled early");
    await metadata.cancelQuery(client);
    client.release();
    log("done cancelling query");
    return null;
  }

  client.release();

  return result;
}

export async function run(
  client: pg.PoolClient,
  ctx: context.Context,
  queryText: string,
  values: any[]
): Promise<any[]> {
  await metadata.assurePID(client);
  let result = await client.query(queryText, values);

  log(`query executed, results: %n`, result.rowCount);
  logData(`query: %s, values: %o, results: %O`, queryText, values, result.rows);

  return result.rows;
}

export async function tx(
  pool: pg.Pool,
  ctx: context.Context,
  fn: (query: Query) => Promise<any[]>
): Promise<any[]> {
  let client = await pool.connect();
  let query: Query = partial(run, client);

  await client.query("BEGIN");

  let result, cancelled;
  try {
    [result, cancelled] = await context.runAsync(ctx, fn(query));
  } catch (e) {
    log("error occurred %O", e);
    await metadata.cancelQuery(client);
    await client.query("ROLLBACK");
    client.release();
    return null;
  }

  if (cancelled) {
    log("query cancelled early");
    await metadata.cancelQuery(client);
    await client.query("ROLLBACK");
    client.release();
    return null;
  }

  await client.query("COMMIT");
  client.release();

  return result;
}
