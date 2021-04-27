import json
import pathlib
import os
import random

import tensorflow as tf
import tensorflowjs as tfjs

model_dir = pathlib.Path(os.getcwd()) / 'model'
dataset_dir = model_dir / 'data'

train_dir = dataset_dir / 'big'

batch_size = 64
seed = random.randint(0, 100)

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

buffer_size = 10000

train_dataset = train_dataset.shuffle(buffer_size).prefetch(tf.data.AUTOTUNE)
validation_dataset = validation_dataset.prefetch(tf.data.AUTOTUNE)

vocab_size = 10000
encoder = tf.keras.layers.experimental.preprocessing.TextVectorization(
    max_tokens=vocab_size)
encoder.adapt(train_dataset.map(lambda text, label: text))


def encode_text(text, label):
    text = tf.expand_dims(text, -1)
    return encoder(text), label


encoded_train_dataset = train_dataset.map(encode_text)
encoded_validation_dataset = validation_dataset.map(encode_text)

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

history = model.fit(encoded_train_dataset, epochs=10, validation_steps=30)

test_loss, test_acc = model.evaluate(encoded_validation_dataset)

print('Test Loss:', test_loss)
print('Test Accuracy:', test_acc)

assets_dir = model_dir / 'assets'
model_path = assets_dir / 'trained_model_big_2'
model.save(model_path)

with open(str(assets_dir / 'vocab.json'), 'w') as vocab_file:
    words, weights = encoder.get_weights()
    words = map(lambda b: b.decode('utf-8'), words)
    weights = list(map(lambda n: int(n), weights))
    word_map = {}
    for (i, word) in enumerate(words):
        word_map[word] = weights[i]

    json.dump(word_map, vocab_file)

tfjs.converters.convert_tf_saved_model(
    str(model_path), str(assets_dir / 'trained_model_big_2_converted'))
