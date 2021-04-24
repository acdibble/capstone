import csv
import os
import pathlib

model_path = pathlib.Path(__file__).parent.parent.absolute()
assets_dir = model_path / 'assets'
data_dir = model_path / 'data'


def mkdir(path):
    try:
        os.mkdir(path)
    except:
        pass


for filename in ('train', 'test'):
    counts = {
        'negative': 0,
        'neutral': 0,
        'positive': 0,
    }

    output_dir = data_dir / filename
    mkdir(output_dir)

    for sentiment in ('positive', 'neutral', 'negative'):
        mkdir(output_dir / sentiment)

    with open(assets_dir / f'{filename}.csv') as csv_file:
        for (i, row) in enumerate(csv.DictReader(csv_file)):
            sentiment = row['sentiment']
            count = counts[sentiment]

            with open(output_dir / sentiment / f'{count}.txt',  'w') as out_file:
                out_file.write(row['text'])

            counts[sentiment] += 1
