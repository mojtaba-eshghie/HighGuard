#!/bin/bash

# Check if the correct number of arguments are provided
if [ "$#" -lt 2 ]; then
    echo "Usage: $0 <solidity_version> <contract_name_pattern>..."
    exit 1
fi

# Extract the Solidity version
solidity_version=$1
shift

# Install and use the specified Solidity version
solc-select install "$solidity_version"
solc-select use "$solidity_version"

# Create the results directory if it doesn't exist
mkdir -p results

# Loop through all provided contract name patterns and run Slither on each
for pattern in "$@"; do
    for contract in $pattern; do
        # Extract the base name of the contract (e.g., Governance-1.sol -> Governance-1)
        base_name=$(basename "$contract" .sol)
        
        # Run Slither with the specified detectors and save the output to the results directory, capturing both stdout and stderr
        slither "$contract" --detect rtlo,unprotected-upgrade,tautological-compare > "results/${base_name}.log" 2>&1
    done
done
