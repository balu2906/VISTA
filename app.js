const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

var scrapApi = require("./Utility/ScrapApi");

app.get("/scrap",scrapApi.getScrap);

const port = 3000;

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
