from tensorflow.keras.layers import Conv2D, MaxPooling2D, Flatten, Dense, Input, Lambda
from tensorflow.keras.models import Model
import tensorflow.keras.backend as K
import pandas as pd
import numpy as np
import cv2 
from sklearn.model_selection import train_test_split

IMG_SIZE = (128, 128)

# Preprocess image
def load_and_preprocess_image(image_path):
    image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
    image = cv2.resize(image, IMG_SIZE)
    image = image / 255.0  # Normalize
    return np.expand_dims(image, axis=-1)  # Add channel dimension
    
# Load pairs CSV
df = pd.read_csv("/Users/aaryan/Desktop/2025/TMA4851/ml/data/pairs.csv")

# Split into train (80%) and test (20%)
train_df, test_df = train_test_split(df, test_size=0.2, random_state=42)

# Load training data
X1_train = np.array([load_and_preprocess_image(img) for img in train_df["Image1"]])
X2_train = np.array([load_and_preprocess_image(img) for img in train_df["Image2"]])
Y_train = np.array(train_df["Label"])

# Load testing data
X1_test = np.array([load_and_preprocess_image(img) for img in test_df["Image1"]])
X2_test = np.array([load_and_preprocess_image(img) for img in test_df["Image2"]])
Y_test = np.array(test_df["Label"])




def build_siamese_network(input_shape=(128, 128, 1)):
    input_layer = Input(shape=input_shape)

    x = Conv2D(64, (3,3), activation='relu')(input_layer)
    x = MaxPooling2D()(x)
    x = Conv2D(128, (3,3), activation='relu')(x)
    x = MaxPooling2D()(x)
    x = Flatten()(x)
    x = Dense(256, activation='relu')(x)
    x = Dense(128, activation='relu')(x)
    return Model(input_layer, x)

def euclidean_distance(vectors):
    x, y = vectors
    return K.sqrt(K.sum(K.square(x - y), axis=-1, keepdims=True))

signature_model = build_siamese_network()

inputA = Input(shape=(128, 128, 1))
inputB = Input(shape=(128, 128, 1))

embeddingA = signature_model(inputA)
embeddingB = signature_model(inputB)

distance = Lambda(euclidean_distance)([embeddingA, embeddingB])

siamese_model = Model(inputs=[inputA, inputB], outputs=distance)
siamese_model.compile(loss='mse', optimizer='adam', metrics=['accuracy'])

# Load training pairs
df = pd.read_csv("/Users/aaryan/Desktop/2025/TMA4851/ml/data/pairs.csv")

X1 = np.array([load_and_preprocess_image(img) for img in df["Image1"]])
X2 = np.array([load_and_preprocess_image(img) for img in df["Image2"]])
Y = np.array(df["Label"])
siamese_model.fit([X1_train, X2_train], Y_train, epochs=10, batch_size=32)
siamese_model.save("/Users/aaryan/Desktop/2025/TMA4851/ml/preds/signature_verification_model.h5")


test_loss, test_accuracy = siamese_model.evaluate([X1_test, X2_test], Y_test)
print(f"Test Accuracy: {test_accuracy:.2f}")
