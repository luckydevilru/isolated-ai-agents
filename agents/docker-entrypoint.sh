#!/bin/sh
set -e

USER_NAME=node
USER_ID=1000
USER_GROUP=1000

# === Fix ownership of $HOME state volumes ===
# Volumes (agent-config / agent-opencode / agent-openchamber) may have been
# populated by root (e.g. during a first `docker compose up` before the
# unprivileged user took effect). Re-own them to the runtime user so the
# agent tools can create their config/run dirs.
# NOTE: these are PODMAN/Docker named volumes, NOT host bind mounts, so
# chowning does not affect the host user (iboss). Host bind mounts under
# /var/www are left untouched.
chown -R "${USER_ID}:${USER_GROUP}" \
    /home/node/.config \
    /home/node/.opencode \
    /home/node/.openchamber \
    /home/node/.cache \
    /home/node/.local \
    2>/dev/null || true

export HOME=/home/node

drop() {
    exec setpriv --reuid="${USER_ID}" --regid="${USER_GROUP}" --init-groups "$@"
}

# === Auto-start OpenChamber (Web UI) in the background as node user ===
if [ -n "${OPENCHAMBER_UI_PASSWORD}" ]; then
    setpriv --reuid="${USER_ID}" --regid="${USER_GROUP}" --init-groups \
        openchamber --ui-password "${OPENCHAMBER_UI_PASSWORD}" >/tmp/openchamber.log 2>&1 &
fi

# === Default: keep the container alive as the unprivileged user ===
if [ "$#" -eq 0 ]; then
    exec setpriv --reuid="${USER_ID}" --regid="${USER_GROUP}" --init-groups tail -f /dev/null
fi

# === Otherwise: run the supplied command as the unprivileged user ===
drop "$@"
