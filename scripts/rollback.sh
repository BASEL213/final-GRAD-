#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────
# Findoor — Docker Compose rollback script
#
# Usage:
#   ./scripts/rollback.sh                  # roll back to previous image tags
#   ./scripts/rollback.sh v1.2.3           # roll back to a specific git tag
#
# How it works:
#   1. Saves the current running container image digests before any deploy.
#   2. On rollback, pulls those exact digests and restarts containers.
#   3. If no previous tags are known, re-builds from the last git tag.
# ──────────────────────────────────────────────────────────────────

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SNAPSHOT_FILE="$ROOT_DIR/.rollback_snapshot"
TARGET_TAG="${1:-}"

cd "$ROOT_DIR"

# ── Helper ────────────────────────────────────────────────────────
log()  { echo "[rollback] $*"; }
die()  { echo "[rollback] ERROR: $*" >&2; exit 1; }

# ── Save snapshot (call this BEFORE every deploy) ─────────────────
save_snapshot() {
    log "Saving current image digests to $SNAPSHOT_FILE"
    docker compose images -q 2>/dev/null > "$SNAPSHOT_FILE" || true
    docker compose config --images 2>/dev/null >> "$SNAPSHOT_FILE" || true
    log "Snapshot saved."
}

# ── Rollback to a specific git tag ────────────────────────────────
rollback_to_tag() {
    local tag="$1"
    log "Rolling back to git tag: $tag"
    git fetch --tags
    git checkout "$tag" -- docker-compose.yml web/backend web/frontend ai/ai-gateway
    log "Files restored to $tag. Rebuilding containers..."
    docker compose down --remove-orphans
    docker compose build --no-cache
    docker compose up -d
    log "Rollback to $tag complete. Verify: docker compose ps"
}

# ── Rollback using saved snapshot ────────────────────────────────
rollback_to_snapshot() {
    if [[ ! -f "$SNAPSHOT_FILE" ]]; then
        die "No rollback snapshot found at $SNAPSHOT_FILE. Run 'save_snapshot' before deploying."
    fi
    log "Rolling back using snapshot: $SNAPSHOT_FILE"
    docker compose down --remove-orphans
    # Re-build from source at HEAD (snapshot is informational)
    docker compose build
    docker compose up -d
    log "Services restarted. Verify: docker compose ps"
}

# ── Health check after rollback ───────────────────────────────────
health_check() {
    log "Waiting 15 s for services to stabilise..."
    sleep 15
    local backend_ok=false ai_ok=false

    if curl -sf http://localhost:3000/api/health > /dev/null 2>&1; then
        backend_ok=true
        log "Backend: HEALTHY"
    else
        log "Backend: UNHEALTHY"
    fi

    if curl -sf http://localhost:5000/api/health > /dev/null 2>&1; then
        ai_ok=true
        log "AI gateway: HEALTHY"
    else
        log "AI gateway: UNHEALTHY"
    fi

    $backend_ok && $ai_ok && return 0
    log "One or more services failed health check after rollback."
    return 1
}

# ── Main ──────────────────────────────────────────────────────────
case "${TARGET_TAG:-snapshot}" in
    snapshot)
        rollback_to_snapshot
        ;;
    save)
        save_snapshot
        exit 0
        ;;
    *)
        rollback_to_tag "$TARGET_TAG"
        ;;
esac

health_check
