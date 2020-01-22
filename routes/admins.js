const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql");
const request = require("request");
const { IMGUR_API } = require("../api");
const con = require("./connection/connectsql");
require("dotenv").config();

const saltRounds = 10;

const route = express();

route.get("/exchangeofusers", async (req, res) => {
  let sql =
    "SELECT * FROM users WHERE use_exchange_status = ? ORDER BY id_users DESC";

  con.query(sql, [1], function(error, result) {
    if (error) {
      console.log(
        "Hubo un error al tratar de consultar los usuarios que canjearon. Error: ",
        error
      );

      res.json({
        error: true,
        title: "Error Select",
        msg: "Hubo un error al intentar obtener los usuarios que han canjeado"
      });
    }

    res.json({
      error: false,
      result
    });
  });
});

route.get("/allusers/:page", async (req, res) => {
  let { page } = req.params;
  let limit = page * 20 - 20;

  let sql = `SELECT * FROM users ORDER BY id_users DESC LIMIT ?, 20`;

  con.query(sql, [limit], async (err, result) => {
    if (err) {
      console.log(err);
      res.json({
        error: true,
        title: "Error Select",
        msg: "Error al consultar los usuarios"
      });
    }

    res.json({
      error: false,
      result
    });
  });
});

route.post("/adm/login", async (req, res) => {
  const { email, password } = req.body;

  let sql =
    "SELECT * FROM users WHERE use_email = " +
    mysql.escape(email) +
    " AND use_level = 2";

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
      let match = await bcrypt.compare(password, result[0].use_password);

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

route.post("/modifyuser", async (req, res) => {
  const { idUser, idOption } = req.body;

  if (idOption === 2) {
    let sql = "SELECT * FROM users WHERE id_users = ?";
    con.query(sql, [idUser], function(error, userData) {
      if (error) {
        console.log(
          `Hubo un error al intentar consultar los datos del usuario ID ${idUser}. Error: ${error}`
        );

        res.json({
          error: true,
          title: "Error Select",
          msg:
            "Hubo un error al intentar eliminar la foto de perfil del usuario"
        });
      }

      let options = {
        method: "POST",
        url: `${IMGUR_API}/image/${userData[0].use_deleteHashPicture}`,
        headers: {
          Authorization: `Client-ID ${process.env.CLIENT_ID}`
        }
      };

      request(options, function(error, response) {
        if (error) {
          console.log(
            `Hubo un error con la API de Imgur al intentar eliminar la foto de perfil del ID ${idUser}. Error: ${error}`
          );

          res.json({
            error: true,
            title: "Error API",
            msg:
              "Hubo un error con la API Imgur al intentar eliminar la foto de perfil del usuario"
          });
        }

        const { success, status } = JSON.parse(response.body);

        if (success && status == 200) {
          con.query(
            "UPDATE users SET use_picture = ?, use_deleteHashPicture = ? WHERE id_users = ?",
            [null, null, idUser],
            function(error, updated) {
              if (error) {
                console.log(
                  `Hubo un error al actualizar los datos en la BD del ID ${idUser}. Error: ${error}`
                );

                res.json({
                  error: true,
                  title: "Update Table",
                  msg: "Hubo un error al actualizar los datos en la BD"
                });
              }

              res.json({
                error: false,
                title: "Imagen Eliminada",
                msg:
                  "La foto de perfil del usuario ha sido eliminada correctamente"
              });
            }
          );
        }
      });
    });
  } else {
    let newStatus = idOption === 1 ? 0 : 1;

    con.query(
      "UPDATE users SET use_status = ? WHERE id_users = ?",
      [newStatus, idUser],
      function(error, updated) {
        if (error) {
          console.log(
            `Hubo un error al intentar modificar el estatus del ID ${idUser}. Error: ${error}`
          );

          res.json({
            error: true,
            title: "Error update",
            msg: "Hubo un error al intentar modificar el estatus del usuario"
          });
        }

        let status = newStatus === 0 ? "desactivado" : "activado";
        res.json({
          error: false,
          title: newStatus === 0 ? "Usuario desactivado" : "Usuario activado",
          msg: `El usuario ha sido ${status} exitosamente`
        });
      }
    );
  }
});

route.post("/warnuser", async (req, res) => {
  const { text, idUser } = req.body;

  let sql =
    "INSERT INTO notifications (id_users, not_message, not_status) VALUES (?, ?, ?)";

  con.query(sql, [idUser, text, 1], function(error, inserted) {
    if (error) {
      console.log(
        `Hubo un error al intentar insertar la advertencia al usuario ID ${idUser}. Error: ${error}`
      );

      res.json({
        error: true,
        title: "Error Insert",
        msg: "Hubo un error al intentar enviar la advertencia al usuario"
      });
    }

    res.json({
      error: false,
      title: "Advertencia Enviada",
      msg: "La advertencia fue enviada al usuario con éxito"
    });
  });
});

route.post("/updatexchange", async (req, res) => {
  const { idUser } = req.body;

  let sql =
    "UPDATE users SET use_exchange_status = ?, use_numberefe = ? WHERE id_users = ?";

  con.query(sql, [0, 0, idUser], function(error, updated) {
    if (error) {
      console.log(
        `Hubo un error al actualizar el estatus y numeros de referidos del ID ${idUser}. Error: ${error}`
      );

      res.json({
        error: true,
        title: "Error Update",
        msg: "Hubo un error al actualizar el estatus y numeros de referidos"
      });
    }

    res.json({
      error: false,
      title: "Canjeo aceptado",
      msg: "El canejo ha sido aceptado con éxito"
    });
  });
});

module.exports = route;
