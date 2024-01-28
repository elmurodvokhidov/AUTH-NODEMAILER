const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    email: String,
    password: String
});

const User = mongoose.model("User", UserSchema);

module.exports = User;