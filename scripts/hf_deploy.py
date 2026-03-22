import os
import requests

TOKEN = os.environ.get("HF_TOKEN")
REPO = "herbon123/Ordermanagement"
BASE_URL = f"https://huggingface.co/api/spaces/{REPO}/upload/main/"

def upload_folder(folder_path):
    print(f"🚀 Starting API upload for: {folder_path}")
    for root, dirs, files in os.walk(folder_path):
        # Skip internal git stuff
        if ".git" in root:
            continue
        
        for file in files:
            full_path = os.path.join(root, file)
            # Calculate relative path for the remote
            rel_path = os.path.relpath(full_path, folder_path).replace("\\", "/")
            
            # Skip noise
            if rel_path == "push_error.txt" or ".env" in rel_path:
                continue

            print(f"📤 Uploading {rel_path}...")
            url = BASE_URL + rel_path
            try:
                with open(full_path, "rb") as f:
                    res = requests.post(
                        url, 
                        headers={"Authorization": f"Bearer {TOKEN}"}, 
                        data=f
                    )
                    if res.status_code >= 200 and res.status_code < 300:
                        print(f"✅ Done")
                    else:
                        print(f"❌ Error {res.status_code}: {res.text}")
            except Exception as e:
                print(f"💥 Fatal error: {str(e)}")

# Ensure requests is installed
import subprocess
subprocess.check_call(["pip", "install", "requests"])

# Run upload
upload_folder("hf_deploy")
print("🏁 All done!")
