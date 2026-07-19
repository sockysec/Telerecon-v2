# Telerecon Browser Mapper

A minimalist dark-mode graph tool for mapping Telegram forward networks. It supports manual edge mapping in the browser and optional automated forward scanning through a local Telegram MTProto bridge.

## Run

```bash
npm install
npm start
```

`npm start` hosts the app locally and opens it in your default browser at `http://127.0.0.1:5173`.
`npm install` is required for Telegram login and automation because it installs GramJS (`telegram`).

You can also launch the browser app through the Python entrypoint:

```bash
python3 telerecon.py
```

Use the power button in the top-left toolbar to stop the local server from the browser.

For headless runs, disable auto-open:

```bash
OPEN_BROWSER=0 npm start
python3 telerecon.py app --no-browser
```

The UI can also be opened directly with `index.html` for manual mapping, import, and export. Automated Telegram scanning requires the Node server.

## Telegram automation

The app opens in manual mapping mode before any API key is configured. Create an app at `https://my.telegram.org`, run the local server, then open Settings in the browser UI when you want Telegram automation.

Settings guides you through:

1. Enter API ID, API hash, and phone number.
2. Send a Telegram verification code.
3. Enter the code.
4. Enter your two-step password only if Telegram asks for it.

After login, the generated GramJS string session is saved locally.

Saved settings are written to `.telerecon-settings.json` with `0600` file permissions and are ignored by git. The server never sends the API hash or session back to the browser after saving. Environment variables still work and override saved settings:

```bash
TELEGRAM_API_ID=12345 TELEGRAM_API_HASH=your_hash TELEGRAM_SESSION=your_string_session npm start
```

To create a string session after installing dependencies:

```bash
TELEGRAM_API_ID=12345 TELEGRAM_API_HASH=your_hash npm run session
```

The bridge uses the `telegram` package (GramJS). It scans recent messages in a seed chat/channel, extracts forwarded-message origins, and creates directed edges from the origin to the chat where the forward was observed.

Snowball mode repeats that scan across discovered public `@channels` up to the configured depth and hard-caps traversal to keep runs bounded.

## Python CLI

Install the Python dependency:

```bash
python3 -m pip install -r requirements.txt
```

Create or validate a local Telethon session:

```bash
TELEGRAM_API_ID=12345 TELEGRAM_API_HASH=your_hash python3 telerecon.py login
```

Scan one channel or chat for forwarded-message origins:

```bash
TELEGRAM_API_ID=12345 TELEGRAM_API_HASH=your_hash python3 telerecon.py scan @seed_channel --limit 200 -o graph.json
```

Snowball across discovered public channels:

```bash
TELEGRAM_API_ID=12345 TELEGRAM_API_HASH=your_hash python3 telerecon.py snowball @seed_channel --depth 2 --limit 100 --max-chats 50 -o graph.json
```

Import `graph.json` into the browser mapper with the Data panel.

## Data format

Exported data is JSON:

```json
{
  "nodes": [{ "id": "@seed", "type": "channel", "seed": true }],
  "edges": [{ "source": "@origin", "target": "@seed", "weight": 3, "evidence": ["@seed/42"] }]
}
```

The importer also accepts simple line-based edge lists:

```text
@origin @target optional evidence
@another,@target
```
