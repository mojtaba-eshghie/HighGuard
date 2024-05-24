#!/bin/bash

# Directory containing the result log files
results_dir="results"

# Check if the results directory exists
if [ ! -d "$results_dir" ]; then
    echo "Results directory does not exist."
    exit 1
fi

# Loop through all log files in the results directory
for log_file in "$results_dir"/*.log; do
    # Check if the log file contains the string "0 result(s) found"
    if grep -q "0 result(s) found" "$log_file"; then
        # If the string is found, remove the log file
        rm "$log_file"
        echo "Removed $log_file"
    fi
done
