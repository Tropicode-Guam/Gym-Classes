const express = require('express');
const path = require('path');
const app = express();

const PUBLIC_URL = process.env.PUBLIC_URL || '';

app.use(PUBLIC_URL + '/', express.static(path.join(__dirname, 'build')));

app.get(PUBLIC_URL + '/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(3000);