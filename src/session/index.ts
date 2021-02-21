export * from "./session";
export * from "../interfaces";

import * as db from "./session";
import type { Exec } from "../interfaces";
import { partial } from "lodash";

export async function build(connectionString: string): Promise<Exec> {
  let pool = await db.connect(connectionString);

  let exec: Exec = partial(db.query, pool) as any;
  exec.tx = partial(db.tx, pool);

  return exec;
}
