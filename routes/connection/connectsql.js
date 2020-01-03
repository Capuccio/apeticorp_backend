const mysql = require("mysql");

// Freesqldatabase
const connection = mysql.createConnection({
  host: "sql10.freesqldatabase.com",
  user: "sql10317545",
  password: "gXXIzxSp2Y",
  database: "sql10317545"
});

connection.connect(err => {
  err
    ? console.log(`Couldn't connect to MariaDB ${err}`)
    : console.log("DataBase MariaDB Connected");
});

module.exports = connection;
