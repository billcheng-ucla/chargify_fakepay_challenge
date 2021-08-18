### Steps to Run:

Dependencies:
1. node
2. MySQL


1. Clone this repo
2. Change to the repo in cmd
3. In cmd `npm i`
4. In cmd create a directory named 'config'
5. Add a file named 'default.json' to the 'config' directory
6. write this to 'default.json'
```JSON
{
	"dbConfig": {
		"host": "localhost",
		"port": <port>,
		"user": <user>,
		"password": <password>
	},
	"fakepay_api_key": <fakepay_api_key>
}
```
Where user and password is username and password for MySQL database

7. In cmd `node createDB.js`
8. In cmd `node createTables.js`
9. In cmd `nodemon`
10. Now you can send api requests to http://localhost:3000/api/subscriptions