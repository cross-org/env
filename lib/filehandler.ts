import { FileReadError, UnsupportedEnvironmentError } from "./helpers.ts";
import type { EnvOptions } from "./helpers.ts";
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
    } catch (err: unknown) {
        if (err instanceof Error) {
            if (options.throwErrors) {
                throw new FileReadError(err.message);
            }
            if (options.logWarnings) {
                console.warn(err.message);
            }
        } else {
            console.error("An unexpected error occurred:", err);
        }
    }

    return parseEnvFile(fileContent, options);
}

/**
 * Matches `$NAME` references, optionally preceded by a backslash escape.
 * Names are matched greedily, so `$FOOBAR` never matches a variable named `FOO`.
 */
const VARIABLE_REFERENCE = /(\\?)\$([A-Za-z_][A-Za-z0-9_]*)/g;

/**
 * Expands `$NAME` references in a value using variables defined earlier in
 * the file. Stored values are already expanded, so a single pass is enough.
 * `\$NAME` produces a literal `$NAME`, and references to unknown variables
 * are left untouched.
 *
 * @param {string} value - The string containing potential environment variable references.
 * @param {Record<string, string>} envVars - An object containing the previously parsed environment variables.
 * @returns {string} The string with all known environment variables expanded.
 */
function expandValue(value: string, envVars: Record<string, string>): string {
    return value.replace(VARIABLE_REFERENCE, (match, escape: string, name: string) => {
        if (escape) {
            return `$${name}`;
        }
        return name in envVars ? envVars[name] : match;
    });
}

/**
 * Parses a string representing the content of a .env file and creates a
 * dictionary of environment variables.
 *
 * @param {string} content - The string content of the .env file.
 * @param {EnvOptions} options - setup options.
 * @returns {Record<string, string>} A object of parsed environment variables.
 */
export function parseEnvFile(content: string, options: EnvOptions): Record<string, string> {
    const envVars: Record<string, string> = Object.create(null);
    const allowQuotes = options.dotEnv?.allowQuotes ?? true;
    const enableExpansion = options.dotEnv?.enableExpansion ?? true;

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
                envVars[key.trim()] = expandValue(value, envVars);
            } else {
                envVars[key.trim()] = value;
            }
        });
    }

    return envVars;
}
