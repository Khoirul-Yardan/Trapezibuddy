#!/usr/bin/env python3
"""
Bridge script for Electron chat UI -> Python AI backend.
Uses existing AIController and ActionExecutor from the Python app.
"""

import argparse
import io
import json
import logging
import sys
from contextlib import redirect_stdout


def _configure_logging_silent() -> None:
    """Avoid polluting stdout because Electron expects pure JSON output."""
    root = logging.getLogger()
    root.handlers.clear()
    root.setLevel(logging.CRITICAL)


def _run(message: str, execute_actions: bool) -> dict:
    from ai.ai_controller import AIController

    ai_controller = AIController()
    result = ai_controller.process_command(message)

    actions_executed = 0
    if execute_actions:
        from system.action_executor import ActionExecutor

        action_executor = ActionExecutor()
        actions = result.get("actions", [])

        if actions:
            for action_data in actions:
                action_name = action_data.get("action")
                params = action_data.get("parameters", {})
                ok = action_executor.execute(action_name, params)
                if ok:
                    actions_executed += 1
        elif result.get("action"):
            action_name = result.get("action")
            params = result.get("parameters", {})
            ok = action_executor.execute(action_name, params)
            if ok:
                actions_executed += 1

    return {
        "response": result.get("response", "Hmm, aku belum paham. Coba ulangi ya."),
        "intent": result.get("intent", "unknown"),
        "actions_executed": actions_executed,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--message", required=True, help="User chat message")
    parser.add_argument(
        "--execute-actions",
        action="store_true",
        help="Execute returned actions via ActionExecutor",
    )
    args = parser.parse_args()

    _configure_logging_silent()

    # Capture any accidental stdout from imported modules/loggers.
    swallowed = io.StringIO()
    try:
        with redirect_stdout(swallowed):
            payload = _run(args.message, args.execute_actions)
    except Exception as exc:
        payload = {
            "response": f"Python bridge error: {exc}",
            "intent": "error",
            "actions_executed": 0,
        }
        print(json.dumps(payload, ensure_ascii=False))
        return 1

    print(json.dumps(payload, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
