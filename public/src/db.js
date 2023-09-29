const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(

      "mongodb+srv://raghuveermustimalla:12112002@raghu.mcmvy9z.mongodb.net/?retryWrites=true&w=majority",

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