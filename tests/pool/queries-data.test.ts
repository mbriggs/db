import assert from "assert";
import { data, execPool } from "@mbriggs/db/controls";
import * as context from "@mbriggs/context";

describe("Pool", () => {
  it("Queries data", async () => {
    let ctx = context.background();
    let query = data.query();
    let control = data.example();

    let db = await execPool();
    let results = await db(ctx, query, []);

    assert(results.length == 1, "one result");

    let result = results[0];

    assert.strict.deepEqual(result, control, "retrieves data");
  });
});
