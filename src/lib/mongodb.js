import { MongoClient } from "mongodb";
// connection URI 
const uri = process.env.MONGODB_URI;
const options = {};


let client;
let clientPromise;

// Ensure the MongoDB URI is set
if (!process.env.MONGODB_URI) {
  throw new Error("Please add your MongoDB URI to .env.local");
}
// Create a new MongoClient
if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
