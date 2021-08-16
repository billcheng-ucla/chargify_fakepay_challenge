const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const config = require('config');
const port = 3000;
const PAYMENT_URL = "https://www.fakepay.io/purchase";
const fetch = require("node-fetch");
const dbConfig = config.get('dbConfig');
let products = {};

const pool = mysql.createPool({
  host: dbConfig.host,
  user: dbConfig.user,
  password: dbConfig.password,
  database: "chargify_interview",
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0
});

class StatusError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

const promisePool = pool.promise();

const boxResults = promisePool.query("SELECT * FROM boxes", ).then(([rows, fields]) => {
  for (box of rows) {
    products[box.boxId] = box.price;
  }
  console.log(products);
}).catch((err) => {
  console.log(err);
});
let getExpiration = (date) => {
  if (typeof date === "string") {
    date = new Date(date);
    console.log(date.toString());
  }
  let month = date.getMonth().toString();
  if(month.length < 2) {
    month = '0' + month;
  }
  return {month: month, year: date.getFullYear()}
}

let postPayment = async (url, data) => {
  console.log(JSON.stringify(data));
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Token token=${config.get('fakepay_api_key')}`
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: JSON.stringify(data)
  });
  console.log(response);
  return response.json();
};

let subscriptionTransaction = async (billing, subscription) => {
  const connection = await promisePool.getConnection();
  connection.config.namedPlaceholders = true;
  await connection.beginTransaction();
  try {
    console.log(connection.execute);
    await connection.execute('INSERT INTO billings SET token = ?, cvv = ?, expiration = ?, zip = ?', [billing.token, billing.cvv, billing.expiration, billing.zip]);
    await connection.execute('INSERT INTO subscriptions SET name = ?, address = ?, zip = ?, token = ?, boxId = ?', [subscription.name, subscription.address, subscription.zip, subscription.token, subscription.boxId]);
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    let status;
    let message;
    if (err.errno === 1062) {
      status = 409;
      message = `You are already subscribed to ${subscription.boxId}`;
    } else {
      status = 500;
      message = `Subscription failed. You will still recieve this product. Please create another order to reorder`;
    }
    throw new StatusError(message, status);
  } finally {
    connection.release();
  }
};

let validatePostSubscriptionRequest = (requestBody) => {
  let faults = [];
  ["card", "cvv", "expiration", "billing_zip", "name", "address", "shipping_zip", "product"].forEach(item => {
    if(!requestBody[item]) {
      faults.push(`${item} not supplied`);
    }
  });
  return faults;
}

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(bodyParser.urlencoded({ extended: false }));


app.get('/', (req, res) => {
  res.send('Hello World!')
});

app.post('/api/subscriptions', (req, res) => {
  try {
    let faults = validatePostSubscriptionRequest(req.body);
    if (faults.length > 0) {
      throw new StatusError(`One or more issues with the request: ${faults}`, 409);
    } 
    /*
    1. Payment
    2. Create Billing Object
    3. Create Subscription Object with reference to billing
    4. Return Status
    */
    let expiration = getExpiration(req.body.expiration);
    console.log(expiration);
    /*
    let payment = {
      amount: products[req.body.product], 
      card_number: req.body.card, 
      cvv: req.body.cvv,
      expiration_month: expiration.month,
      expiration_year: expiration.year,
      zip_cody: req.body.billing_zip
    };
    postPayment(PAYMENT_URL, payment).then((data) => {
      console.log(data);
    });
    */
    let fakePayment = {"token":"ABCDE","success":true,"error_code":null};
    let month = parseInt(expiration.month[expiration.month.length - 1]) + 1;
    let nmlMonth = expiration.month.split('');
    nmlMonth[nmlMonth.length - 1] = month.toString();
    console.log(nmlMonth);
    expiration.month = nmlMonth.join('');
    console.log(expiration)
    let billing = {
      token: fakePayment.token,
      cvv: req.body.cvv,
      expiration: `${expiration.year}-${expiration.month}-01`,
      zip: req.body.billing_zip 
    };
    let subscription = {
      name: req.body.name,
      address: req.body.address,
      zip: req.body.shipping_zip,
      token: fakePayment.token,
      boxId: req.body.product,
    };
    subscriptionTransaction(billing, subscription)
    .then(() => {
      res.status(204).send(`You are now subscribed to ${req.body.product}`);
    })
    .catch((err) => {
      throw err;
    })
  } catch(err) {
    console.log(err);
    res.status(err.status).send(err.message);
  }
  

});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Example app listening at http://localhost:${port}`)
  
})