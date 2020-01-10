const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql");
const con = require("./connection/connectsql");

const saltRounds = 10;

const route = express();

route.post("/adm/login", async (req, res) => {
  const { email, password } = req.body;

  let sql =
    "SELECT * FROM administrator WHERE adm_email = " + mysql.escape(email);

  con.query(sql, async function(error, result) {
    if (error) {
      console.log(error);

      res.json({
        error: true,
        msg: "Error en la consulta Query al iniciar sesión"
      });
    }

    if (result.length <= 0) {
      res.json({
        error: true,
        msg: "El email introducido no existe en la Base de Datos"
      });
    } else {
      let match = await bcrypt.compare(password, result[0].adm_password);

      if (!match) {
        res.json({
          error: true,
          msg: "La clave introducida no es correcta"
        });
      } else {
        res.json({
          error: false,
          data: result[0]
        });
      }
    }
  });
});

module.exports = route;
