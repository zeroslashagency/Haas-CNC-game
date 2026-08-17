#!/usr/bin/env python3
"""
Haas USB local agent — lets the web keygen auto-detect pendrives and deploy HaasKey.txt.

Run once (no install, stdlib only):   python3 usb_agent.py
Then in the web app: USB drive key tab -> "Detect USB sticks" -> pick stick -> serial auto-fills
-> Auto Deploy writes HaasKey.txt straight to the stick.

Endpoints (bound to 127.0.0.1 only):
  GET  /sticks  -> [{"label","serial","mountpoint","device"}]
  POST /deploy  -> {"mountpoint": "...", "filename": "HaasKey.txt", "content": "<1024 hex>"}
"""
import json
import os
import platform
import re
import subprocess
from http.server import BaseHTTPRequestHandler, HTTPServer

PORT = 7932


def run(cmd):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=10).stdout
    except Exception:
        return ""


def sticks_macos():
    out = run(["system_profiler", "SPUSBDataType", "-json"])
    sticks = []
    try:
        data = json.loads(out)
    except Exception:
        return sticks

    def walk(node, serial):
        if isinstance(node, dict):
            serial = node.get("serial_num") or node.get("Serial Number") or serial
            name = node.get("_name", "USB stick")
            for media in node.get("Media", []) or []:
                for vol in media.get("volumes", []) or []:
                    mp = vol.get("mount_point") or vol.get("Mount Point")
                    if mp and mp != "/":
                        sticks.append({
                            "label": name,
                            "serial": (serial or "").strip(),
                            "mountpoint": mp,
                            "device": media.get("bsd_name", ""),
                        })
            for v in node.values():
                walk(v, serial)
        elif isinstance(node, list):
            for v in node:
                walk(v, serial)

    walk(data.get("SPUSBDataType", []), None)
    seen, uniq = set(), []
    for s in sticks:
        if s["mountpoint"] not in seen:
            seen.add(s["mountpoint"])
            uniq.append(s)
    return uniq


def sticks_linux():
    out = run(["lsblk", "-J", "-o", "NAME,MOUNTPOINT,SERIAL,TRAN,MODEL"])
    sticks = []
    try:
        data = json.loads(out)
    except Exception:
        return sticks
    for dev in data.get("blockdevices", []):
        if dev.get("tran") != "usb":
            continue
        serial = (dev.get("serial") or "").strip()
        model = (dev.get("model") or "USB stick").strip()
        mps = [c.get("mountpoint") for c in dev.get("children", []) if c.get("mountpoint")]
        mp = mps[0] if mps else dev.get("mountpoint")
        sticks.append({
            "label": model,
            "serial": serial,
            "mountpoint": mp or "",
            "device": "/dev/" + dev.get("name", ""),
        })
    return sticks


def sticks_windows():
    ps = (
        "$ErrorActionPreference='SilentlyContinue';"
        "$r=@();"
        "Get-WmiObject Win32_DiskDrive -Filter \"InterfaceType='USB'\" | ForEach-Object {"
        " $d=$_; $letter='';"
        " $p=Get-WmiObject -Query (\"ASSOCIATORS OF {Win32_DiskDrive.DeviceID='\" + $d.DeviceID.Replace('\\','\\\\') + \"'} WHERE AssocClass=Win32_DiskDriveToDiskPartition\");"
        " if($p){ $l=Get-WmiObject -Query (\"ASSOCIATORS OF {Win32_DiskPartition.DeviceID='\" + $p[0].DeviceID + \"'} WHERE AssocClass=Win32_LogicalDiskToPartition\"); if($l){ $letter=$l[0].DeviceID + '\\' } }"
        " $r += [pscustomobject]@{label=$d.Model; serial=($d.SerialNumber -replace '\\s',''); mountpoint=$letter; device=$d.DeviceID}"
        "};"
        "$r | ConvertTo-Json -Compress"
    )
    out = run(["powershell", "-NoProfile", "-Command", ps])
    try:
        data = json.loads(out) if out.strip() else []
    except Exception:
        return []
    if isinstance(data, dict):
        data = [data]
    return data


def list_sticks():
    sysname = platform.system()
    if sysname == "Darwin":
        return sticks_macos()
    if sysname == "Linux":
        return sticks_linux()
    if sysname == "Windows":
        return sticks_windows()
    return []


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self._send(200, {})

    def do_GET(self):
        if self.path == "/sticks":
            self._send(200, list_sticks())
        else:
            self._send(404, {"error": "unknown endpoint"})

    def do_POST(self):
        if self.path != "/deploy":
            return self._send(404, {"error": "unknown endpoint"})
        try:
            req = json.loads(self.rfile.read(int(self.headers.get("Content-Length", 0))))
            mp, name, content = req["mountpoint"], req.get("filename", "HaasKey.txt"), req["content"]
            if not os.path.isdir(mp):
                return self._send(400, {"error": f"mountpoint not found: {mp}"})
            if not re.fullmatch(r"[0-9A-Fa-f\s]+", content):
                return self._send(400, {"error": "content must be hex text"})
            path = os.path.join(mp, name)
            with open(path, "w") as f:
                f.write(content)
                f.flush()
                os.fsync(f.fileno())
            self._send(200, {"ok": True, "path": path, "bytes": len(content)})
        except Exception as e:
            self._send(500, {"error": str(e)})

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    print(f"Haas USB agent on http://127.0.0.1:{PORT}  (Ctrl+C to stop)")
    print("Detect now:  curl http://127.0.0.1:7932/sticks")
    HTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
