require("./config/db.js");
const express = require("express");
const UserRouter = require("./routes/user.js");

const app = express();
const bodyParser = express.json;
const PORT = process.env.PORT || 5000;


app.use(bodyParser());
app.use('/user', UserRouter);

app.listen(PORT, () => {
    console.log(`server running on ${PORT}`);
})