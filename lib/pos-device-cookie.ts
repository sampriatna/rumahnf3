import { cookies } from "next/headers";
import { POS_DEVICE_COOKIE } from "./pos-device-constants";

export { POS_DEVICE_COOKIE } from "./pos-device-constants";

export function readPosDeviceCookie(): string | undefined {
  return cookies().get(POS_DEVICE_COOKIE)?.value;
}
