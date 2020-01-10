const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const mongoose = require("mongoose");

const app = express();

app.use("/Themes", express.static("Themes"));
app.use(cors());
app.use(express.urlencoded({ limit: "1000mb", extended: true }));
app.use(express.json({ limit: "1000mb", extended: true }));
app.use(fileUpload());

/** Connect to MongoDB (MongoDB Atlas) */

const URI = "mongodb://localhost/apeticorp";

// const URI =
//   "mongodb+srv://Capuccio:WxujZDNwF0Ltx0tq@apeticorpcluster-hrm4x.mongodb.net/apeticorp?retryWrites=true&w=majority";

mongoose
  .connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(answer => console.log("DataBase MongoDB Connected"))
  .catch(err => console.log(`Couldn't connect to DataBase MongoDB: ${err}`));

/** Routes */
app.use(require("./routes/users"));
app.use(require("./routes/posts"));
app.use(require("./routes/admins"));

/** Starting API */
app.set("port", process.env.PORT || 5000);

app.listen(app.get("port"), () =>
  console.log(`API ready listen ${app.get("port")} port`)
);
