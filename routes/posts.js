const express = require("express");
const request = require("request");
const { IMGUR_API } = require("../api");
const Posts = require("../models/posts");
require("dotenv").config();

const route = express();

route.get("/posts/:page/:status", async (req, res) => {
  const { page, status } = req.params;
  const limit = 10;

  Posts.find({ status })
    .skip(page * limit - limit)
    .limit(limit)
    .sort({ _id: -1 })
    .exec(function(error, posts) {
      if (error) {
        console.log(error);
        res.json({
          error: true,
          title: "Error Query",
          msg: "Ha ocurrido un error en la consulta de los Posts"
        });
      }

      res.status(200).json({
        error: false,
        posts
      });
    });
});

route.get("/post/:idPost", async (req, res) => {
  const { idPost } = req.params;

  Posts.findById(idPost, function(error, post) {
    if (error) {
      console.log("No se pudo obtener el Post, Error: ", error);

      res.json({
        error: true,
        title: "Error Query",
        msg: "Error al obtener datos del Post"
      });
    }

    res.json({
      error: false,
      post
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
        title: "Error Query",
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

route.get("/post/:idPost/deletecomment/:idUser", async (req, res) => {
  const { idPost, idUser } = req.params;

  Posts.findById(idPost).exec(function(err, post) {
    if (err) {
      console.log("Error Edit: ", err);
      res.json({
        error: true,
        title: "Error Edit",
        msg: "Hubo un error para editar los comentarios"
      });
    }

    for (let i = 0; i < post.comments.length; i++) {
      if (post.comments[i].id_user == idUser) {
        post.comments.splice(i, 1);
      }
    }

    Posts.findByIdAndUpdate(idPost, post, function(error, commentsUpdated) {
      if (error) {
        console.log("Error Update: ", err);
        res.json({
          error: true,
          title: "Error Update",
          msg: "Hubo un error al actualizar los comentarios"
        });
      }

      res.json({
        error: false,
        title: "Comentario Eliminado",
        msg:
          "Comentario eliminado, recargue la página para observar los cambios"
      });
    });
  });
});

route.post("/createposts", async (req, res) => {
  const { media, id_user, postText, userName } = req.body;

  let options = {
    method: "POST",
    url: `${IMGUR_API}/upload`,
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
        `No se logro subir la imagen a Imgur del usuario: ${userName} con el ID: ${id_user}. Error: ${err}`
      );

      res.json({
        error: true,
        title: "Error Query",
        msg: "Hubo un error al subir la imagen, por favor intente más tarde"
      });
    }

    let { data, success, status } = JSON.parse(response.body);

    if (success && status == 200) {
      let savePost = new Posts({
        id_user: id_user,
        contentText: postText,
        contentMedia: data.link,
        deleteHash: data.deletehash,
        status: 0
      });

      savePost.save(function(err, post) {
        if (err) {
          console.log(
            `No se logro guardar los datos de la imagen del usuario ${userName} con el ID ${id_user}. Error: ${err}`
          );

          res.json({
            error: true,
            title: "Error Save",
            msg: "Hubo un error al subir la imagen, por favor intente más tarde"
          });
        }

        res.json({
          error: false,
          title: "Imagen subida",
          msg:
            "La imagen se ha subido exitosamente, debe esperar a que el Administrador lo apruebe para que se pueda visualizar en la pantalla principal"
        });
      });
    } else {
      console.log(
        `Error en la API de Imgur, success: ${success} & status: ${status}`
      );

      res.json({
        error: true,
        title: "Error API",
        msg:
          "Hubo un error al tratar de subir la imágen, por favor intente más tarde"
      });
    }
  });
});

route.post("/commentpost", async (req, res) => {
  const { idPost, idUser, comment } = req.body;
  Posts.findByIdAndUpdate(
    idPost,
    { $push: { comments: { id_user: idUser, comment, status: 0 } } },
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

route.post("/acceptpost", async (req, res) => {
  const { idPost } = req.body;

  Posts.findByIdAndUpdate(idPost, { status: 1 }, function(error, updated) {
    if (error) {
      console.log(
        `Hubo un error al aceptar el Post ${idPost}. Error: ${error}`
      );

      res.json({
        error: true,
        title: "Error Update",
        msg:
          "Hubo un error al aceptar el Post, por favor reportar este problema"
      });
    }

    res.json({
      error: false,
      title: "Post aceptado",
      msg: "EL post se ha aceptado con éxito."
    });
  });
});

route.post("/deletepost", async (req, res) => {
  const { idPost } = req.body;

  Posts.findById(idPost).exec((error, postData) => {
    let options = {
      method: "DELETE",
      url: `${IMGUR_API}/image/${postData.deleteHash}`,
      headers: {
        Authorization: `Client-ID ${process.env.CLIENT_ID}`
      }
    };

    request(options, function(error, response) {
      if (error) {
        console.log(
          `Error en el Request para eliminar el Post ${idPost}. Error: ${error}`
        );

        res.json({
          error: true,
          title: "Error Backend",
          msg: "Hubo un error en el Request"
        });
      }

      const { success, status } = JSON.parse(response.body);

      if (success && status == 200) {
        Posts.findByIdAndRemove(idPost, function(error, result) {
          if (error) {
            console.log(`Error al eliminar el Post ${idPost}. Error: ${error}`);
            res.json({
              error: true,
              title: "Error Query",
              msg: "Error al intentar eliminar Post"
            });
          }

          res.json({
            error: false,
            title: "Post Eliminado",
            msg: "Se eliminó el Post sin problemas"
          });
        });
      } else {
        console.log(
          `Error al intentar eliminar la imagen del Post de la API ${idPost}`
        );

        res.json({
          error: true,
          title: "Error API",
          msg: "Hubo un error al intentar eliminar el Post"
        });
      }
    });
  });
});

module.exports = route;
