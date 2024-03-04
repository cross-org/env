/**
 * @fileoverview  A cross-runtime environment variable management library.
 *                Provides functions for getting, setting, validating, and
 *                retrieving environment variables across Deno, Bun and Node.js
 */

import {
    EnvOptions,
    Runtimes,
    UnsupportedEnvironmentError,
    ValidationError,
    ValidatorFunction,
} from "./lib/helpers.ts";
import { loadEnvFile } from "./lib/filehandler.ts";
export type { EnvOptions, ValidatorFunction } from "./lib/helpers.ts";

/**
 * Various shims/type-stubs, declared for development/IDE purposes
 */
//shims the Deno runtime
declare const Deno: {
    env: {
        get(key: string): string | undefined;
        set(key: string, value: string): void;
        toObject(): Record<string, string | undefined>;
    };
};
//shims the Bun runtime
declare const Bun: { env: Record<string, string> };
//shims Node.js process object
declare const process: {
    // deno-lint-ignore no-explicit-any
    versions: any;
    env: Record<string, string>;
};

// Flags to control behavior (initialized with defaults)
let throwErrors = false;
let logWarnings = true;

function getCurrentRuntime(): Runtimes {
    if (typeof Deno === "object") {
        return Runtimes.Deno;
    } else if (typeof Bun === "object") {
        return Runtimes.Bun;
    } else if (
        typeof process === "object" && typeof process.versions !== "undefined" &&
        typeof process.versions.node !== "undefined"
    ) {
        return Runtimes.Node;
    } else {
        return Runtimes.Unsupported;
    }
}

/**
 * Configures the behavior of the environment variable library.
 *
 * @param {EnvOptions} options - setup options.
 */
export async function setupEnv(options?: EnvOptions) {
    if (options) {
        throwErrors = options.throwErrors ?? false;
        logWarnings = options.logWarnings ?? true;

        if (options.loadDotEnv) {
            const currentRuntime = getCurrentRuntime();
            const envFile = options.dotEnvFile ? options.dotEnvFile : undefined;
            const envVars = await loadEnvFile(currentRuntime, envFile, throwErrors, logWarnings);

            switch (currentRuntime) {
                case Runtimes.Deno:
                    Object.entries(envVars).forEach(([key, value]) => Deno.env.set(key, value));
                    break;
                case Runtimes.Bun:
                    Object.entries(envVars).forEach(([key, value]) => Bun.env[key] = value);
                    break;
                case Runtimes.Node:
                    Object.entries(envVars).forEach(([key, value]) => process.env[key] = value);
                    break;
            }
        }
    }
}

/**
 * Gets an environment variable across different supported runtimes.
 *
 * @param {string} key - The name of the environment variable.
 * @returns {string | undefined} The value of the environment variable, or undefined if not found.
 * @throws {UnsupportedEnvironmentError} if the current runtime is unsupported
 *         and the 'throwErrors' flag is set.
 */
export function getEnv(key: string): string | undefined {
    const currentRuntime = getCurrentRuntime();

    switch (currentRuntime) {
        case Runtimes.Deno:
            return Deno.env.get(key);
        case Runtimes.Bun:
            return Bun.env[key];
        case Runtimes.Node:
            return process.env[key];
        default:
            if (throwErrors) {
                throw new UnsupportedEnvironmentError();
            }
            if (logWarnings) {
                console.warn("Unsupported runtime");
            }
            return undefined;
    }
}

/**
 * Set an environment variable in supported runtimes.
 *
 * @param {string} key - The name of the environment variable.
 * @param {string} value - The value to set for the environment variable.
 * @throws {UnsupportedEnvironmentError} if the current runtime is unsupported
 *         and the 'throwErrors' flag is set.
 */
export function setEnv(key: string, value: string): void {
    const currentRuntime = getCurrentRuntime();

    switch (currentRuntime) {
        case Runtimes.Deno:
            Deno.env.set(key, value);
            break;
        case Runtimes.Bun:
            Bun.env[key] = value;
            break;
        case Runtimes.Node:
            process.env[key] = value;
            break;
        default:
            if (throwErrors) {
                throw new UnsupportedEnvironmentError();
            }
            if (logWarnings) {
                console.warn("Unsupported runtime");
            }
    }
}

/**
 * Checks if an environment variable with the given key exists in the
 * current runtime
 *
 * @param {string} key - The name of the environment variable.
 * @returns {boolean} True if the environment variable exists, false otherwise.
 * @throws {UnsupportedEnvironmentError} if the current runtime is unsupported
 *         and the 'throwErrors' flag is set.
 */
export function hasEnv(key: string): boolean {
    const currentRuntime = getCurrentRuntime();

    switch (currentRuntime) {
        case Runtimes.Deno:
            return Deno.env.get(key) !== undefined;
        case Runtimes.Bun:
            return key in Bun.env;
        case Runtimes.Node:
            return process.env[key] !== undefined;
        default:
            if (throwErrors) {
                throw new UnsupportedEnvironmentError();
            }
            if (logWarnings) {
                console.warn("Unsupported runtime");
            }
            return false; // Unsupported runtime
    }
}

/**
 * Returns an object containing the accessible environment variables in the
 * current runtime, optionally filtered by a prefix.
 *
 * @param {string} prefix - Optional prefix to filter environment variables by.
 * @returns {Record<string, string | undefined>} An object where keys are environment variable names and values
 * are their corresponding values (or undefined if not found).
 * @throws {UnsupportedEnvironmentError} if the current runtime is unsupported
 *         and the 'throwErrors' flag is set.
 */
export function getAllEnv(prefix?: string): Record<string, string | undefined> {
    const currentRuntime = getCurrentRuntime();
    const envVars: Record<string, string | undefined> = {};

    switch (currentRuntime) {
        case Runtimes.Deno:
            for (const key of Object.keys(Deno.env.toObject())) {
                if (!prefix || key.startsWith(prefix)) {
                    envVars[key] = Deno.env.get(key);
                }
            }
            break;
        case Runtimes.Bun:
            for (const key in Bun.env) {
                if (!prefix || key.startsWith(prefix)) {
                    envVars[key] = Bun.env[key];
                }
            }
            break;
        case Runtimes.Node:
            for (const key in process.env) {
                if (!prefix || key.startsWith(prefix)) {
                    envVars[key] = process.env[key];
                }
            }
            break;
        default:
            if (throwErrors) {
                throw new UnsupportedEnvironmentError();
            }
            if (logWarnings) {
                console.warn("Unsupported runtime");
            }
    }

    return envVars;
}

/**
 * Checks if an environment variable exists and validates it against a
 * provided validation function.
 *
 * @param {string} key - The name of the environment variable.
 * @param {ValidatorFunction} validator - A function that takes a string value and returns a boolean
 *                    indicating whether the value is valid.
 * @returns {boolean} True if the environment variable exists and passes validation, false otherwise.
 */
export function validateEnv(key: string, validator: ValidatorFunction): boolean {
    const value = getEnv(key);

    if (value !== undefined && validator(value)) {
        return true;
    } else {
        return false;
    }
}

/**
 * Gets an environment variable across different supported runtimes,
 * validating it against a provided validation function.
 *
 * @param {string} key - The name of the environment variable.
 * @param {ValidatorFunction} validator - A function that takes a string value and returns a boolean
 *                    indicating whether the value is valid.
 * @returns The value of the environment variable if it exists and is valid.
 * @throws ValidationError if the environment variable is found but fails validation.
 */
export function validateAndGetEnv(key: string, validator: ValidatorFunction): string | undefined {
    const value = getEnv(key) || undefined;

    if (value && !validator(value)) {
        if (throwErrors) {
            throw new ValidationError(`Environment variable '${key}' is invalid.`);
        }
        if (logWarnings) {
            console.warn(`Environment variable '${key}' is invalid.`);
        }
        return undefined;
    }

    return value;
}
