// Run directly with node --test; intentionally outside the package's test glob.
import test from 'node:test';
import { validateEnvironment, checkEnvironment } from './release-environment.mjs';
import { verifyArtifact } from './release.mjs';
import { mkdtempSync, cpSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const environment = {name:'npm',deployment_branch_policy:{custom_branch_policies:true,protected_branches:false},protection_rules:[{type:'required_reviewers',prevent_self_review:false,reviewers:[{type:'User',reviewer:{login:'suryast'}}]}]};
const policies = {total_count:1,branch_policies:[{name:'main',type:'branch'}]};
test('environment enrollment must already exist with exact protections', () => {
  assert.doesNotThrow(() => validateEnvironment(environment,policies));
  for (const patch of [{name:'other'},{deployment_branch_policy:null},{protection_rules:[]},{protection_rules:[{...environment.protection_rules[0],prevent_self_review:true}]},{protection_rules:[{...environment.protection_rules[0],reviewers:[]}]}]) assert.throws(() => validateEnvironment({...environment,...patch},policies));
  for (const p of [{total_count:2,branch_policies:policies.branch_policies},{total_count:1,branch_policies:[{name:'*',type:'branch'}]},{total_count:1,branch_policies:[{name:'main',type:'tag'}]}]) assert.throws(() => validateEnvironment(environment,p));
});
test('environment preflight performs only GET, fails closed on missing/forbidden/network', async () => {
  const calls=[];
  await checkEnvironment(async (url,options) => {calls.push([url,options.method]);return {status:200,json:async()=>url.includes('deployment-branch-policies')?policies:environment};},'synthetic-test-token');
  assert.equal(calls.length,2);assert.ok(calls.every(c=>c[1]==='GET'));
  for(const status of [404,403,401,429,500]) await assert.rejects(checkEnvironment(async()=>({status}),'synthetic-test-token'));
  await assert.rejects(checkEnvironment(async()=>{throw Error('network');},'synthetic-test-token'));
});
test('real sealed tarball rejects changed bytes, metadata binding, source and path', {skip:!process.env.RELEASE_TEST_ARTIFACT}, () => {
  const dir = mkdtempSync(join(tmpdir(),'release-guard-test-'));
  try {
    cpSync(process.env.RELEASE_TEST_ARTIFACT,dir,{recursive:true});
    assert.doesNotThrow(()=>verifyArtifact(dir));
    const manifestPath=join(dir,'manifest.json');
    const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
    for(const patch of [{filename:'../package.tgz'},{name:'wrong'},{version:'9.9.9'},{sourceSHA:'0'.repeat(40)},{sha256:'0'.repeat(64)}]) {
      writeFileSync(manifestPath,JSON.stringify({...manifest,...patch}));
      assert.throws(()=>verifyArtifact(dir));
    }
    writeFileSync(manifestPath,JSON.stringify(manifest));
    const tar=join(dir,'package.tgz');writeFileSync(tar,Buffer.concat([readFileSync(tar),Buffer.from('tamper')]));
    assert.throws(()=>verifyArtifact(dir),/checksum/);
  } finally {rmSync(dir,{recursive:true,force:true});}
});

import assert from 'node:assert/strict';
import { validateVersion, validateIdentity, validateSeal, assertUnpublished, checkToolchain } from './release.mjs';
const good = {name: 'agent-taxonomy', version: '1.3.1'};
const sha = 'a'.repeat(40);
const seal = {...good, sourceSHA: sha, filename: 'package.tgz', sha256: 'b'.repeat(64)};
test('literal stable versions only; no repair or shell syntax', () => {
  assert.equal(validateVersion(good.version), good.version);
  for (const v of ['', ' 1.2.3', '1.2.3\n', '01.2.3', '1.2.3-beta.1', '1.2.3;echo pwn', '$(id)', '--help']) assert.throws(() => validateVersion(v));
});
test('manifest identity and explicit operator version must match', () => {
  assert.doesNotThrow(() => validateIdentity(good, good.version));
  assert.throws(() => validateIdentity({...good, name: 'wrong'}));
  assert.throws(() => validateIdentity(good, '9.9.9'));
  assert.throws(() => validateIdentity(good, ' '+good.version));
});
test('seal binds fixed tar path, package, version, source and checksum shape', () => {
  assert.doesNotThrow(() => validateSeal(seal, good, sha));
  for (const patch of [{filename:'../package.tgz'}, {name:'wrong'}, {version:'9.9.9'}, {sourceSHA:'c'.repeat(40)}, {sha256:'oops'}]) assert.throws(() => validateSeal({...seal,...patch},good,sha));
});
test('registry permits only explicit missing version; errors fail closed', async () => {
  let url;
  await assertUnpublished(good, async u => {url=u; return {status:404};});
  assert.equal(url, 'https://registry.npmjs.org/agent-taxonomy/1.3.1');
  for (const status of [200, 401, 403, 429, 500, 301]) await assert.rejects(assertUnpublished(good, async () => ({status})));
  await assert.rejects(assertUnpublished(good, async () => {throw Error('network failure');}));
});
test('OIDC toolchain minimum enforced', () => {
  assert.doesNotThrow(() => checkToolchain('24.0.0','11.5.1'));
  for (const pair of [['22.13.0','11.19.0'],['24.0.0','11.5.0'],['24.0.0','bad']]) assert.throws(() => checkToolchain(...pair));
});
