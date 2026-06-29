import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts || {};

const aggregateName = 'test:launch-gate';
const aggregate = scripts[aggregateName] || '';
const requiredScripts = [
  'test:launch-gate:backend',
  'test:launch-gate:web',
  'test:launch-gate:mobile',
  'test:launch-gate:ui-contracts',
];

const missingDefinitions = requiredScripts.filter((script) => !scripts[script]);
if (missingDefinitions.length > 0) {
  throw new Error(
    `Launch gate is missing script definitions: ${missingDefinitions.join(', ')}`,
  );
}

const missingFromAggregate = requiredScripts.filter((script) => {
  const pattern = new RegExp(`npm\\s+run\\s+${script.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
  return !pattern.test(aggregate);
});

if (missingFromAggregate.length > 0) {
  throw new Error(
    `${aggregateName} must include: ${missingFromAggregate.join(', ')}`,
  );
}

console.log(
  `Launch gate aggregate includes ${requiredScripts.length} required gates: ${requiredScripts.join(', ')}`,
);
