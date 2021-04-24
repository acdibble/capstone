import pathlib
import os

import tensorflow as tf
import tensorflowjs as tfjs

model_dir = pathlib.Path(os.getcwd()) / 'model'
dataset_dir = model_dir / 'data'

train_dir = dataset_dir / 'train'
test_dir = dataset_dir / 'train'

batch_size = 64
seed = 42

train_dataset = tf.keras.preprocessing.text_dataset_from_directory(
    train_dir,
    validation_split=0.2,
    batch_size=batch_size,
    subset='training',
    seed=seed)
validation_dataset = tf.keras.preprocessing.text_dataset_from_directory(
    train_dir,
    validation_split=0.2,
    batch_size=batch_size,
    subset='validation',
    seed=seed)
test_dataset = tf.keras.preprocessing.text_dataset_from_directory(
    test_dir, batch_size=batch_size)

buffer_size = 10000

train_dataset = train_dataset.shuffle(buffer_size).prefetch(tf.data.AUTOTUNE)
validation_dataset = validation_dataset.prefetch(tf.data.AUTOTUNE)

vocab_size = 20000
encoder = tf.keras.layers.experimental.preprocessing.TextVectorization(
    max_tokens=vocab_size)
encoder.adapt(train_dataset.map(lambda text, label: text))


def encode_text(text, label):
    text = tf.expand_dims(text, -1)
    return encoder(text), label


encoded_train_dataset = train_dataset.map(encode_text)
encoded_validation_dataset = validation_dataset.map(encode_text)
encoded_test_dataset = test_dataset.map(encode_text)

model = tf.keras.Sequential([
    tf.keras.layers.Embedding(
        len(encoder.get_vocabulary()), 64, mask_zero=True),
    tf.keras.layers.Bidirectional(
        tf.keras.layers.LSTM(64,  return_sequences=True)),
    tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(32)),
    tf.keras.layers.Dense(64, activation='relu'),
    tf.keras.layers.Dropout(0.5),
    tf.keras.layers.Dense(1)
])

model.compile(loss=tf.keras.losses.BinaryCrossentropy(from_logits=True),
              optimizer=tf.keras.optimizers.Adam(1e-4), metrics=['accuracy'])

history = model.fit(encoded_train_dataset, epochs=10,
                    validation_data=encoded_validation_dataset,
                    validation_steps=30)

test_loss, test_acc = model.evaluate(encoded_test_dataset)

print('Test Loss:', test_loss)
print('Test Accuracy:', test_acc)

tfjs.converters.save_keras_model(
    model, model_dir / 'assets' / 'trained_model_js')
