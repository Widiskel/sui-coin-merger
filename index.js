import { privateKey } from "./accounts/accounts.js";
import Core from "./src/core/core.js";
import { Helper } from "./src/utils/helper.js";
import logger from "./src/utils/logger.js";

async function operation(acc) {
  const core = new Core(acc);
  try {
    await core.getAccountInfo();
    await core.getBalance(true);
    for (const item of core.balance) {
      await core.mergeCoin(item);
    }

    await Helper.delay(
      1000,
      acc,
      `Account ${privateKey.indexOf(acc) + 1} Processing Done`,
      core
    );
  } catch (error) {
    if (error.message) {
      await Helper.delay(
        10000,
        acc,
        `Error : ${error.message}, Retry again after 10 Second`,
        core
      );
    } else {
      await Helper.delay(
        10000,
        acc,
        `Error :${JSON.stringify(error)}, Retry again after 10 Second`,
        core
      );
    }
    await operation(acc);
  }
}

async function startBot() {
  return new Promise(async (resolve, reject) => {
    try {
      logger.info(`TOOL STARTED`);
      if (privateKey.length == 0)
        throw Error("Please input your account first on accounts.js file");
      const promiseList = [];

      for (const acc of privateKey) {
        promiseList.push(operation(acc));
      }

      await Promise.all(promiseList);
      resolve();
    } catch (error) {
      logger.info(`TOOL STOPPED`);
      logger.error(JSON.stringify(error));
      reject(error);
    }
  });
}

(async () => {
  try {
    logger.clear();
    logger.info("");
    logger.info("Application Started");
    console.log("SUI COIN MERGER");
    console.log();
    console.log("By : Widiskel");
    console.log("Follow On : https://github.com/Widiskel");
    console.log("Join Channel : https://t.me/skeldrophunt");
    console.log("Dont forget to run git pull to keep up to date");
    console.log();
    console.log();
    Helper.showSkelLogo();
    if (privateKey.length < 1) throw Error("Please set up accounts.js first");
    await startBot();
  } catch (error) {
    console.log("Error During executing bot", error);
    throw error;
  }
})();
