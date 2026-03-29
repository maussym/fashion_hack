from huggingface_hub import HfApi

api = HfApi()
print("Uploading images to HF Dataset (continues from last checkpoint)...")
api.upload_large_folder(
    folder_path="C:/fashion_hack/stylist/data",
    repo_id="maussym/fashion-images",
    repo_type="dataset",
    allow_patterns="*.jpg",
)
print("Done!")
