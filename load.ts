/**
 * Automatically loads environment variables at the start of the application.
 *
 * By default, this script enables the loading of `.env` files, merging their values
 * with the existing environment variables. This behavior is customizable in the
 * main setup function if different behavior is desired.
 *
 * @module load
 */

import { setupEnv } from "./mod.ts";

// Invoke the setupEnv function with default options for automatic environment variable loading.
// The `dotEnv` option is enabled by default to automatically load variables from a `.env` file.
try {
    await setupEnv({
        dotEnv: {
            enabled: true,
        },
    });
} catch (error) {
    console.error("Failed to load environment variables:", error);
}
