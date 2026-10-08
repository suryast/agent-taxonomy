// Install and exercise the sealed tarball in an isolated consumer, without lifecycle scripts.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const directory = mkdtempSync(join(tmpdir(),'release-consumer-'));
const tarball = resolve(process.argv[2] || 'release-artifact/package.tgz');
try {
  writeFileSync(join(directory,'package.json'),JSON.stringify({name:'release-consumer',version:'0.0.0',private:true}));
  execFileSync('npm',['install','--ignore-scripts','--no-audit','--no-fund','--registry','https://registry.npmjs.org',tarball],{cwd:directory,stdio:'inherit'});
  const api = await import(pathToFileURL(join(directory,'node_modules/agent-taxonomy/src/index.js')).href);
  const result = api.classify({name:'packed-test',domain:'Automatia',kingdom:'Monagentia',phylum:'Amnesia',evolutionClass:'Darwinia',order:'Mesomutas',family:'Autoselectae',genus:'Fabricator'});
  assert.ok(result.binomial); assert.ok(result.rarity);
  assert.equal(api.validate({}).valid,false); assert.ok(api.VALID.domain.length);
  const output = execFileSync(process.execPath,[join(directory,'node_modules/agent-taxonomy/bin/cli.js'),'demo'],{encoding:'utf8'});
  assert.ok(output.length > 0);
  console.log('Packed consumer module and CLI checks passed');
} finally { rmSync(directory,{recursive:true,force:true}); }
