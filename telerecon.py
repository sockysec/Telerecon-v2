#!/usr/bin/env python3
"""
Telegram forward-network mapper.

Outputs graph JSON compatible with the browser mapper in this directory.
Requires Telethon:
  python3 -m pip install telethon
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import shutil
import subprocess
import sys
from collections import deque
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    from telethon import TelegramClient
    from telethon.errors import RPCError
    from telethon.tl.types import Channel, Chat, PeerChannel, PeerChat, PeerUser, User
except ModuleNotFoundError:
    TelegramClient = None
    RPCError = Exception

    class Channel:
        pass

    class Chat:
        pass

    class PeerChannel:
        pass

    class PeerChat:
        pass

    class PeerUser:
        pass

    class User:
        pass


@dataclass
class Node:
    id: str
    type: str = "unknown"
    seed: bool = False
    label: str | None = None
    created_at: str | None = None

    def as_dict(self) -> dict[str, Any]:
        data = {"id": self.id, "type": self.type, "seed": self.seed}
        if self.label:
            data["label"] = self.label
        if self.created_at:
            data["createdAt"] = self.created_at
        return data


@dataclass
class Edge:
    source: str
    target: str
    weight: int = 0
    evidence: list[str] = field(default_factory=list)
    timestamps: list[str] = field(default_factory=list)

    def as_dict(self) -> dict[str, Any]:
        data = {
            "source": self.source,
            "target": self.target,
            "weight": self.weight,
            "evidence": self.evidence,
        }
        if self.timestamps:
            data["timestamps"] = sorted(set(self.timestamps))
            data["firstSeenAt"] = data["timestamps"][0]
            data["lastSeenAt"] = data["timestamps"][-1]
        return data


class Graph:
    def __init__(self) -> None:
        self.nodes: dict[str, Node] = {}
        self.edges: dict[tuple[str, str], Edge] = {}
        self.scanned: set[str] = set()

    def add_node(
        self,
        node_id: str,
        node_type: str = "unknown",
        seed: bool = False,
        label: str | None = None,
        created_at: str | None = None,
    ) -> None:
        if not node_id:
            return
        existing = self.nodes.get(node_id)
        if existing:
            existing.seed = existing.seed or seed
            if existing.type == "unknown" and node_type != "unknown":
                existing.type = node_type
            if label and not existing.label:
                existing.label = label
            if created_at and not existing.created_at:
                existing.created_at = created_at
            return
        self.nodes[node_id] = Node(id=node_id, type=node_type, seed=seed, label=label, created_at=created_at)

    def add_edge(self, source: str, target: str, evidence: str, timestamp: str | None = None) -> None:
        if not source or not target or source == target:
            return
        key = (source, target)
        edge = self.edges.get(key)
        if not edge:
            edge = Edge(source=source, target=target)
            self.edges[key] = edge
        edge.weight += 1
        if evidence:
            edge.evidence.append(evidence)
        if timestamp:
            edge.timestamps.append(timestamp)

    def merge(self, other: "Graph") -> None:
        for node in other.nodes.values():
            self.add_node(node.id, node.type, node.seed, node.label, node.created_at)
        for edge in other.edges.values():
            merged = self.edges.get((edge.source, edge.target))
            if merged:
                merged.weight += edge.weight
                merged.evidence.extend(edge.evidence)
                merged.timestamps.extend(edge.timestamps)
            else:
                self.edges[(edge.source, edge.target)] = Edge(
                    source=edge.source,
                    target=edge.target,
                    weight=edge.weight,
                    evidence=list(edge.evidence),
                    timestamps=list(edge.timestamps),
                )
        self.scanned.update(other.scanned)

    def as_dict(self) -> dict[str, Any]:
        return {
            "exportedAt": datetime.now(timezone.utc).isoformat(),
            "nodes": [node.as_dict() for node in sorted(self.nodes.values(), key=lambda item: item.id)],
            "edges": [edge.as_dict() for edge in sorted(self.edges.values(), key=lambda item: (item.source, item.target))],
            "scanned": sorted(self.scanned),
        }


def normalize_peer(value: str) -> str:
    peer = str(value or "").strip()
    for prefix in ("https://t.me/", "http://t.me/", "t.me/"):
        if peer.lower().startswith(prefix):
            peer = "@" + peer[len(prefix) :]
    if "?" in peer:
        peer = peer.split("?", 1)[0]
    return peer.rstrip("/")


def classify(node_id: str) -> str:
    if node_id.startswith("@"):
        return "channel"
    if node_id.startswith("chat:"):
        return "chat"
    if node_id.startswith("user:") or node_id.startswith("private:"):
        return "user"
    if node_id.startswith("channel:"):
        return "channel"
    return "unknown"


def entity_id(entity: Any) -> str:
    username = getattr(entity, "username", None)
    if username:
        return f"@{username}"
    if isinstance(entity, User):
        if getattr(entity, "bot", False):
            return f"user:{entity.id}"
        name = " ".join(part for part in [entity.first_name, entity.last_name] if part)
        return f"user:{entity.id}" if not name else f"user:{entity.id}"
    if isinstance(entity, Channel):
        return f"channel:{entity.id}"
    if isinstance(entity, Chat):
        return f"chat:{entity.id}"
    entity_raw_id = getattr(entity, "id", None)
    return str(entity_raw_id) if entity_raw_id is not None else ""


def entity_label(entity: Any) -> str | None:
    username = getattr(entity, "username", None)
    if username:
        return username
    title = getattr(entity, "title", None)
    if title:
        return title
    if isinstance(entity, User):
        name = " ".join(part for part in [entity.first_name, entity.last_name] if part)
        return name or None
    return None


def iso_date(value: Any) -> str | None:
    if not value:
        return None
    if isinstance(value, datetime):
        if value.tzinfo is None:
            value = value.replace(tzinfo=timezone.utc)
        return value.astimezone(timezone.utc).isoformat()
    try:
        parsed = datetime.fromisoformat(str(value))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat()


def peer_fallback_id(peer: Any) -> str:
    if isinstance(peer, PeerChannel):
        return f"channel:{peer.channel_id}"
    if isinstance(peer, PeerChat):
        return f"chat:{peer.chat_id}"
    if isinstance(peer, PeerUser):
        return f"user:{peer.user_id}"
    return ""


async def resolve_peer_id(client: TelegramClient, peer: Any) -> tuple[str, str | None, str | None]:
    if not peer:
        return "", None, None
    try:
        entity = await client.get_entity(peer)
        return entity_id(entity), entity_label(entity), iso_date(getattr(entity, "date", None))
    except (ValueError, TypeError, RPCError):
        return peer_fallback_id(peer), None, None


async def resolve_forward_origin(client: TelegramClient, message: Any) -> tuple[str, str | None, str | None]:
    fwd = getattr(message, "forward", None) or getattr(message, "fwd_from", None)
    if not fwd:
        return "", None, None

    from_name = getattr(fwd, "from_name", None)
    if from_name:
        safe_name = " ".join(str(from_name).split())
        return f"private:{safe_name}", safe_name, None

    for attr in ("from_id", "saved_from_peer"):
        node_id, label, created_at = await resolve_peer_id(client, getattr(fwd, attr, None))
        if node_id:
            return node_id, label, created_at

    channel_id = getattr(fwd, "channel_id", None)
    if channel_id:
        return f"channel:{channel_id}", None, None
    return "", None, None


def evidence_for(source_id: str, message: Any) -> str:
    message_id = getattr(message, "id", None)
    if not message_id:
        return "forwarded message"
    if source_id.startswith("@"):
        return f"https://t.me/{source_id[1:]}/{message_id}"
    return f"{source_id}/{message_id}"


async def scan_forwards(client: TelegramClient, chat: str, limit: int = 0) -> Graph:
    graph = Graph()
    normalized = normalize_peer(chat)
    entity = await client.get_entity(normalized)
    source_id = entity_id(entity) or normalized
    graph.add_node(source_id, classify(source_id), seed=True, label=entity_label(entity), created_at=iso_date(getattr(entity, "date", None)))
    graph.scanned.add(source_id)

    async for message in client.iter_messages(entity, limit=None):
        origin_id, origin_label, origin_created_at = await resolve_forward_origin(client, message)
        if not origin_id:
            continue
        graph.add_node(origin_id, classify(origin_id), label=origin_label, created_at=origin_created_at)
        graph.add_edge(origin_id, source_id, evidence_for(source_id, message), iso_date(getattr(message, "date", None)))
    return graph


async def snowball_forwards(client: TelegramClient, seed: str, limit: int, depth: int, max_chats: int) -> Graph:
    graph = Graph()
    queue: deque[tuple[str, int]] = deque([(normalize_peer(seed), 0)])
    queued = {normalize_peer(seed)}

    while queue and len(graph.scanned) < max_chats:
        chat, current_depth = queue.popleft()
        if current_depth >= depth:
            continue
        if chat in graph.scanned:
            continue

        try:
            found = await scan_forwards(client, chat, limit)
        except (ValueError, RPCError) as error:
            print(f"[warn] skipped {chat}: {error}", file=sys.stderr)
            continue

        graph.merge(found)
        if current_depth + 1 >= depth:
            continue

        for edge in found.edges.values():
            if edge.source.startswith("@") and edge.source not in queued:
                queued.add(edge.source)
                queue.append((edge.source, current_depth + 1))

    return graph


def write_graph(graph: Graph, output: str | None) -> None:
    payload = json.dumps(graph.as_dict(), indent=2, ensure_ascii=False)
    if output:
        Path(output).write_text(payload + "\n", encoding="utf-8")
    else:
        print(payload)


def read_int_env(name: str) -> int | None:
    value = os.getenv(name)
    if not value:
        return None
    try:
        return int(value)
    except ValueError:
        return None


def build_client(args: argparse.Namespace) -> TelegramClient:
    if TelegramClient is None:
        raise SystemExit("Missing dependency: telethon. Install it with: python3 -m pip install telethon")
    api_id = args.api_id or read_int_env("TELEGRAM_API_ID")
    api_hash = args.api_hash or os.getenv("TELEGRAM_API_HASH")
    if not api_id or not api_hash:
        raise SystemExit("Set TELEGRAM_API_ID and TELEGRAM_API_HASH, or pass --api-id and --api-hash.")
    return TelegramClient(args.session, api_id, api_hash)


async def run_login(args: argparse.Namespace) -> None:
    client = build_client(args)
    await client.start()
    me = await client.get_me()
    print(f"Logged in as {entity_label(me) or entity_id(me)}")
    await client.disconnect()


async def run_scan(args: argparse.Namespace) -> None:
    client = build_client(args)
    await client.start()
    graph = await scan_forwards(client, args.chat, args.limit)
    write_graph(graph, args.output)
    await client.disconnect()


async def run_snowball(args: argparse.Namespace) -> None:
    client = build_client(args)
    await client.start()
    graph = await snowball_forwards(client, args.seed, args.limit, args.depth, args.max_chats)
    write_graph(graph, args.output)
    await client.disconnect()


def parser() -> argparse.ArgumentParser:
    base = argparse.ArgumentParser(
        description="Map Telegram forward networks and export browser-compatible graph JSON."
    )
    base.add_argument("--api-id", type=int, help="Telegram API ID. Defaults to TELEGRAM_API_ID.")
    base.add_argument("--api-hash", help="Telegram API hash. Defaults to TELEGRAM_API_HASH.")
    base.add_argument("--session", default=os.getenv("TELEGRAM_SESSION_FILE", "telerecon"), help="Telethon session name/path.")

    sub = base.add_subparsers(dest="command")

    app = sub.add_parser("app", help="Launch the local browser application.")
    app.add_argument("--host", default=os.getenv("HOST", "127.0.0.1"), help="Host for the local web server.")
    app.add_argument("--port", type=int, default=int(os.getenv("PORT", "5173")), help="Port for the local web server.")
    app.add_argument("--no-browser", action="store_true", help="Do not open the browser automatically.")
    app.set_defaults(func=run_app)

    sub.add_parser("login", help="Create or validate a local Telethon session.").set_defaults(func=run_login)

    scan = sub.add_parser("scan", help="Scan one chat/channel for forwarded-message origins.")
    scan.add_argument("chat", help="@channel, t.me URL, chat ID, or invite-resolved peer.")
    scan.add_argument("--limit", type=int, default=0, help=argparse.SUPPRESS)
    scan.add_argument("-o", "--output", help="Write graph JSON to a file instead of stdout.")
    scan.set_defaults(func=run_scan)

    snowball = sub.add_parser("snowball", help="Recursively scan discovered public channels.")
    snowball.add_argument("seed", help="Seed chat/channel.")
    snowball.add_argument("--limit", type=int, default=0, help=argparse.SUPPRESS)
    snowball.add_argument("--depth", type=int, default=2, help="Traversal depth.")
    snowball.add_argument("--max-chats", type=int, default=80, help="Hard cap on scanned chats.")
    snowball.add_argument("-o", "--output", help="Write graph JSON to a file instead of stdout.")
    snowball.set_defaults(func=run_snowball)

    return base


def run_app(args: argparse.Namespace) -> None:
    node = shutil.which("node")
    if not node:
        raise SystemExit("Node.js is required to launch the browser app. Install Node.js, then run python3 telerecon.py again.")

    env = os.environ.copy()
    env["HOST"] = args.host
    env["PORT"] = str(args.port)
    if args.no_browser:
        env["OPEN_BROWSER"] = "0"

    server_path = Path(__file__).with_name("server.js")
    if not server_path.exists():
        raise SystemExit(f"Missing server file: {server_path}")
    telegram_package = server_path.parent / "node_modules" / "telegram"
    if not telegram_package.exists():
        print("Node dependency 'telegram' is not installed.", file=sys.stderr)
        print("The browser will still open for manual mapping, but Telegram login and automation need:", file=sys.stderr)
        print("  npm install", file=sys.stderr)

    process = subprocess.Popen([node, str(server_path)], cwd=server_path.parent, env=env)
    try:
        process.wait()
    except KeyboardInterrupt:
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()


def main() -> None:
    args = parser().parse_args()
    if not hasattr(args, "func"):
        args = parser().parse_args(["app"])
    result = args.func(args)
    if asyncio.iscoroutine(result):
        asyncio.run(result)


if __name__ == "__main__":
    main()
