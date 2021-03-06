import assert from "assert";
import { exec, longQuery } from "@mbriggs/db/controls";
import * as context from "@mbriggs/context";

describe("Session", () => {
  it("Cancels queries", async () => {
    let ctx = context.background();
    let query = longQuery();

    let db = await exec();
    setTimeout(ctx.cancel, 0);

    let results = await db(ctx, query, []);

    assert(results === null, "no results given");
  });
});
