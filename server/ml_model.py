from tensorflow.keras.layers import (
    Conv2D,
    MaxPooling2D,
    Flatten,
    Dense,
    Input,
    Lambda,
    Dropout,
)
from tensorflow.keras.models import Model
import tensorflow.keras.backend as K
import cv2
import numpy as np

IMG_SIZE = (320, 240)
IMG_SIZE_X = IMG_SIZE[0]
IMG_SIZE_Y = IMG_SIZE[1]


def load_and_preprocess_image(image_path):
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


def build_siamese_network(input_shape=(IMG_SIZE_Y, IMG_SIZE_X, 1)):
    input_layer = Input(shape=input_shape)
    x = Conv2D(8, (5, 5), activation="relu")(input_layer)
    x = MaxPooling2D(pool_size=(2, 2))(x)
    x = Conv2D(16, (5, 5), activation="relu")(x)
    x = MaxPooling2D(pool_size=(2, 2))(x)
    x = Flatten()(x)
    x = Dense(32, activation="relu")(x)
    x = Dropout(0.3)(x)
    return Model(input_layer, x)


signature_model = build_siamese_network()

inputA = Input(shape=(IMG_SIZE_Y, IMG_SIZE_X, 1))
inputB = Input(shape=(IMG_SIZE_Y, IMG_SIZE_X, 1))

embeddingA = signature_model(inputA)
embeddingB = signature_model(inputB)

# Compute absolute difference between embeddings
merged_embeddings = Lambda(lambda tensors: K.abs(tensors[0] - tensors[1]))(
    [embeddingA, embeddingB]
)

# Classification layer
output = Dense(1, activation="sigmoid")(merged_embeddings)

model = Model(inputs=[inputA, inputB], outputs=output)
model.load_weights("/Users/aaryan/Desktop/2025/TMA4851/server/320x240.keras")
