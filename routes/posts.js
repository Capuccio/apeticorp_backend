const fs = require("fs");
const path = require("path");
const express = require("express");
const Posts = require("../models/posts");

const route = express();

route.get("/posts/:page", async (req, res) => {
  const { page } = req.params;
  const limit = 4;

  Posts.find({ status: 0 })
    .skip(page * limit - limit)
    .limit(limit)
    .sort({ _id: -1 })
    .exec(function(error, posts) {
      if (error) {
        console.log(error);
        res.status(500).json({
          error: true,
          server: true,
          msg: "Ha ocurrido un error en la consulta de los Posts"
        });
      }

      res.status(200).json({
        error: false,
        posts
      });
    });
});

route.get("/postcomments/:idPost", async (req, res) => {
  const { idPost } = req.params;

  await Posts.findById(idPost, "comments").exec(function(err, postcomments) {
    if (err) {
      console.log("Error al consultar comentarios del Post ", idPost);
      res.json({
        error: true,
        msg: "Hubo un error al consultar los mensajes del Post"
      });
    } else {
      res.json({
        error: false,
        postcomments
      });
    }
  });
});

route.post("/createposts", async (req, res) => {
  let imagePath = path.normalize(
    `./Themes/${req.body.type}/${req.body.id_user}`
  );

  if (!fs.existsSync(imagePath)) {
    fs.mkdirSync(imagePath, { recursive: true }, err => {
      if (err) console.log(err);
    });
  }

  let imagePathName = path.join(imagePath, req.body.name);

  fs.writeFile(imagePathName, req.body.media, "base64", function(err) {
    if (err) {
      console.log(
        `No se logro guardar la imagen ${req.body.name} en la carpeta ${req.body.id_user}: ${err}`
      );

      res.json({
        error: true,
        msg: "Hubo un error al subir la imagen, por favor intente más tarde"
      });
    }

    let savePost = new Posts({
      id_user: req.body.id_user,
      contentText: req.body.postText,
      contentMedia: imagePathName,
      status: 0
    });

    savePost.save(function(err, post) {
      if (err) {
        console.log(
          `No se logro guardar la imagen ${req.body.name} en la carpeta ${req.body.id_user}: ${err}`
        );

        res.json({
          error: true,
          msg: "Hubo un error al subir la imagen, por favor intente más tarde"
        });
      }

      res.json({
        error: false,
        msg:
          "La imagen se ha subido exitosamente, debe esperar a que el Administrador lo apruebe para que se pueda visualizar en la pantalla principal"
      });
    });
  });
});

route.post("/commentpost", async (req, res) => {
  const { idPost, idUser, comment } = req.body;
  Posts.findByIdAndUpdate(
    idPost,
    { $push: { comments: { id_user: idUser, comment } } },
    function(err, pushed) {
      if (err) {
        console.log("Error to save: ", err);
        res.json({
          error: true,
          msg: "Error al guardar comentario"
        });
      }

      res.json({
        error: false,
        msg: "Comentario posteado chaval"
      });
    }
  );
});

route.post("/likepost", async (req, res) => {
  const { idPost, idUser } = req.body;

  Posts.findById(idPost).exec(function(err, post) {
    if (err) {
      console.log("Error Update: ", err);
      res.json({
        error: true,
        msg: "Hubo un error al consultar los Likes"
      });
    }

    if (post.likesNumber.indexOf(idUser) > -1) {
      post.likesNumber.splice(post.likesNumber.indexOf(idUser), 1);
    } else {
      post.likesNumber.push(idUser);
    }

    Posts.findByIdAndUpdate(idPost, post, function(err, likeupdated) {
      if (err) {
        console.log("Error Update: ", err);
        res.json({
          error: true,
          msg: "Hubo un error al actualizar los Likes"
        });
      }

      res.json({
        error: false,
        msg: "Like actualizado"
      });
    });
  });
});

module.exports = route;
