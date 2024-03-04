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
    /** (default: false) - If true, read and load environment variables a file.
     * (default file: ".env") **@experimental** Support for loading .env files may have
     * limitations in certain runtimes.  */
    loadDotEnv?: boolean;
    /** (default: ".env") - filename of the file containing environment variables to load. */
    dotEnvFile?: string;
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
