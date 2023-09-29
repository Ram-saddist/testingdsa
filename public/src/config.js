const mongoose = require('mongoose');

// Create Schema
const Loginschema = new mongoose.Schema({
    firstname: {
        type:String,
        required: true
    },
    email: { 
        type: String, 
        unique: true,
        required: true 
    },
    password: {
        type: String,
        required: true
    },
    phone_number:{
        type:String,
        required:true
    },
    hash: {
        type: String,
        required: false,
        default: '',
        trim: true,
        private: true,
    }
});

// collection part
const collection = new mongoose.model("users", Loginschema);

module.exports = collection;