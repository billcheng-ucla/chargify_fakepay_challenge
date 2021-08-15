var mysql = require('mysql2');
const config = require('config');
const dbConfig = config.get('dbConfig');
var con = mysql.createConnection({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: "chargify_interview"
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");
  let sql = "CREATE TABLE boxes (boxId VARCHAR(100), price INT NOT NULL, PRIMARY KEY (boxId))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Boxes Table created");
  });
  sql = "CREATE TABLE billings (token VARCHAR(255), expiration DATE, CVV VARCHAR(10), zip VARCHAR(255), PRIMARY KEY (token))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Billings Table created");
  });
  sql = "CREATE TABLE subscriptions (name VARCHAR(255), address VARCHAR(255), zip VARCHAR(255), active BOOL DEFAULT TRUE, QUANTITY INT DEFAULT 1, token VARCHAR(255) NOT NULL, boxId VARCHAR(100) NOT NULL, PRIMARY KEY (name, boxId), FOREIGN KEY (token) REFERENCES Billings(token), FOREIGN KEY (boxId) REFERENCES Boxes(boxId))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Subscriptions Table created");
  });
  sql = "INSERT INTO boxes (boxId, price) VALUES ('bronze', 1999), ('silver', 4900), ('gold', 9900)";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Boxes in DB");
  });
});