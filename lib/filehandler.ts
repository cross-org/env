import { FileReadError, Runtimes, UnsupportedEnvironmentError } from "./helpers.ts";

//Simulates/shims the Deno runtime for development purposes.
declare const Deno: {
    readTextFileSync(filePath: string): string;
    env: {
        get(key: string): string | undefined;
        set(key: string, value: string): void;
        toObject(): Record<string, string | undefined>;
    };
};

//Simulates/shims the Bun runtime for development purposes.
declare const Bun: {
    file(filePath: string): { text(): string };
    env: Record<string, string>;
};

//Simulates/shims Node.js function to load modules for development purposes.
// deno-lint-ignore no-explicit-any
declare const require: (module: string) => any;

//Simulates/shims Node.js process object for development purposes.
declare const process: { env: Record<string, string> };

//Simulates/shims the Node.js fs namespace for development purposes.
// deno-lint-ignore no-explicit-any
declare const fs: any;

/**
 * Loads environment variables from a .env file, handling file existence,
 * runtime differences, and errors.
 *
 * @param {Runtimes} currentRuntime -  The current runtime environment.
 * @param {string} [filePath=".env"] - The path to the file to load, defaults to .env
 * @param {boolean} throwErrors - Controls whether errors are thrown
 * @param {boolean} logWarnings - Controls whether warnings are logged.
 * @returns {Record<string, string>} A object of parsed environment variables.
 * @throws {UnsupportedEnvironmentError} If the runtime is unsupported and the 'throwErrors' flag is set.
 * @throws {FileReadError} If there's an error reading the .env file and the 'throwErrors' flag is set.
 */
export async function loadEnvFile(
    currentRuntime: Runtimes,
    filePath: string = ".env",
    throwErrors: boolean,
    logWarnings: boolean,
): Promise<Record<string, string>> {
    let fileContent = "";

    try {
        switch (currentRuntime) {
            case Runtimes.Deno:
                fileContent = Deno.readTextFileSync(filePath);
                break;
            case Runtimes.Bun:
                fileContent = await Bun.file(filePath).text();
                break;
            case Runtimes.Node: {
                const fs = await import("node:fs");
                fileContent = fs.readFileSync(filePath, "utf-8");
                break;
            }
            default:
                {
                    if (throwErrors) {
                        throw new UnsupportedEnvironmentError();
                    }
                    if (logWarnings) {
                        console.warn("Unsupported runtime");
                    }
                }
                break;
        }
    } catch (err) {
        if (throwErrors) {
            throw new FileReadError(err.message);
        }
        if (logWarnings) {
            console.warn(err.message);
        }
    }

    return parseEnvFile(fileContent);
}

/**
 * Parses a string representing the content of a .env file and creates a
 * dictionary of environment variables.
 *
 * @param {string} content - The string content of the .env file.
 * @returns {Record<string, string>} A object of parsed environment variables.
 */
function parseEnvFile(content: string): Record<string, string> {
    const envVars: Record<string, string> = {};

    if (content.length > 0) {
        content.split("\n").forEach((line) => {
            const trimmedLine = line.trim();

            // Ignore comments and empty lines
            if (!trimmedLine || trimmedLine.startsWith("#")) {
                return;
            }

            const [key, value] = trimmedLine.split("=");
            envVars[key] = value;
        });
    }

    return envVars;
}
