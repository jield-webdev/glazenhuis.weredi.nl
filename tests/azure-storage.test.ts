import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, readlinkSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { type TestContext } from "node:test";

function fixture(t: TestContext) {
  const root = mkdtempSync(join(tmpdir(), "glazenhuis-azure-uploads-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const app = join(root, "app");
  const storage = join(root, "share");
  const bin = join(root, "bin");
  for (const dir of [app, storage, bin, join(app, "apps/cms")]) mkdirSync(dir, { recursive: true });
  copyFileSync(new URL("../deploy/azure/cms-start.sh", import.meta.url), join(app, "start.sh"));
  // Simulate the Azure mount and Strapi process; exercise real filesystem operations.
  writeFileSync(join(bin, "mountpoint"), '#!/bin/sh\n[ "$MOUNT_STATE" = mounted ]\n', { mode: 0o755 });
  writeFileSync(join(bin, "node"), '#!/bin/sh\nprintf started > "$START_MARKER"\n', { mode: 0o755 });
  const marker = join(root, "started");
  return {
    app, storage, bin, marker,
    uploads: join(app, "apps/cms/public/uploads"),
    start(overrides: Record<string, string> = {}) {
      rmSync(marker, { force: true });
      return spawnSync("bash", [join(app, "start.sh")], {
        encoding: "utf8",
        env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, CMS_UPLOADS_PATH: storage,
          MOUNT_STATE: "mounted", START_MARKER: marker, ...overrides },
      });
    },
  };
}

test("uploads survive restart and replacement of the deployed application", t => {
  const f = fixture(t);
  assert.equal(f.start().status, 0);
  assert.equal(readlinkSync(f.uploads), f.storage);
  writeFileSync(join(f.uploads, "image.png"), "uploaded media");
  assert.equal(f.start().status, 0);
  rmSync(join(f.app, "apps/cms/public"), { recursive: true });
  assert.equal(f.start().status, 0);
  assert.equal(readFileSync(join(f.uploads, "image.png"), "utf8"), "uploaded media");
  assert.ok(existsSync(f.marker));
});

test("an ordinary directory without a storage mount blocks CMS startup", t => {
  const f = fixture(t);
  const result = f.start({ MOUNT_STATE: "missing" });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not mounted/);
  assert.equal(existsSync(f.marker), false);
  assert.equal(existsSync(f.uploads), false);
});

test("unwritable storage blocks CMS startup", t => {
  const f = fixture(t);
  writeFileSync(join(f.bin, "mktemp"), "#!/bin/sh\nexit 1\n", { mode: 0o755 });
  const result = f.start();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /not writable/);
  assert.equal(existsSync(f.marker), false);
});

test("existing upload files are preserved and require explicit migration", t => {
  const f = fixture(t);
  mkdirSync(f.uploads, { recursive: true });
  writeFileSync(join(f.uploads, "existing.png"), "keep this");
  assert.notEqual(f.start().status, 0);
  assert.equal(lstatSync(f.uploads).isSymbolicLink(), false);
  assert.equal(readFileSync(join(f.uploads, "existing.png"), "utf8"), "keep this");
  assert.equal(existsSync(f.marker), false);
});

test("old upload links are replaced without changing their contents", t => {
  const f = fixture(t);
  const old = join(f.app, "old-uploads");
  mkdirSync(old);
  mkdirSync(join(f.app, "apps/cms/public"));
  writeFileSync(join(old, "image.png"), "original");
  symlinkSync(old, f.uploads);
  assert.equal(f.start().status, 0);
  assert.equal(readlinkSync(f.uploads), f.storage);
  assert.equal(readFileSync(join(old, "image.png"), "utf8"), "original");
});

test("an empty upload directory can be replaced by the storage link", t => {
  const f = fixture(t);
  mkdirSync(f.uploads, { recursive: true });
  assert.equal(f.start().status, 0);
  assert.equal(readlinkSync(f.uploads), f.storage);
});
