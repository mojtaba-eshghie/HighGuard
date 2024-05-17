import os

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

# Example usage:
directory_path = 'results/auction'
files = list_files_in_directory(directory_path)
print(files)
