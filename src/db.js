const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(

      "mongodb+srv://sivaram:sivaram@cluster0.0u7y0h0.mongodb.net/DSA?retryWrites=true&w=majority",

      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    console.log("Database Connected Successfully");
  } catch (error) {
    console.error("Database Connection Error:", error);
  }
};

module.exports = connectDB;