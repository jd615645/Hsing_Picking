import requests
import json
import os

url = input('Please input url: ')
fileName = input('Please input parser file name: ')

if (url.strip() == '' and fileName.strip() == ''):
  print('url or file name is empty!')
else:
  try:
    path = os.path.dirname(os.path.abspath(__file__));
    data = requests.get(url)
    data.encoding = 'utf-8'

    with open(path + '/' + fileName + '.json', 'w') as f:
      json.dump(data.json(), f)
  except:
    print('get data error!')
