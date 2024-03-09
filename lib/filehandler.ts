import { EnvOptions, FileReadError, UnsupportedEnvironmentError } from "./helpers.ts";
import { readFile } from "node:fs/promises";

/**
 * Loads environment variables from a .env file, handling file existence,
 * runtime differences, and errors.
 *
 * @param {Runtimes} currentRuntime -  The current runtime environment.
 * @param {EnvOptions} options - setup options.
 * @returns {Record<string, string>} A object of parsed environment variables.
 * @throws {UnsupportedEnvironmentError} If the runtime is unsupported and the 'throwErrors' flag is set.
 * @throws {FileReadError} If there's an error reading the .env file and the 'throwErrors' flag is set.
 */
export async function loadEnvFile(
    currentRuntime: string,
    options: EnvOptions,
): Promise<Record<string, string>> {
    const filePath = options.dotEnv?.path ? options.dotEnv.path : ".env";
    let fileContent = "";

    try {
        switch (currentRuntime) {
            case "deno":
            case "bun":
            case "node": {
                fileContent = await readFile(filePath, "utf-8");
                break;
            }
            default:
                {
                    if (options.throwErrors) {
                        throw new UnsupportedEnvironmentError();
                    }
                    if (options.logWarnings) {
                        console.warn("Unsupported runtime");
                    }
                }
                break;
        }
    } catch (err) {
        if (options.throwErrors) {
            throw new FileReadError(err.message);
        }
        if (options.logWarnings) {
            console.warn(err.message);
        }
    }

    return parseEnvFile(fileContent, options);
}

/**
 * Recursively expands environment variables within a given string.
 * Handles nested variable references and prevents infinite loops
 * caused by circular dependencies.
 *
 * @param {string} value - The string containing potential environment variable references.
 * @param {Record<string, string>} envVars - An object containing the known environment variables.
 * @param {Set<string>} [visited=new Set()] - A set used internally to track visited values for circular reference detection.
 * @returns {string} The string with all environment variables expanded.
 * @throws {Error} If a circular reference is detected.
 */
function expandValue(value: string, envVars: Record<string, string>, visited: Set<string> = new Set()): string {
    if (visited.has(value)) {
        throw new Error("Circular reference detected in variable expansion");
    }

    visited.add(value);

    const keys = Object.keys(envVars);
    for (const key of keys) {
        const regex = new RegExp(`(?<!\\\\)\\$${key}(?<!\\\\)`, "g");
        if (value.match(regex)) {
            const expandedInner = expandValue(envVars[key], envVars, visited);
            value = value.replace(regex, expandedInner);
        }
    }

    visited.delete(value);
    return value;
}

/**
 * Removes escape characters (backslashes) from literal dollar signs within a string.
 * This is typically used in conjunction with environment variable parsing.
 *
 * @param {string} value - The string potentially containing escaped dollar signs.
 * @returns {string} The string with escapes removed from literal dollar signs ($).
 */
function processEscapes(value: string): string {
    return value.replace(/\\\\(\$)/g, "$1");
}

/**
 * Parses a string representing the content of a .env file and creates a
 * dictionary of environment variables.
 *
 * @param {string} content - The string content of the .env file.
 * @param {EnvOptions} options - setup options.
 * @returns {Record<string, string>} A object of parsed environment variables.
 */
function parseEnvFile(content: string, options: EnvOptions): Record<string, string> {
    const envVars: Record<string, string> = {};
    const allowQuotes = options.dotEnv?.allowQuotes ? options.dotEnv.allowQuotes : undefined;
    const enableExpansion = options.dotEnv?.enableExpansion ? options.dotEnv.enableExpansion : undefined;

    if (content.length > 0) {
        content.split("\n").forEach((line) => {
            const trimmedLine = line.trim();

            // Ignore comments and empty lines
            if (!trimmedLine || trimmedLine.startsWith("#")) {
                return;
            }

            const [key, ...valueParts] = trimmedLine.split("=");
            let value = valueParts.join("=").trim();

            if (
                allowQuotes &&
                ((value.startsWith('"') && value.endsWith('"')) ||
                    (value.startsWith("'") && value.endsWith("'")))
            ) {
                value = value.slice(1, -1);
            }

            if (enableExpansion) {
                value = processEscapes(value);
                envVars[key.trim()] = expandValue(value, envVars);
            } else {
                envVars[key.trim()] = value;
            }
        });
    }

    return envVars;
}
