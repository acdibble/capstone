import csv
import os
import shutil
import re
import pathlib

model_path = pathlib.Path(__file__).parent.parent.absolute()
assets_dir = model_path / 'assets'
data_dir = model_path / 'data'


def mkdir(path):
    try:
        os.mkdir(path)
    except FileExistsError:
        pass


shutil.rmtree(data_dir)
mkdir(data_dir)

for filename in ('train', 'test'):
    counts = {
        'negative': 0,
        'not_negative': 0,
    }

    output_dir = data_dir / filename
    mkdir(output_dir)

    for sentiment in counts.keys():
        mkdir(output_dir / sentiment)

    with open(assets_dir / f'{filename}.csv') as csv_file:
        for row in csv.DictReader(csv_file):
            sentiment = 'negative' if row['sentiment'] == 'negative' else 'not_negative'
            count = counts[sentiment]
            text = f'''"{re.sub('"', '""', row['text'].strip())}"'''
            with open(output_dir / sentiment / f'{count}.txt',  'w') as out_file:
                out_file.write(text)

            counts[sentiment] += 1
