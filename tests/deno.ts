import { assert, assertEquals, assertThrows } from "https://deno.land/std@0.218.2/assert/mod.ts";

import {
    getAllEnv,
    getEnv,
    hasEnv,
    setEnv,
    setupEnv,
    validateAndGetEnv,
    validateEnv,
    ValidationError,
    ValidatorFunction,
} from "../mod.ts";

/** ==== getEnv() ==== */
Deno.test({
    name: "getEnv() retrieves an existing environment variable",
    fn() {
        Deno.env.set("TEST_VARIABLE", "hello");

        const value = getEnv("TEST_VARIABLE");
        assertEquals(value, "hello");

        Deno.env.delete("TEST_VARIABLE");
    },
});

Deno.test({
    name: "getEnv() undefined for nonexistant keys",
    fn: () => {
        const result = getEnv("TEST_KEY_NONEXISTANT");
        assertEquals(result, undefined);
    },
});

/** ==== getAllEnv() ==== */
Deno.test({
    name: "getAllEnv() with prefix filters variables",
    fn: () => {
        Deno.env.set("API_KEY", "12345");
        Deno.env.set("API_VERSION", "v2");
        Deno.env.set("OTHER_VAR", "test");

        const apiVariables = getAllEnv("API_");

        assertEquals(apiVariables, {
            API_KEY: "12345",
            API_VERSION: "v2",
        });

        Deno.env.delete("API_KEY");
        Deno.env.delete("API_VERSION");
        Deno.env.delete("OTHER_VAR");
    },
});

/** ==== setEnv() ==== */
Deno.test({
    name: "setEnv() creates a new environment variable",
    fn: () => {
        const key = "TEST_VARIABLE";
        const value = "test_value";

        setEnv(key, value);
        assertEquals(Deno.env.get(key), value);

        Deno.env.delete(key);
    },
});

Deno.test({
    name: "setEnv() overwrites an existing environment variable",
    fn: () => {
        const key = "TEST_VARIABLE";
        Deno.env.set(key, "old_value");

        setEnv(key, "new_value");
        assertEquals(Deno.env.get(key), "new_value");

        Deno.env.delete(key);
    },
});

/** ==== hasEnv() ==== */
Deno.test({
    name: "hasEnv() returns true for an existing environment variable",
    fn: () => {
        const key = "TEST_VARIABLE";
        Deno.env.set(key, "value");

        assert(hasEnv(key));

        Deno.env.delete(key);
    },
});

Deno.test({
    name: "hasEnv() returns false for a non-existent environment variable",
    fn: () => {
        const key = "NON_EXISTENT_VARIABLE";
        assertEquals(hasEnv(key), false);
    },
});

/** ==== validateEnv() ==== */
const isValidPort: ValidatorFunction = (value: string): boolean => /^\d+$/.test(value);

Deno.test({
    name: "validateEnv() returns true for valid values",
    fn: () => {
        Deno.env.set("TEST_VALUE", "1234"); // Valid as per isValidPort
        assert(validateEnv("TEST_VALUE", isValidPort));
        Deno.env.delete("TEST_VALUE");
    },
});

Deno.test({
    name: "validateEnv() false for nonexistant keys",
    fn: () => {
        const result = validateEnv("TEST_VALUE_NONEXISTANT", isValidPort);
        assertEquals(result, false);
    },
});

/** ==== validateAndGetEnv() ==== */
Deno.test({
    name: "validateAndGetEnv() returns the value for valid values",
    fn: () => {
        Deno.env.set("TEST_PORT", "8080");
        const port = validateAndGetEnv("TEST_PORT", isValidPort);
        assertEquals(port, "8080");
        Deno.env.delete("TEST_PORT");
    },
});

Deno.test({
    name: "validateAndGetEnv() returns undefined for invalid values",
    fn: () => {
        Deno.env.set("PORT", "http"); // Invalid as per isValidPort

        // should return undefined
        const result = validateAndGetEnv("PORT", isValidPort);
        assertEquals(result, undefined);

        Deno.env.delete("PORT");
    },
});

Deno.test({
    name: "validateAndGetEnv() throws for invalid values",
    fn: () => {
        Deno.env.set("PORT", "http"); // Invalid as per isValidPort

        setupEnv({ throwErrors: true });
        //it should throw an error:
        assertThrows(() => validateAndGetEnv("PORT", isValidPort), ValidationError);

        Deno.env.delete("PORT");
    },
});
