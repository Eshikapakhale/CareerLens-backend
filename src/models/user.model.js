const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: [true, "Username already exists"]
    },
    email: {
        type: String,
        unique: [true, "Email already exists"],
        required: true
    },
    password: {
        type: String,
        required: true,
        minlength: [6, "Password must be at least 6 characters long"]
    }
 })

 const userModel = mongoose.model("Users", userSchema)
 module.exports = userModel