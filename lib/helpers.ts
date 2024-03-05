/**
 * Enum of supported runtimes.
 */
export enum Runtimes {
    Deno = "deno",
    Bun = "bun",
    Node = "node",
    Unsupported = "unsupported",
}

/**
 * Type alias for a validator function used in environment variable checks.
 */
export type ValidatorFunction = (value: string) => boolean;

/** Env setup options. */
export interface EnvOptions {
    /** (default: false) - If true, throws an errors in unsupported runtimes. */
    throwErrors?: boolean;

    /** (default: true) - If true, logs a warning to the console when environment variables
     * are accessed in unsupported runtimes. */
    logWarnings?: boolean;

    /** Configuration for loading and parsing .env files. */
    dotEnv?: {
        /** (default: false) - If true, enables reading and loading environment variables from a file. (default file: ".env")  **@experimental** Support for loading .env files may have limitations in certain runtimes. */
        enabled?: boolean;

        /** (default: ".env") - Filename of the file containing environment variables to load. */
        path?: string;

        /** (default: true) - If true, allows the use of quotes (single or double) to enclose values containing spaces within the .env file.  */
        allowQuotes?: boolean;

        /** (default: true) -  If true, enables variable expansion within the .env file (using $VARIABLE_NAME syntax). */
        enableExpansion?: boolean;
    };
}

/**
 * Error thrown when attempting to set or retrieve environment variables in
 * unsupported runtimes.
 */
export class UnsupportedEnvironmentError extends Error {
    constructor() {
        super("Unsupported runtime environment.");
    }
}

/**
 * Error thrown when attempting to validate an environment variable.
 */
export class ValidationError extends Error {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Error thrown when attempting to read file with environment variables.
 */
export class FileReadError extends Error {
    constructor(message: string) {
        super(message);
    }
}

/**
 * Represents an object designed for deep merging.  Properties can be nested
 * MergeableObjects or values of any type.
 */
interface MergeableObject {
    // deno-lint-ignore no-explicit-any
    [key: string]: MergeableObject | any;
}

/**
 * Checks if a provided value is a plain JavaScript object (not an array).
 *
 * @param {any} item - The value to check.
 * @returns {boolean} - True if `item` is a plain object, false otherwise.
 */
// deno-lint-ignore no-explicit-any
function isObject(item: any): item is Record<string, any> {
    return item && typeof item === "object" && !Array.isArray(item);
}

/**
 * Performs a simple but deep merge of multiple MergeableObject instances. Nested properties
 * are recursively merged.
 *
 * @template T - Ensures type consistency between target and source objects.
 * @param {T} target - The target object to merge into.
 * @param {...T[]} sources - One or more source objects to merge.
 * @returns {T} - The modified target object with merged properties.
 */
export function deepMerge<T extends MergeableObject>(target: T, ...sources: T[]): T {
    if (!sources.length) return target;
    const source = sources.shift();

    if (isObject(target) && isObject(source)) {
        for (const key in source) {
            if (isObject(source[key])) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                deepMerge(target[key] as MergeableObject, source[key] as MergeableObject);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
    }

    return deepMerge(target, ...sources);
}
