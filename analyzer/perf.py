import psutil
import time
import csv

# Function to get the process by name
def get_process_by_name(process_name):
    for proc in psutil.process_iter(['pid', 'name']):
        if proc.info['name'] == process_name:
            return proc
    return None

# Monitor function
def monitor_process(process_name, interval, duration, output_file):
    proc = get_process_by_name(process_name)
    if not proc:
        print(f"Process {process_name} not found.")
        return
    
    start_time = time.time()
    end_time = start_time + duration
    
    with open(output_file, 'w', newline='') as csvfile:
        fieldnames = ['timestamp', 'cpu_percent', 'memory_percent']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        while time.time() < end_time:
            cpu_percent = proc.cpu_percent(interval=interval)
            memory_percent = proc.memory_percent()
            
            writer.writerow({
                'timestamp': time.time(),
                'cpu_percent': cpu_percent,
                'memory_percent': memory_percent
            })
            time.sleep(interval)

# Parameters
process_name = "node"  # Change to the exact name of the process
interval = 1  # Interval in seconds
duration = 120  # Duration in seconds
output_file = "analyzer/node_usage.csv"

# Start monitoring
monitor_process(process_name, interval, duration, output_file)
