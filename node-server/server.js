require("dotenv").config(); // set up env variables
// const express = require("express");
// const path = require("path");
var app = require("./app");
var PORT = process.env.PORT || 5000;

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static("../client/build"));
//   app.get("*", (req, res) => {
//     res.sendFile(
//       path.resolve(__dirname, "../", "client", "build", "index.html")
//     );
//   });
// }

app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));
