import io
from pathlib import Path

from PIL import Image
from tensorflow.keras.layers import (
    Conv2D,
    MaxPooling2D,
    Flatten,
    Dense,
    Input,
    Lambda,
    Dropout,
    BatchNormalization,
)
from tensorflow.keras.regularizers import l2
from tensorflow.keras.models import Model
import tensorflow.keras.backend as K
import cv2
import numpy as np


IMG_SIZE = (320, 240)
IMG_SIZE_X = IMG_SIZE[0]
IMG_SIZE_Y = IMG_SIZE[1]


def load_and_preprocess_image(image_path):
    """
    Loads and preprocesses an image from a file path.
    """
    image = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
    if image is None:
        raise ValueError(f"Failed to load image: {image_path}")
    if image.shape[-1] == 4:
        alpha = image[:, :, 3] / 255.0
        white_background = np.ones_like(image[:, :, :3], dtype=np.uint8) * 255
        for c in range(3):
            white_background[:, :, c] = (1.0 - alpha) * 255 + alpha * image[:, :, c]
        image = cv2.cvtColor(white_background, cv2.COLOR_BGR2GRAY)
    else:
        image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    image = cv2.resize(image, IMG_SIZE)
    image = image / 255.0

    return np.expand_dims(image, axis=-1)


def load_and_preprocess_inmemory_image(inmemory_file):
    """
    Loads and preprocesses an image from an InMemoryUploadedFile.
    """
    image_data = inmemory_file.read()
    image = np.array(Image.open(io.BytesIO(image_data)))

    if image is None:
        raise ValueError("Failed to load image from InMemoryUploadedFile")

    if image.shape[-1] == 4:  # If image has an alpha channel
        alpha = image[:, :, 3] / 255.0
        white_background = np.ones_like(image[:, :, :3], dtype=np.uint8) * 255
        for c in range(3):
            white_background[:, :, c] = (1.0 - alpha) * 255 + alpha * image[:, :, c]
        image = cv2.cvtColor(white_background, cv2.COLOR_BGR2GRAY)
    else:
        image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

    image = cv2.resize(image, IMG_SIZE)  # Resize image
    image = image / 255.0  # Normalize pixel values

    return np.expand_dims(image, axis=-1)  # Expand dimensions


def build_siamese_network(input_shape=(IMG_SIZE_Y, IMG_SIZE_X, 1)):
    input_layer = Input(shape=input_shape)

    # More feature maps to increase learning capacity
    x = Conv2D(32, (5, 5), activation="relu", padding="same")(input_layer)
    x = BatchNormalization()(x)
    x = MaxPooling2D(pool_size=(2, 2))(x)

    x = Conv2D(64, (3, 3), activation="relu", padding="same")(x)
    x = BatchNormalization()(x)
    x = MaxPooling2D(pool_size=(2, 2))(x)

    x = Conv2D(128, (3, 3), activation="relu", padding="same")(x)
    x = BatchNormalization()(x)
    x = MaxPooling2D(pool_size=(2, 2))(x)

    x = Conv2D(256, (3, 3), activation="relu", padding="same")(x)
    x = BatchNormalization()(x)
    x = MaxPooling2D(pool_size=(2, 2))(x)

    x = Flatten()(x)
    x = Dense(512, activation="relu")(x)
    x = BatchNormalization()(x)
    x = Dropout(0.4)(x)

    x = Dense(256, activation="relu")(x)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)

    return Model(input_layer, x)


def build_probability_model():
    input_distance = Input(shape=(1,))
    output = Dense(1, activation="sigmoid")(input_distance)
    return Model(inputs=input_distance, outputs=output)


signature_model = build_siamese_network()

inputA = Input(shape=(IMG_SIZE_Y, IMG_SIZE_X, 1))
inputB = Input(shape=(IMG_SIZE_Y, IMG_SIZE_X, 1))

embeddingA = signature_model(inputA)
embeddingB = signature_model(inputB)

# Compute absolute difference between embeddings
cosine_similarity = Lambda(
    lambda tensors: K.sum(tensors[0] * tensors[1], axis=1, keepdims=True)
    / (
        K.sqrt(K.sum(K.square(tensors[0]), axis=1, keepdims=True))
        * K.sqrt(K.sum(K.square(tensors[1]), axis=1, keepdims=True))
        + K.epsilon()
    )
)([embeddingA, embeddingB])

distance_model = Model(inputs=[inputA, inputB], outputs=cosine_similarity)
distance_model_path = Path("dist_320x240.keras")
distance_model.load_weights(distance_model_path)

probability_model = build_probability_model()
probability_model_path = Path("prob_320x240.keras")
probability_model.load_weights(probability_model_path)
