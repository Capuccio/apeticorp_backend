const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "apeticorp"
});

// Viveres Natali
// const connection = mysql.createConnection({
//   host: "www.viveresnatali.com",
//   user: "c4jose",
//   password: "Ister*2020",
//   database: "c4jose"
// });

connection.connect(err => {
  err
    ? console.log(`Couldn't connect to MariaDB ${err}`)
    : console.log("DataBase MariaDB Connected");
});

module.exports = connection;
