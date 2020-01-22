const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql");
const request = require("request");
const { IMGUR_API } = require("../api");
const con = require("./connection/connectsql");
require("dotenv").config();

const saltRounds = 10;

const route = express();

route.get("/user/:idUser", async (req, res) => {
  const { idUser } = req.params;

  con.query(
    "SELECT * FROM users WHERE id_users = ?",
    [idUser],
    async (err, result) => {
      if (err) {
        console.log(err);
        res.json({
          error: true,
          title: "Error de Query",
          msg: "Error al consultar el usuario"
        });
      }

      delete result[0].use_password;
      delete result[0].use_mobile;
      delete result[0].use_deleteHashPicture;
      delete result[0].use_exchange_status;

      const user = result[0];

      res.json({
        error: false,
        user
      });
    }
  );
});

route.get("/referredusers/:idUser", async (req, res) => {
  const { idUser } = req.params;

  con.query(
    "SELECT * FROM referrals WHERE id_sponsor = ?",
    [idUser],
    async (error, result) => {
      if (error) {
        console.log(`Error al consultar referidos del ID ${idUser}: `, error);
        res.json({
          error: true,
          title: "Error Consulta",
          msg: "Hubo un error al consultar los referidos"
        });
      }

      res.json({
        error: false,
        referred: result
      });
    }
  );
});

route.get("/exchange/:idUser", async (req, res) => {
  const { idUser } = req.params;

  let sql = "SELECT * FROM users WHERE id_users = ?";

  con.query(sql, [idUser], async (error, dataUser) => {
    if (error) {
      console.log(
        `Hubo un error al tratar de consultar los puntos del ID: ${idUser}. Error: `,
        error
      );

      res.json({
        error: true,
        title: "Error Query",
        msg: "Error al consultar sus datos de usuario"
      });
    }

    if (dataUser[0].use_numberefe < 50) {
      res.json({
        error: true,
        title: "Insuficiente",
        msg: "No cumple con la cantidad requerida para canjear"
      });
    } else {
      let sql = "UPDATE users SET use_exchange_status = ? WHERE id_users = ?";

      con.query(sql, [1, idUser], async (error, result) => {
        if (error) {
          console.log(
            `Hubo un error al tratar de actualizar el estatus de canjeo del ID: ${idUser}. Error: `,
            error
          );

          res.json({
            error: true,
            title: "Error Update",
            msg:
              "Error al actualizar sus datos, por favor comuníquese con un administrador"
          });
        }

        res.json({
          error: false,
          title: "Canjeado",
          msg:
            "Sus puntos han sido canjeados, deberá esperar la revisión del Administrador"
        });
      });
    }
  });
});

route.get("/notifications/:idUser", async (req, res) => {
  const { idUser } = req.params;

  let sql =
    "SELECT * FROM notifications WHERE id_users = ? ORDER BY id_notifications DESC LIMIT 10";

  con.query(sql, [idUser, 1], async (error, result) => {
    if (error) {
      console.log(
        `Error al consultar notificaciones del ID: ${idUser}. Error: ${error}`
      );
      res.json({
        error: true,
        title: "Error Query",
        msg:
          "Hubo un error al consultar las notificaciones, por favor reportar este problema"
      });
    }

    res.json({
      error: false,
      notifications: result
    });
  });
});

route.get("/updatenotifications/:idUser", async (req, res) => {
  const { idUser } = req.params;

  let sql = "UPDATE notifications SET not_status = ? WHERE id_users = ?";

  con.query(sql, [0, idUser], function(error, updated) {
    if (error) {
      console.log(
        `Error al actualizar el Status de las Notificaciones del ID: ${idUser}. Error: ${error}`
      );

      res.json({
        error: true,
        title: "Error Update",
        msg:
          "Hubo un error al actualizar las notificaciones, por favor reportar este problema"
      });
    }

    res.json({
      error: false
    });
  });
});

route.post("/register", (req, res) => {
  const { name, lastname, email, mobile, password, codrefe } = req.body;

  if (name.trim() && lastname.trim() && email.trim() && mobile.trim()) {
    con.query(
      "SELECT use_email FROM users WHERE use_email = ? OR use_mobile = ?",
      [email, mobile],
      async (err, result) => {
        if (err) throw err;

        if (result.length === 0) {
          const passwordHashes = await bcrypt.hash(password, saltRounds);

          con.query(
            "INSERT INTO users (use_name, use_lastname, use_email, use_password, use_level, use_mobile, use_numberefe, use_status, use_exchange_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [name, lastname, email, passwordHashes, 1, mobile, 0, 1, 0],
            (err, result) => {
              if (err) throw err;

              if (codrefe.trim()) {
                con.query(
                  "SELECT * FROM users WHERE id_users = ?",
                  [codrefe],
                  (err, resultSponsor) => {
                    if (err) throw err;

                    if (resultSponsor) {
                      let newNumberRefe =
                        resultSponsor[0].use_numberefe < 50
                          ? resultSponsor[0].use_numberefe + 1
                          : resultSponsor[0].use_numberefe;

                      con.query(
                        "UPDATE users SET use_numberefe = ? WHERE id_users = ?",
                        [newNumberRefe, resultSponsor[0].id_users],
                        async (err, result) => {
                          if (err) throw err;

                          con.query(
                            "SELECT * FROM users WHERE use_email = ? AND use_password = ?",
                            [email, passwordHashes],
                            (err, resultReferred) => {
                              if (err) throw err;

                              con.query(
                                "INSERT INTO referrals (id_referred, id_sponsor) VALUES (?, ?)",
                                [
                                  resultReferred[0].id_users,
                                  resultSponsor[0].id_users
                                ],
                                (err, result) => {
                                  if (err) throw err;
                                }
                              );
                            }
                          );
                        }
                      );
                    }
                  }
                );
              }

              res.status(200).json({
                error: false,
                msg: "Usuario creado"
              });
            }
          );
        } else {
          res.status(200).json({
            error: true,
            msg: "Email o Celular ya registrados"
          });
        }
      }
    );
  } else {
    res.status(200).json({
      error: true,
      msg: "Debe llenar todos los campos"
    });
  }
});

route.post("/login", (req, res) => {
  const { email, pass } = req.body;

  if (!email.trim() || !pass.trim()) {
    res.status(200).json({
      error: true,
      msg: "Debe rellenar todos los campos"
    });
  } else {
    sql = "SELECT * FROM users WHERE use_email = ?";
    con.query(sql, [email], async (err, result) => {
      if (err) throw err;

      if (result.length === 0) {
        res.status(400).json({
          error: true,
          msg: "El correo ingresado no existe"
        });
      } else {
        const similar = await bcrypt.compare(pass, result[0].use_password);

        delete result[0].use_password;
        delete result[0].use_mobile;
        delete result[0].use_deleteHashPicture;
        delete result[0].use_exchange_status;

        if (similar) {
          res.status(200).json({
            error: false,
            msg: result[0]
          });
        } else {
          res.status(401).json({
            error: true,
            msg: "Clave incorrecta"
          });
        }
      }
    });
  }
});

route.post("/update", async (req, res) => {
  const {
    id_users,
    use_mobile,
    use_password,
    use_name,
    use_lastname,
    use_email,
    media
  } = req.body;

  const passwordHashed = use_password
    ? bcrypt.hashSync(use_password, saltRounds)
    : "";

  var sql;

  if (media.length > 0) {
    con.query("SELECT * FROM users WHERE id_users = ?", [id_users], function(
      error,
      data
    ) {
      if (error) {
        console.log(
          `Hubo un error al consultar la imagen de perfil del ID ${id_users}. Error: ${error}`
        );

        res.json({
          error: true,
          title: "Error Query",
          msg:
            "Hubo un error al intentar consultar su antigua foto, por favor reporte este fallo"
        });
      }

      if (data[0].use_picture != "NULL") {
        let options = {
          method: "DELETE",
          url: `${IMGUR_API}/image/${data[0].use_deleteHashPicture}`,
          headers: {
            Authorization: `Client-ID ${process.env.CLIENT_ID}`
          }
        };

        request(options, function(error, response) {
          if (error) {
            console.log(
              `Hubo un error al intentar eliminar la antigua foto de perfil del ID ${id_users}, deleteHash ${data.use_deleteHashPicture}. Error: ${error}`
            );

            res.json({
              error: true,
              title: "Error Query",
              msg:
                "Hubo un error al intentar remover su antigua foto, por favor reporte este fallo"
            });
          }
        });
      }
    });

    let options = {
      method: "POST",
      url: `${IMGUR_API}/image`,
      headers: {
        Authorization: `Client-ID ${process.env.CLIENT_ID}`
      },
      formData: {
        image: media
      }
    };

    request(options, function(error, response) {
      if (error) {
        console.log(
          `Hubo un error al subir la foto de perfil de ${use_name} ${use_lastname} ID ${id_users}. Error: ${error}`
        );

        res.json({
          error: true,
          title: "Error Query",
          msg:
            "Hubo un error al intentar subir su nueva foto, por favor reporte este fallo"
        });
      }

      let { data, success, status } = JSON.parse(response.body);

      if (success && status == 200) {
        sql =
          "UPDATE users SET use_picture = " +
          mysql.escape(data.link) +
          ", use_deleteHashPicture = " +
          mysql.escape(data.deletehash) +
          " WHERE id_users = " +
          mysql.escape(id_users);

        con.query(sql, function(error, updated) {
          if (error) {
            console.log(
              `Hubo un error al actualizar la foto en la base de datos del ID ${id_users}. Error: ${error}`
            );
            res.json({
              error: true,
              title: "Error Query",
              msg:
                "Hubo un error al intentar guardar los datos de su nueva foto, por favor reporte este fallo"
            });
          }
        });
      } else {
        console.log(
          `La API de Imgur respondió error al intentar subir la foto de perfil del ID ${id_users}. Error: ${error}`
        );
        res.json({
          error: true,
          title: "Error Query",
          msg:
            "Hubo un error al intentar subir su nueva foto, por favor reporte este fallo"
        });
      }
    });
  }

  sql =
    "UPDATE users SET use_name = " +
    mysql.escape(use_name) +
    ", use_lastname = " +
    mysql.escape(use_lastname) +
    ", use_email = " +
    mysql.escape(use_email);

  if (use_mobile.length > 0 && passwordHashed.length > 0) {
    sql = sql.concat(
      ", use_mobile = " +
        mysql.escape(use_mobile) +
        ", use_password = " +
        mysql.escape(passwordHashed)
    );
  } else if (use_mobile.length > 0) {
    sql = sql.concat(", use_mobile = " + mysql.escape(use_mobile));
  } else if (passwordHashed.length > 0) {
    sql = sql.concat(", use_password = " + mysql.escape(passwordHashed));
  }

  sql = sql.concat(" WHERE id_users = " + mysql.escape(id_users));

  con.query(sql, function(error, updated) {
    if (error) {
      console.log(
        `No se logró actualizar la data del ID ${id_users}. Error: ${error}`
      );

      res.json({
        error: true,
        title: "Error Query",
        msg:
          "Hubo un error al tratar de actualizar sus datos, por favor reporte este fallo"
      });
    } else {
      res.json({
        error: false,
        title: "Datos actualizados",
        msg: "Sus datos han sido actualizados sin problemas"
      });
    }
  });
});

module.exports = route;
