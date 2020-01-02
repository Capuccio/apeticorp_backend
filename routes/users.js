const express = require("express");
const bcrypt = require("bcrypt");
const mysql = require("mysql");
const con = require("./connection/connectsql");

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
    "SELECT * FROM notifications WHERE id_users = ? ORDER BY id_notifications DESC";

  con.query(sql, [idUser], async (error, result) => {
    if (error) {
      console.log(
        `Error al consultar notificaciones del ID: ${idUser}. Error: ${error}`
      );
      res.json({
        error: true,
        title: "Error Query",
        msg: "Hubo un error al consultar las notificaciones"
      });
    }

    res.json({
      error: false,
      notifications: result
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
            "INSERT INTO users (use_name, use_lastname, use_email, use_password, use_mobile, use_numberefe, use_status, use_exchange_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [name, lastname, email, passwordHashes, mobile, 0, 1, 0],
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
    use_email
  } = req.body;

  const passwordHashed = use_password
    ? bcrypt.hashSync(use_password, saltRounds)
    : "";

  var sql;

  const updateQuery = async () => {
    if (!use_mobile.trim() && use_password.trim()) {
      sql =
        "UPDATE users SET use_name = " +
        mysql.escape(use_name) +
        ", use_lastname = " +
        mysql.escape(use_lastname) +
        ", use_email = " +
        mysql.escape(use_email) +
        ", use_password = " +
        mysql.escape(passwordHashed) +
        " WHERE id_users = " +
        mysql.escape(req.body.id_users);
    } else if (use_mobile.trim() && !use_password.trim()) {
      sql =
        "UPDATE users SET use_name = " +
        mysql.escape(use_name) +
        ", use_lastname = " +
        mysql.escape(use_lastname) +
        ", use_email = " +
        mysql.escape(use_email) +
        ", use_mobile = " +
        mysql.escape(use_mobile) +
        " WHERE id_users = " +
        mysql.escape(req.body.id_users);
    } else if (use_mobile.trim() && use_password.trim()) {
      sql =
        "UPDATE users SET use_name = " +
        mysql.escape(use_name) +
        ", use_lastname = " +
        mysql.escape(use_lastname) +
        ", use_email = " +
        mysql.escape(use_email) +
        ", use_password = " +
        mysql.escape(passwordHashed) +
        ", use_mobile = " +
        mysql.escape(use_mobile) +
        " WHERE id_users = " +
        mysql.escape(req.body.id_users);
    } else {
      sql =
        "UPDATE users SET use_name = " +
        mysql.escape(use_name) +
        ", use_lastname = " +
        mysql.escape(use_lastname) +
        ", use_email = " +
        mysql.escape(use_email) +
        " WHERE id_users = " +
        mysql.escape(req.body.id_users);
    }

    con.query(sql, function(err, updated) {
      if (err) {
        console.log(`Error update user: ${req.body.id_users}. Error: ${error}`);
        res.json({
          error: true,
          title: "Error de Actualización",
          msg:
            "Hubo un error al actualizar los datos, por favor intente más tarde"
        });
      }

      res.json({
        error: false,
        title: "Datos actualizados",
        msg: "Los datos se han guardado exitosamente"
      });
    });
  };

  sql = "SELECT * FROM users WHERE use_email = " + mysql.escape(use_email);

  con.query(sql, function(err, validateEmail) {
    if (err) {
      console.log(err);
      res.json({
        error: true,
        msg: "Error en consultas"
      });
    }

    if (validateEmail.length > 0) {
      if (id_users != validateEmail[0].id_users) {
        res.json({
          error: true,
          title: "Correo existente",
          msg: "El correo insertado ya lo posee otra persona"
        });
      } else {
        updateQuery();
      }
    } else {
      updateQuery();
    }
  });
});

module.exports = route;
