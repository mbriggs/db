import assert from "assert";
import { data, exec } from "@mbriggs/db/controls";
import * as context from "@mbriggs/context";

describe("Session", () => {
  it("Queries data", async () => {
    let ctx = context.background();
    let query = data.query();
    let control = data.example();

    let db = await exec();
    let results = await db(ctx, query, []);

    assert(results.length == 1, "one result");

    let result = results[0];

    assert.strict.deepEqual(result, control, "retrieves data");
  });
});
