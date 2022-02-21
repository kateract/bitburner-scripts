var express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const PORT = 5000;
const dirPath = path.join(__dirname, "dist");

let files = [];

const getHash = (input) => {
  let hash = 0, i, chr
  let inputString = input.toString();
  if (inputString.length === 0) return hash
  for (i = 0; i < inputString.length; i++) {
      chr = inputString.charCodeAt(i)
      hash = ((hash << 5) - hash) + chr
      hash |= 0 // Convert to 32bit integer
  }
  return hash
}

var app = express();
app.use(cors({
  origin: ['http://localhost:8000','https://danielyxie.github.io']
}));

app.use(express.static(dirPath));
app.get('/', async (req, res) => {
  files = await fs.promises.readdir(dirPath);
  var records = [];
  for(file of files) {
    const content = await fs.promises.readFile(path.join(dirPath,file));
    records.push({name: file, hash: getHash(content)});
  }
  res.send(records);
})

var server = app.listen(PORT);
console.log(`app listening on port ${PORT}`)