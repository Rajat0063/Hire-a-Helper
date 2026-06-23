// !! MongoDB Atlas connector — reads MONGO_URI from backend/.env
const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing in .env");
  await mongoose.connect(uri);
  console.log("[db] MongoDB Atlas connected");
}

module.exports = connectDB;
