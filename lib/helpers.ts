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
