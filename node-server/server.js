require("dotenv").config(); // set up env variables
var app = require("./app");
var PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on PORT ${PORT}`));
