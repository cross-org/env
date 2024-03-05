## Cross-runtime environment variable management for Deno, Bun, and Node.js

[![JSR Version](https://jsr.io/badges/@cross/env)](https://jsr.io/@cross/env)
[![JSR Score](https://jsr.io/badges/@cross/env/score)](https://jsr.io/@cross/env/score)

This library provides a consistent and simple interface for managing environment variables across multiple runtimes,
making it ideal for cross-platform development.

## Features

- **Cross-runtime support:** Works seamlessly within Deno, Bun, and Node.js environments.
- **Get and Set environment variables:** Retrieve and Modify environment variables in a consistent interface across
  multiple runtimes.
- **Validation:** Ensures environment variables are valid before usage.
- **Error handling:** Provides clear error messages for unsupported runtimes or validation failures.
- **Optional environmental file loading:** Supports loading variables from custom .env files _(experimental)_

## Installation

```bash
#For Deno
deno add @cross/env

#For Bun
bunx jsr add @cross/env

#For Node.js
npx jsr add @cross/env
```

## Getting Started

**Usage Examples**

import relevant functions.

```javascript
import { getEnv, setEnv, validateEnv } from "@cross/env";
```

Simple get example.

```javascript
const apiKey = getEnv("API_KEY");

// or
console.log(`Home directory: ${getEnv("HOME")}`);
```

Simple set example.

```javascript
setEnv("ENVIRONMENT", "development");
setEnv("THE_COLOUR", "red");
```

Checking if a variable exists.

```javascript
if (hasEnv("DB_USER")) {
    // Handle database connection logic
}
```

Getting all environment variables.

```javascript
// getting all variables
const allVariables = getAllEnv();
// getting all variables prefixed with API_
const apiVariables = getAllEnv("API_");
// Output:
// { API_KEY: 'abc123', API_VERSION: 'v2' }
```

Validation through custom functions.

```javascript
// Validate a colour and execute conditional code.
const colourTest: ValidatorFunction = (value) => value === "red" || value === "green"; 
if (validateEnv("THE_COLOUR", colourTest)) {
    console.log("Yep, its red or green.");
}
```

Validation through custom functions and getting the variable content.

```javascript
// or validating and getting a port number.
const isValidPort = (value: string): boolean => /^\d+$/.test(value);
const port = validateAndGetEnv("PORT", isValidPort);

// or checking it we are reading a positive number.
function isPositiveNumber(value: string): boolean {
   return !isNaN(Number(value)) && Number(value) > 0;
}
const timeout = validateAndGetEnv("TIMEOUT", isPositiveNumber);
```

## Configuration (optional)

For more advanced use cases you can configure the behaviour of the library. The library defaults to showing console
warnings but not throwing errors.

```javascript
await setupEnv({
    throwErrors: true,
    logWarnings: false,
    dotEnv: {
        enabled: true,
        path: ".env.local",
        allowQuotes: true,
        enableExpansion: true,
    },
});
```

**Supported `.env` File Features**

- **Basic Variable Definitions:** Define variables using the `KEY=VALUE` format.
- **Variable Expansion:** Use variables within other variables (`$VARIABLE_NAME`).
- **Nested Expansion:** Expand variables that reference other variables.
- **Quotes:** Enclose values with spaces using single or double quotes.
- **Escaping:** Prevent expansion with a backslash (`\$VARIABLE_NAME`).

**Example `.env` file:**

```
MYAPP_DATABASE_HOST=my-database-server
MYAPP_DATABASE_URL=jdbc:mysql://$MYAPP_DATABASE_HOST:3306/my_schema
MYAPP_MESSAGE="Hello, world!"
MYAPP_NOT_EXPAND=Test\$MYAPP_MESSAGE
```

## Issues

Issues or questions concerning the library can be raised at the
[github repository](https://github.com/cross-org/env/issues) page.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
