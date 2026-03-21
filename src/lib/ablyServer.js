import Ably from "ably";

let ablyRest = null;

export function getAblyRest() {
  if (!ablyRest) {
    ablyRest = new Ably.Rest(process.env.ABLY_API_KEY);
  }
  return ablyRest;
}