# Avalanche Network Runner Information Extractor

This module provides a utility function to extract Avalanche-related information from a local instance of an Avalanche C-chain subnet.

## Usage
To be able to use `extractAvalancheInfo` Avalanche-CLI must be installed, follow installation instructions from [here](https://docs.avax.network/tooling/cli-guides/install-avalanche-cli)

To use the `extractAvalancheInfo` function (in CI directory of the project):

```javascript
const { extractAvalancheInfo } = require("./CI/envs/avalanche/avalanche.js");

extractAvalancheInfo()
  .then((info) => {
    console.log(info);
  })
  .catch((error) => {
    console.error(error);
  });
```

## Functionality

### `extractAvalancheInfo()`

Extracts Avalanche accounts, private keys, and the RPC address from the local Avalanche C-chain subnet.

- **Returns**: A promise that resolves with an object containing:

  - `accounts`: An array of Avalanche account addresses.
  - `privateKeys`: An array of private keys corresponding to the Avalanche accounts.
  - `rpcAddress`: The RPC address on which Avalanche Network Runner is listening.

- **Throws**: An error if there's an issue executing the avalanche command or processing its output.

### Supported Versions

This tool is tested with the following version of Avalanche-CLI.

```
avalanche version 1.5.2
```
