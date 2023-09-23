const mongoose = require("mongoose");
// Create Schema

const Bookschema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  timeslot: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
});

// collection part
const collectionBook = new mongoose.model("book", Bookschema);

module.exports =collectionBook;