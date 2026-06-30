import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const mobileDir = path.join(repoRoot, 'mobile');
const flutterExe = process.platform === 'win32' ? 'flutter.bat' : 'flutter';

const pathLookup = spawnSync(
  process.platform === 'win32' ? 'where' : 'which',
  ['flutter'],
  { encoding: 'utf8' },
);
const pathCandidates = pathLookup.status === 0
  ? pathLookup.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)
  : [];

const candidates = [
  process.env.FLUTTER_BIN,
  ...pathCandidates,
  path.join(repoRoot, '..', 'tools', 'flutter', 'bin', flutterExe),
  path.join(repoRoot, '..', '..', 'tools', 'flutter', 'bin', flutterExe),
  process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'flutter', 'bin', flutterExe) : '',
  process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'development', 'flutter', 'bin', flutterExe) : '',
  process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'Documents', 'Codex', 'tools', 'flutter', 'bin', flutterExe) : '',
  process.platform === 'win32' ? `C:\\src\\flutter\\bin\\${flutterExe}` : '',
  process.platform === 'win32' ? `C:\\flutter\\bin\\${flutterExe}` : '',
].filter(Boolean);

const flutter = candidates.find((candidate) => fs.existsSync(candidate));
if (!flutter) {
  throw new Error(
    `Flutter executable was not found. Set FLUTTER_BIN or install Flutter. Checked: ${candidates.join(', ')}`,
  );
}

const run = (args) => {
  console.log(`mobile launch gate: ${flutter} ${args.join(' ')}`);
  const result = process.platform === 'win32'
    ? spawnSync([flutter, ...args].map((value) => `"${String(value).replace(/"/g, '\\"')}"`).join(' '), {
      cwd: mobileDir,
      env: process.env,
      shell: true,
      stdio: 'inherit',
    })
    : spawnSync(flutter, args, {
      cwd: mobileDir,
      env: process.env,
      shell: false,
      stdio: 'inherit',
    });
  if (result.status !== 0) {
    throw new Error(`Flutter command failed: flutter ${args.join(' ')}`);
  }
};

run(['pub', 'get']);
run(['analyze']);
run(['test']);
