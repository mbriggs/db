import assert from "assert";
import { execPool, longQuery } from "@mbriggs/db/controls";
import * as context from "@mbriggs/context";

describe("Pool", () => {
  it("Cancels queries", async () => {
    let ctx = context.background();
    let query = longQuery();

    let db = await execPool();
    setTimeout(ctx.cancel, 0);

    let results = await db(ctx, query, []);

    assert(results === null, "no results given");
  });
});
