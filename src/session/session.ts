import pg from "pg";
import * as context from "@mbriggs/context";
import debug from "debug";
import { partial } from "lodash";

import * as metadata from "../metadata";
import type { Query } from "../interfaces";

const log = debug("db:session");
const logData = debug("db:session:data");

export async function connect(connectionString: string) {
  let client = new pg.native.Client(connectionString);
  await client.connect();

  await metadata.configure(client, async (fn) => {
    let client = new pg.native.Client(connectionString);
    await client.connect();
    await fn(client);
    await client.end();
  });

  client.on("notice", (msg) => log("notice: %s", msg));
  client.on("error", (err) => {
    log("error: %O", err.stack);
    throw err;
  });

  log("connection established for %s", connectionString);

  return client;
}

export async function query(
  client: pg.Client,
  ctx: context.Context,
  queryText: string,
  values: any[]
): Promise<any[]> {
  let [result, cancelled] = await context.runAsync(ctx, run(client, ctx, queryText, values));
  if (cancelled) {
    await metadata.cancelQuery(client);
    log("query cancelled early, client closed");
    return null;
  }

  return result;
}

export async function run(
  client: pg.Client,
  ctx: context.Context,
  queryText: string,
  values: any[]
): Promise<any[]> {
  let result = await client.query(queryText, values);

  log(`query executed, results: %n`, result.rowCount);
  logData(`query: %s, values: %o, results: %O`, queryText, values, result.rows);

  return result.rows || [];
}

export async function tx(
  client: pg.Client,
  ctx: context.Context,
  fn: (query: Query) => Promise<any[]>
): Promise<any[]> {
  let query: Query = partial(run, client);

  await client.query("BEGIN");

  let result, cancelled;
  try {
    [result, cancelled] = await context.runAsync(ctx, fn(query));
  } catch (e) {
    await metadata.cancelQuery(client);
    await client.query("ROLLBACK");
    return null;
  }

  if (cancelled) {
    log("query cancelled early");
    await client.query("ROLLBACK");
    return null;
  }

  await client.query("COMMIT");

  return result;
}
