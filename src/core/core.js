import { decodeSuiPrivateKey } from "@mysten/sui/cryptography";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { Helper } from "../utils/helper.js";
import { Transaction } from "@mysten/sui/transactions";
import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";
import logger from "../utils/logger.js";
import { RPC } from "./network/rpc.js";

export default class Core {
  constructor(acc) {
    this.acc = acc;
    this.txCount = 0;
    this.client = new SuiClient({ url: getFullnodeUrl(RPC.NETWORK) });
  }

  async getAccountInfo() {
    try {
      await Helper.delay(500, this.acc, `Getting Account Information...`, this);
      const privateKey = decodeSuiPrivateKey(this.acc);
      this.wallet = Ed25519Keypair.fromSecretKey(privateKey.secretKey);
      this.address = this.wallet.getPublicKey().toSuiAddress();
      await Helper.delay(
        1000,
        this.acc,
        `Successfully Get Account Information`,
        this
      );
    } catch (error) {
      // console.error("Error fetching account info:", error);
      throw error;
    }
  }

  async mergeCoin(coinToMerge) {
    try {
      if (!coinToMerge.coin || coinToMerge.coin.length < 2) {
        await Helper.delay(
          1000,
          this.acc,
          `No Need to Merge ${coinToMerge.metadata.name} Coin`,
          this
        );
        return;
      }

      while (coinToMerge.coin.length > 2) {
        await Helper.delay(500, this.acc, `Merging Coin`, this);
        const tx = new Transaction();
        let targetCoin, coinToMerge;
        if (coinToMerge.coin[0].coinType == "0x2::sui::SUI") {
          targetCoin = coinToMerge.coin[1].coinObjectId;
          coinsToMerge = coinToMerge.coin
            .slice(2)
            .map((coin) => coin.coinObjectId);
        } else {
          targetCoin = coinToMerge.coin[0].coinObjectId;
          coinsToMerge = coinToMerge.coin
            .slice(1)
            .map((coin) => coin.coinObjectId);
        }
        await Helper.delay(
          1000,
          this.acc,
          `Merging ${coinsToMerge.length} of ${coinToMerge.metadata.name} `,
          this
        );
        await tx.mergeCoins(
          tx.object(targetCoin),
          coinsToMerge.map((coin) => tx.object(coin))
        );
        await this.executeTx(tx);
        await this.getBalance();
      }
    } catch (error) {
      throw error;
    }
  }
  async getBalance(msg = false) {
    try {
      if (msg)
        await Helper.delay(500, this.acc, `Getting Account Balance...`, this);
      const allBalance = await this.client.getAllBalances({
        owner: this.address,
      });
      this.balance = [];
      for (const item of allBalance) {
        const coin = await this.client.getCoins({
          owner: this.address,
          coinType: item.coinType,
        });

        const metadata = await this.client.getCoinMetadata({
          coinType: item.coinType,
        });

        item.coin = coin.data;
        item.metadata = metadata;
        item.totalBalance = new Intl.NumberFormat("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(
          parseFloat(
            Number(item.totalBalance) / Math.pow(10, metadata.decimals)
          )
        );
        // console.log(item);
        this.balance.push(item);
      }

      if (msg)
        await Helper.delay(
          1000,
          this.acc,
          `Successfully Get Account Balance`,
          this
        );
    } catch (error) {
      throw error;
    }
  }

  /**
   *
   * @param {Transaction} tx
   */
  async executeTx(tx) {
    try {
      await Helper.delay(1000, this.acc, `Executing Tx ...`, this);
      logger.info(await tx.toJSON());
      const txRes = await this.client.signAndExecuteTransaction({
        signer: this.wallet,
        transaction: tx,
      });
      await Helper.delay(
        3000,
        this.acc,
        `Tx Executed : ${`${RPC.EXPLORER}txblock/${txRes.digest}`}`,
        this
      );
      await this.getBalance();
    } catch (error) {
      throw error;
    }
  }
}
