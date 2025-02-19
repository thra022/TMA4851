import os
import pandas as pd
import random

# Set the absolute dataset path
dataset_path = "/Users/aaryan/Desktop/2025/TMA4851/ml/data"

# Get list of users while ignoring system files like .DS_Store
users = [user for user in os.listdir(dataset_path) if not user.startswith('.') and os.path.isdir(os.path.join(dataset_path, user))]

pairs = []
for user in users:
    user_path = os.path.join(dataset_path, user)
    
    # Get full absolute paths for images
    genuine_signatures = [os.path.join(user_path, f) for f in os.listdir(user_path) if "original" in f]
    forged_signatures = [os.path.join(user_path, f) for f in os.listdir(user_path) if "forgeries" in f]

    # Ensure we have enough samples
    if len(genuine_signatures) < 2 or len(forged_signatures) < 1:
        print(f"Skipping {user} due to insufficient signature images")
        continue

    # Create genuine pairs (label 0)
    for i in range(len(genuine_signatures) - 1):
        pairs.append([genuine_signatures[i], genuine_signatures[i+1], 0])

    # Create forged pairs (label 1)
    for genuine in genuine_signatures:
        forged = random.choice(forged_signatures)
        pairs.append([genuine, forged, 1])

# Convert to DataFrame
df = pd.DataFrame(pairs, columns=["Image1", "Image2", "Label"])

# Save using absolute path
output_csv_path = "/Users/aaryan/Desktop/2025/TMA4851/ml/data/pairs.csv"
df.to_csv(output_csv_path, index=False)
