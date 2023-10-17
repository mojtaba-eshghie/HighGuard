# Anvil Information Extractor

This module provides a utility function to extract Ethereum-related information from the output of the Anvil command.

## Usage

To use the `extractAnvilInfo` function (in CI directory of the project):

```javascript
const { extractAnvilInfo } = require("./CI/envs/anvil/anvil.js");

extractAnvilInfo()
  .then((info) => {
    console.log(info);
  })
  .catch((error) => {
    console.error(error);
  });
```

## Functionality

### `extractAnvilInfo()`

Extracts Ethereum accounts, private keys, and the RPC address from the Anvil command's output.

- **Returns**: A promise that resolves with an object containing:

  - `accounts`: An array of Ethereum account addresses.
  - `privateKeys`: An array of private keys corresponding to the Ethereum accounts.
  - `rpcAddress`: The RPC address on which Anvil is listening.

- **Throws**: An error if there's an issue executing the Anvil command or processing its output.

### Supported Versions

This tool is tested with the following version of Anvil.

```
anvil 0.2.0 (0232ee5 2023-10-16T00:17:47.266734000Z)
```
