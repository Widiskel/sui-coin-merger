import { Config } from "../../../config/config.js";

export class RPC {
  static NETWORK = Config.RPC.NETWORK ?? "testnet";
  static EXPLORER = `https://${
    Config.RPC.NETWORK != "mainnet" ? Config.RPC.NETWORK : ""
  }.suivision.xyz/`;
}
