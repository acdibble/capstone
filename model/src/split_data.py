import csv
import os
import pathlib
import re
import shutil

model_path = pathlib.Path(__file__).absolute().parent.parent
assets_dir = model_path / 'assets'
data_dir = model_path / 'data'


try:
    shutil.rmtree(data_dir)
except FileNotFoundError:
    pass

os.mkdir(data_dir)

mapping = {'0': 'negative', '4': 'positive'}

counts = {'negative': 0, 'positive': 0}


for sentiment in counts.keys():
    os.mkdir(data_dir / sentiment)


with open(assets_dir / 'big.csv') as csv_file:
    for row in csv.DictReader(csv_file):
        sentiment = mapping[row['sentiment']]
        count = counts[sentiment]

        if counts[sentiment] >= 20000:
            continue

        text = f'''"{re.sub('"', '""', row['text'].strip())}"'''
        with open(data_dir / sentiment / f'{count}.txt',  'w') as out_file:
            out_file.write(text)

        counts[sentiment] += 1
