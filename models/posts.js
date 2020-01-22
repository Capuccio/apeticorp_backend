const { Schema, model } = require("mongoose");

const PostsSchema = Schema({
  id_user: Number,
  contentText: String,
  contentMedia: String,
  likesNumber: Array,
  comments: [
    {
      id_user: Number,
      comment: String,
      status: Number
    }
  ],
  deleteHash: String,
  status: Number
});

module.exports = model("Posts", PostsSchema);
