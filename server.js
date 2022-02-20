var express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const PORT = 5000;
const dirPath = path.join(__dirname, "dist");

let files = [];



var app = express();
app.use(cors({
  origin: ['http://localhost:8000','https://danielyxie.github.io']
}));

app.use(express.static(dirPath));
app.get('/', async (req, res) => {
  files = await fs.promises.readdir(dirPath);
  res.send(files);
})

var server = app.listen(PORT);
console.log(`app listening on port ${PORT}`)