const express = require("express");
const UserRouter = require("./routes/user.js");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const bodyParser = express.json;
const PORT = process.env.PORT || 5000;


app.use(bodyParser());
app.use('/user', UserRouter);


mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log("mongodb connected!");
        app.listen(PORT, () => console.log(`server running on ${PORT}`));
    })
    .catch(error => console.log(error))