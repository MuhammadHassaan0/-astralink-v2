"""
eval/run_smoke.py
Quick smoke test — hits the local /kai/chat endpoint with eval questions.

Usage:
    python eval/run_smoke.py
"""

import json
import sys
import urllib.request
from pathlib import Path

BASE_URL  = "http://localhost:8000"
QUESTIONS = json.loads((Path(__file__).parent / "questions.json").read_text())


def ask(question: str) -> str:
    payload = json.dumps({
        "messages": [{"role": "user", "content": question}]
    }).encode()

    req = urllib.request.Request(
        f"{BASE_URL}/kai/chat",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    tokens = []
    with urllib.request.urlopen(req, timeout=30) as resp:
        for raw_line in resp:
            line = raw_line.decode().strip()
            if line.startswith("data: "):
                try:
                    evt = json.loads(line[6:])
                    if evt.get("type") == "token":
                        tokens.append(evt.get("content", ""))
                except Exception:
                    pass
    return "".join(tokens)


def main():
    print("=== Kai Smoke Test ===\n")
    passed = 0
    for item in QUESTIONS:
        q = item["question"]
        print(f"Q: {q}")
        try:
            answer = ask(q)
            print(f"A: {answer[:300]}")
            passed += 1
        except Exception as e:
            print(f"ERROR: {e}")
        print()

    print(f"Passed: {passed}/{len(QUESTIONS)}")
    sys.exit(0 if passed == len(QUESTIONS) else 1)


if __name__ == "__main__":
    main()
