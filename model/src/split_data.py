import csv
import os
import pathlib
import re
import shutil

model_path = pathlib.Path(__file__).parent.parent.absolute()
assets_dir = model_path / 'assets'
data_dir = model_path / 'data'


def mkdir(path):
    try:
        os.mkdir(path)
    except FileExistsError:
        pass


try:
    shutil.rmtree(data_dir)
except FileNotFoundError:
    pass

mkdir(data_dir)

mapping = {
    '0': 'negative',
    '4': 'positive',
}

for filename in ['big']:
    counts = {
        'negative': 0,
        'positive': 0,
    }

    output_dir = data_dir / filename
    mkdir(output_dir)

    for sentiment in counts.keys():
        mkdir(output_dir / sentiment)

    with open(assets_dir / f'{filename}.csv') as csv_file:
        for row in csv.DictReader(csv_file):
            sentiment = mapping[row['sentiment']]
            count = counts[sentiment]
            text = f'''"{re.sub('"', '""', row['text'].strip())}"'''
            with open(output_dir / sentiment / f'{count}.txt',  'w') as out_file:
                out_file.write(text)

            counts[sentiment] += 1
