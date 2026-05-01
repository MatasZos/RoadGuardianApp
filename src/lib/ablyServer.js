// file to initialize ably REST server using the Ably library
import Ably from "ably";

let ablyRest = null;

//checks if ablyrest client is already initialized
//if not, creates a new instance using the API key from environment variables and returns it.
export function getAblyRest() {
  if (!ablyRest) {
    ablyRest = new Ably.Rest(process.env.ABLY_API_KEY);
  }
  return ablyRest;
}