import { assertEquals } from "@std/assert";
import { test } from "@cross/test";
import { getEnv } from "./mod.ts";

/**
 * Part of the test.
 * simulating using the auto .env-load as it would have been with
 * import "@cross/env/load";
 */
import "./load.ts";

test("Using import @cross/env/load", () => {
    const value = getEnv("TEST_VALUE");
    assertEquals(value, "1");
});
