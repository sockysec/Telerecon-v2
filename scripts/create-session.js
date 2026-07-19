import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";

const apiId = Number(process.env.TELEGRAM_API_ID);
const apiHash = process.env.TELEGRAM_API_HASH;

if (!apiId || !apiHash) {
  console.error("Set TELEGRAM_API_ID and TELEGRAM_API_HASH before running this script.");
  process.exit(1);
}

const rl = readline.createInterface({ input, output });
const client = new TelegramClient(new StringSession(""), apiId, apiHash, {
  connectionRetries: 4
});

await client.start({
  phoneNumber: () => rl.question("Phone number: "),
  password: () => rl.question("Two-step password, if enabled: "),
  phoneCode: () => rl.question("Login code: "),
  onError: (error) => console.error(error.message)
});

console.log("\nTELEGRAM_SESSION=");
console.log(client.session.save());
rl.close();
await client.disconnect();
