const mongoose = require("mongoose");

const initDB = () => {
  mongoose
    .connect(
      `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_URI_STRING}?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    )
    .then(() => console.log("Connected to database"))
    .catch((err) => console.log("Failed to connect to database", err));
};

module.exports = initDB;