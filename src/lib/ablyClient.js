// file to initialize ably realtime client using the Ably library
import Ably from "ably";

let ablyClient = null;
//checks if ablyrest client is already initialized
//if not, creates a new instance using the API key from environment variables and returns it.
export function getAblyClient() {
  if (!ablyClient) {
    ablyClient = new Ably.Realtime({
      authUrl: "/api/ably/auth",
    });
  }

  return ablyClient;
}