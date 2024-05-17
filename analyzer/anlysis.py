import os
import json


def collect_contract_occurrences(json_file_path, contract_name):
    try:
        with open(json_file_path, 'r') as file:
            data = json.load(file)
        
        occurrences = []
        index = 1
        
        for entry in data:
            if entry['contract'].startswith(contract_name):
                occurrences.append(f"{contract_name}-{index}")
                index += 1
        
        return occurrences
    
    except FileNotFoundError:
        return "The JSON file does not exist."
    except json.JSONDecodeError:
        return "Error decoding JSON file."
    except Exception as e:
        return f"An error occurred: {e}"


def list_files_in_directory(directory_path):
    try:
        # List all files in the directory
        files = os.listdir(directory_path)
        
        # Filter out directories, keep only files
        files = [f for f in files if os.path.isfile(os.path.join(directory_path, f))]
        
        return files
    except FileNotFoundError:
        return "The directory does not exist."
    except PermissionError:
        return "You do not have permission to access this directory."
    except Exception as e:
        return f"An error occurred: {e}"


directory_path = 'results/auction'
files = list_files_in_directory(directory_path)



