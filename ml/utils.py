import cv2 
import numpy as np
import tensorflow as tf
import os

IMG_SIZE = (128, 128)

# Preprocess image
def load_and_preprocess_image(image_path):
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    image = cv2.resize(image, IMG_SIZE)
    image = image / 255.0  # Normalize
    return np.expand_dims(image, axis=-1)  # Add channel dimension

