import Ably from "ably";

let ablyClient = null;

export function getAblyClient() {
  if (!ablyClient) {
    ablyClient = new Ably.Realtime({
      authUrl: "/api/ably/auth",
    });
  }

  return ablyClient;
}