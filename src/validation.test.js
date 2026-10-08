import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { validate } from './index.js';
const base = { name: 'test', domain: 'Automatia', kingdom: 'Monagentia', phylum: 'Amnesia', evolutionClass: 'Lysenkoism', order: 'Glaciomutas', family: 'Homoselectae', genus: 'Generalis' };
test('validate rejects malformed external input without throwing', () => {
  for (const value of [null, undefined, [], 1, 'text']) assert.equal(validate(value).valid, false);
  for (const name of [42, true, {}, '   ']) assert.equal(validate({ ...base, name }).valid, false);
});
test('validate checks optional counts, epithet and gene types', () => {
  for (const field of ['numSkills', 'numCrons', 'numRules']) {
    for (const value of [-1, 1.5, NaN, Infinity, '20']) assert.equal(validate({ ...base, [field]: value }).valid, false);
    assert.equal(validate({ ...base, [field]: 0 }).valid, true);
  }
  for (const value of [42, {}, null]) assert.equal(validate({ ...base, customEpithet: value }).valid, false);
  for (const value of ['gene', [42], null]) assert.equal(validate({ ...base, notableGenes: value }).valid, false);
  assert.equal(validate({ ...base, customEpithet: '', notableGenes: ['memory'] }).valid, true);
});
test('CLI rejects unknown commands instead of starting a questionnaire', () => {
  const result = spawnSync(process.execPath, ['bin/cli.js', 'typo'], { encoding: 'utf8', timeout: 1000 });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Unknown command/);
  assert.equal(result.stdout, '');
});
