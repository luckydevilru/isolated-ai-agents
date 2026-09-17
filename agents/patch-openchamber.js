#!/usr/bin/env node
// Idempotent patch for @openchamber/web upgrade endpoint.
//
// Problem: POST /api/opencode/upgrade proxies synchronously to the managed
// OpenCode server's /global/upgrade with NO timeout. If the binary download /
// self-replace stalls, the browser hangs and eventually dies with
// net::ERR_TIMED_OUT.
//
// This patch adds a bounded timeout (AbortSignal.timeout) to that upstream
// request and converts an abort/network failure into a clean JSON error
// instead of an endless hang.
//
// Supports the two known layouts of routes.js:
//   web@1.21.0  ->  body: JSON.stringify(target ? { target } : {})
//   web@1.23.x  ->  body: JSON.stringify({ target: targetResolution.target })
//
// SCOPE: one-time fix, applies only to @openchamber/web <= 1.24.0. Versions
// above 1.24.0 are skipped without touching the file (notice + exit 0),
// because the upstream fix / a changed route layout is expected there.
//
// Safe to re-run: it bails out if the marker comment is already present, and
// refuses to touch the file if no known upgrade block is found (e.g. a future
// OpenChamber version changed the route).

'use strict';

const fs = require('fs');
const path = require('path');

const TARGET = process.argv[2] || '/usr/local/lib/node_modules/@openchamber/web/server/lib/opencode/routes.js';
const MARKER = 'openchamber-patch: upgrade request timeout';

const VARIANT_1_21 = {
  label: 'web@1.21.0',
  old: `      const upgradeOperation = (async () => {
        const response = await fetch(buildOpenCodeUrl('/global/upgrade', ''), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...getOpenCodeAuthHeaders(),
          },
          body: JSON.stringify(target ? { target } : {}),
        });`,
  next: `      const upgradeOperation = (async () => {
        // ${MARKER} [web@1.21.x]
        let response;
        try {
          response = await fetch(buildOpenCodeUrl('/global/upgrade', ''), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              ...getOpenCodeAuthHeaders(),
            },
            body: JSON.stringify(target ? { target } : {}),
            signal: AbortSignal.timeout(120_000),
          });
        } catch (fetchError) {
          const timedOut = fetchError?.name === 'TimeoutError' || fetchError?.name === 'AbortError';
          return {
            status: timedOut ? 503 : 502,
            body: {
              success: false,
              code: timedOut ? 'OPENCODE_UPGRADE_TIMEOUT' : 'OPENCODE_UPGRADE_REQUEST_FAILED',
              error: timedOut
                ? 'OpenCode upgrade request timed out after 120s. The binary download may be blocked or the network slow; retry or upgrade manually.'
                : (fetchError instanceof Error ? fetchError.message : 'Failed to reach the OpenCode upgrade endpoint'),
            },
          };
        }`,
};

const VARIANT_1_23 = {
  label: 'web@1.23.x',
  old: `        const response = await fetch(buildOpenCodeUrl('/global/upgrade', ''), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...getOpenCodeAuthHeaders(),
          },
          body: JSON.stringify({ target: targetResolution.target }),
        });`,
  next: `        // ${MARKER} [web@1.23.x]
        let response;
        try {
          response = await fetch(buildOpenCodeUrl('/global/upgrade', ''), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              ...getOpenCodeAuthHeaders(),
            },
            body: JSON.stringify({ target: targetResolution.target }),
            signal: AbortSignal.timeout(120_000),
          });
        } catch (fetchError) {
          const timedOut = fetchError?.name === 'TimeoutError' || fetchError?.name === 'AbortError';
          return {
            status: timedOut ? 503 : 502,
            body: {
              success: false,
              code: timedOut ? 'OPENCODE_UPGRADE_TIMEOUT' : 'OPENCODE_UPGRADE_REQUEST_FAILED',
              error: timedOut
                ? 'OpenCode upgrade request timed out after 120s. The binary download may be blocked or the network slow; retry or upgrade manually.'
                : (fetchError instanceof Error ? fetchError.message : 'Failed to reach the OpenCode upgrade endpoint'),
            },
          };
        }`,
};

const VARIANTS = [VARIANT_1_21, VARIANT_1_23];

function readInstalledVersion(routesDir) {
  const pkgPath = path.join(routesDir, '../../../package.json');
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return typeof pkg.version === 'string' && pkg.version ? pkg.version : null;
  } catch (_error) {
    return null;
  }
}

function isAbove1_24_0(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(String(version).trim());
  if (!match) return null;
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);
  return major > 1 || (major === 1 && (minor > 24 || (minor === 24 && patch > 0)));
}

function main() {
  if (!fs.existsSync(TARGET)) {
    console.error(`patch-openchamber: target not found: ${TARGET}`);
    process.exit(1);
  }

  let source;
  try {
    source = fs.readFileSync(TARGET, 'utf8');
  } catch (error) {
    console.error(`patch-openchamber: cannot read ${TARGET}: ${error.message}`);
    process.exit(1);
  }

  if (source.includes(MARKER)) {
    console.log('patch-openchamber: already applied, nothing to do');
    return;
  }

  const installedVersion = readInstalledVersion(path.dirname(TARGET));
  if (installedVersion === null) {
    console.error(
      'patch-openchamber: cannot determine installed @openchamber/web version ' +
      `(package.json alongside ${TARGET}) — refusing to patch.`
    );
    process.exit(1);
  }

  const aboveScope = isAbove1_24_0(installedVersion);
  if (aboveScope === null) {
    console.error(
      `patch-openchamber: cannot parse version "${installedVersion}" — refusing to patch.`
    );
    process.exit(1);
  }

  if (aboveScope) {
    console.log(
      `patch-openchamber: @openchamber/web ${installedVersion} is above 1.24.0 — ` +
      'the one-time patch does not apply. No changes made.'
    );
    return;
  }

  const match = VARIANTS.find((variant) => source.includes(variant.old));
  if (!match) {
    console.error(
      `patch-openchamber: expected upgrade block not found in @openchamber/web ${installedVersion} — ` +
      'the route layout may have changed. No changes made.'
    );
    process.exit(1);
  }

  const backupPath = `${TARGET}.bak`;
  if (!fs.existsSync(backupPath)) {
    fs.writeFileSync(backupPath, source);
    console.log(`patch-openchamber: backup written to ${backupPath}`);
  }

  const patched = source.replace(match.old, match.next);
  if (patched === source) {
    console.error('patch-openchamber: internal error — replacement produced no change');
    process.exit(1);
  }

  fs.writeFileSync(TARGET, patched, 'utf8');
  console.log(`patch-openchamber: applied upgrade timeout (${match.label}) to ${TARGET}`);
}

main();