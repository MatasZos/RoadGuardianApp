import { MongoClient } from "mongodb";

const uri = "mongodb+srv://admin:pass@roadguardiancluster.kpvvhx4.mongodb.net/?appName=roadguardiancluster";
const options = {};

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}
clientPromise = global._mongoClientPromise;

export default clientPromise;
