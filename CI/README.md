# CI Ecosystem for Clawk

## run.js

`run.js` is the main script responsible for setting up the required environment and executing the tests specified in the `ci-config.yml` file.

### Usage

To run the script, simply execute:

```
node run.js
```

For verbose logging, use the `-v` switch:

```
node run.js -v
```

When verbose logging is enabled, the script will display detailed debug information and logs.

### Features

- Reads the CI configuration from `ci-config.yml`.
- Sets up the specified environment (e.g., Anvil).
- Executes the tests for the specified environment.
- Provides a count of successful and failed exploits.
- Terminates any running instances of the environment after tests are executed.

## ci-config.yml

This YAML file provides the configuration for the CI tests and environments. It specifies the directory containing the test scripts, the individual test files to be executed, and the environment in which the tests should be run.

## Environments

The `envs` directory contains setup scripts for different environments. Currently, the Anvil environment is supported, as specified in `anvil.js`.

## Tests

The `tests` directory contains the test scripts that are executed by `run.js`. The `exp1.js` script, for example, contains an exploit that is run as part of the CI process.
