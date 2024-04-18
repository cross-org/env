import { assert, assertEquals, assertThrows } from "@std/assert";
import { ValidationError } from "./lib/helpers.ts";
import { getAllEnv, getEnv, hasEnv, requireEnv, setEnv, setupEnv, validateAndGetEnv, validateEnv } from "./mod.ts";
import type { ValidatorFunction } from "./mod.ts";
import { test } from "@cross/test";

/** ==== getEnv() ==== */
test("getEnv() retrieves an existing environment variable", () => {
    setEnv("TEST_VARIABLE", "hello");

    const value = getEnv("TEST_VARIABLE");
    assertEquals(value, "hello");
});

test("getEnv() undefined for nonexistant keys", () => {
    const result = getEnv("TEST_KEY_NONEXISTANT");
    assertEquals(result, undefined);
});

/** ==== requireEnv() ==== */
test("requireEnv() retrieves an existing environment variable", () => {
    setEnv("TEST_VARIABLE_2", "hello");

    const value = requireEnv("TEST_VARIABLE_2");
    assertEquals(value, "hello");
});

test("requireEnv() throws for nonexistant keys", () => {
    assertThrows(() => requireEnv("TEST_KEY_NONEXISTANT"), "TEST_KEY_NONEXISTANT not defined in environment.");
});

/** ==== getAllEnv() ==== */
test("getAllEnv() with prefix filters variables", () => {
    setEnv("API_KEY", "12345");
    setEnv("API_VERSION", "v2");
    setEnv("OTHER_VAR", "test");

    const apiVariables = getAllEnv("API_");

    assertEquals(apiVariables, {
        API_KEY: "12345",
        API_VERSION: "v2",
    });
});

/** ==== setEnv() ==== */
test("setEnv() creates a new environment variable", () => {
    const key = "TEST_VARIABLE_3";
    const value = "test_value";

    setEnv(key, value);
    assertEquals(getEnv(key), value);
});

test("setEnv() overwrites an existing environment variable", () => {
    const key = "TEST_VARIABLE_4";
    setEnv(key, "old_value");

    setEnv(key, "new_value");
    assertEquals(getEnv(key), "new_value");
});

/** ==== hasEnv() ==== */
test("hasEnv() returns true for an existing environment variable", () => {
    const key = "TEST_VARIABLE_5";
    setEnv(key, "value");

    assert(hasEnv(key));
});

test("hasEnv() returns false for a non-existent environment variable", () => {
    const key = "NON_EXISTENT_VARIABLE";
    assertEquals(hasEnv(key), false);
});

/** ==== validateEnv() ==== */
const isValidPort: ValidatorFunction = (value: string): boolean => /^\d+$/.test(value);

test("validateEnv() returns true for valid values", () => {
    setEnv("TEST_VALUE_2", "1234"); // Valid as per isValidPort
    assert(validateEnv("TEST_VALUE_2", isValidPort));
});

test("validateEnv() false for nonexistant keys", () => {
    const result = validateEnv("TEST_VALUE_NONEXISTANT", isValidPort);
    assertEquals(result, false);
});

/** ==== validateAndGetEnv() ==== */
test("validateAndGetEnv() returns the value for valid values", () => {
    setEnv("TEST_PORT", "8080");
    const port = validateAndGetEnv("TEST_PORT", isValidPort);
    assertEquals(port, "8080");
});

test("validateAndGetEnv() returns undefined for invalid values", () => {
    setEnv("PORT", "http"); // Invalid as per isValidPort

    // should return undefined
    const result = validateAndGetEnv("PORT", isValidPort);
    assertEquals(result, undefined);
});

test("validateAndGetEnv() throws for invalid values", () => {
    setEnv("PORT", "http"); // Invalid as per isValidPort

    setupEnv({ throwErrors: true });
    //it should throw an error:
    assertThrows(() => validateAndGetEnv("PORT", isValidPort), ValidationError);
});
