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
  let sql = "CREATE TABLE IF NOT EXISTS boxes (boxId VARCHAR(100), price INT NOT NULL, PRIMARY KEY (boxId))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Boxes Table created");
  });
  sql = "CREATE TABLE IF NOT EXISTS billings (token VARCHAR(255), expiration DATE, CVV VARCHAR(10), zip VARCHAR(255), PRIMARY KEY (token))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Billings Table created");
  });
  sql = "CREATE TABLE IF NOT EXISTS subscriptions (name VARCHAR(255), address VARCHAR(255), zip VARCHAR(255), active BOOL DEFAULT TRUE, QUANTITY INT DEFAULT 1, token VARCHAR(255) NOT NULL, boxId VARCHAR(100) NOT NULL, PRIMARY KEY (name, boxId), FOREIGN KEY (token) REFERENCES Billings(token) ON DELETE CASCADE, FOREIGN KEY (boxId) REFERENCES Boxes(boxId))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Subscriptions Table created");
  });
  sql = "CREATE TABLE IF NOT EXISTS fakepay_errors (code INT, description VARCHAR(8000), PRIMARY KEY (code))";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("fakepay_errors Table created");
  });

  sql = "INSERT IGNORE INTO boxes (boxId, price) VALUES ('bronze', 1999), ('silver', 4900), ('gold', 9900)";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Boxes in DB");
  });
  sql = "INSERT IGNORE INTO fakepay_errors (code, description) VALUES (1000001, 'Invalid credit card number'), (1000002, 'Insufficient funds'), (1000003, 'CVV failure'), (1000004, 'Expired card'), (1000005, 'Invalid zip code'), (1000006, 'Invalid purchase amount'), (1000007, 'Invalid token'), (1000008, 'Invalid params: cannot specify both  token  and other credit card params like  card_number ,  cvv ,  expiration_month ,  expiration_year  or  zip.')";
  con.query(sql, function (err, result) {
    if (err) throw err;
    console.log("Fakepay Errors in DB");
  });
});