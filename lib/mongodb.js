const mongoose = require('mongoose')

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI

if (!MONGO_URI) {
   throw new Error('MONGO_URI environment variable is missing')
}

let cached = global.mongoose

if (!cached) {
   cached = global.mongoose = {
      conn: null,
      promise: null
   }
}

const connectDB = async () => {
   if (cached.conn) {
      return cached.conn
   }

   if (!cached.promise) {
      cached.promise = mongoose.connect(MONGO_URI, {
         bufferCommands: false,
         serverSelectionTimeoutMS: 5000
      })
   }

   cached.conn = await cached.promise

   return cached.conn
}

module.exports = { connectDB }
