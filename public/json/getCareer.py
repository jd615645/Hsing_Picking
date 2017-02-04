import requests
import json
import os

url = 'https://onepiece.nchu.edu.tw/cofsys/plsql/json_for_course?p_career='
career = ['U', 'G', 'D', 'N', 'W', 'O']

try:
  for item in career:
    path = os.path.dirname(os.path.abspath(__file__));
    data = requests.get(url + item)
    data.encoding = 'utf-8'

    with open(path + '/career_' + item + '.json', 'w') as f:
      json.dump(data.json(), f)
except:
  print('get data error!')
