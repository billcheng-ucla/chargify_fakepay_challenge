var mysql = require('mysql2');
const config = require('config');
const dbConfig = config.get('dbConfig');
var con = mysql.createConnection({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  con.query("CREATE DATABASE chargify_interview", function (err, result) {
    if (err) throw err;
    console.log("Database created");
  });
});