import numpy as np
import tensorflow as tf
import pathlib
import json

assets_dir = pathlib.Path(__file__).absolute().parent.parent / 'assets'
data_dir = assets_dir.parent / 'data'

model = tf.keras.models.load_model(assets_dir / 'trained_model')

dataset = tf.keras.preprocessing.text_dataset_from_directory(
    data_dir,
    batch_size=10000)

encoder = tf.keras.layers.experimental.preprocessing.TextVectorization(
    max_tokens=10000)

with open(assets_dir / 'vocab.json', 'r') as json_file:
    vocab = json.load(json_file)
    items = vocab.items()
    encoder.set_weights([np.array(list(map(lambda t: t[0], items)), dtype=object),
                         np.array(list(map(lambda t: t[1], items)))])


def encode_text(text, label):
    text = tf.expand_dims(text, -1)
    return encoder(text), label


encoded_dataset = dataset.map(encode_text)

loss, acc = model.evaluate(encoded_dataset)
print('Loss:', loss)
print('Accuracy:', acc)
