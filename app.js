const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const config = require('config');
const port = 3000;

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));
const dbConfig = config.get('dbConfig');

app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.post('/api/subscriptions', (req, res) => {

});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Example app listening at http://localhost:${port}`)
  console.log(dbConfig)
})