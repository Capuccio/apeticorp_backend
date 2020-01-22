const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "apeticorp"
});

connection.connect(err => {
  err
    ? console.log(`Couldn't connect to MariaDB ${err}`)
    : console.log("DataBase MariaDB Connected");
});

module.exports = connection;
