import { enroll as sdkEnroll } from "@elementaio/vox-sdk";
import type { Identity } from "@elementaio/vox-sdk";
import { httpBase } from "./server";

/**
 * Browser binding: redeem a join token against THIS relay (the SDK does the
 * signed request; we supply the relay origin).
 */
export const enroll = (identity: Identity, token: string): Promise<boolean> =>
  sdkEnroll(identity, httpBase(), token);
