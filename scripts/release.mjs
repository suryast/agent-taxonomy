// Dependency-free release guard. Never evaluate input as shell source.
import { readFileSync, writeFileSync, mkdirSync, renameSync, mkdtempSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
const NAME = 'agent-taxonomy';
const REPOSITORY = 'suryast/agent-taxonomy';
const REF = 'refs/heads/main';
function requireThat(ok, message) { if (!ok) throw Error(message); }
export function validateVersion(v) {
  requireThat(typeof v === 'string' && /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(v), 'Expected a literal stable X.Y.Z version');
  return v;
}
export function validateIdentity(pkg, expected = '') {
  requireThat(pkg.name === NAME, 'Unexpected package name');
  validateVersion(pkg.version);
  if (expected !== '') requireThat(validateVersion(expected) === pkg.version, 'Operator version differs from package.json');
  return pkg;
}
export function validateSeal(seal, pkg, sha) {
  requireThat(/^[a-f0-9]{40}$/.test(sha), 'Invalid source SHA');
  requireThat(seal.name === pkg.name && seal.version === pkg.version && seal.sourceSHA === sha && seal.filename === 'package.tgz' && /^[a-f0-9]{64}$/.test(seal.sha256), 'Artifact seal mismatch');
}
export async function assertUnpublished(pkg, request = fetch) {
  validateIdentity(pkg);
  const response = await request(`https://registry.npmjs.org/${NAME}/${pkg.version}`, {redirect: 'error', signal: AbortSignal.timeout(15000)});
  requireThat(response.status === 404, response.status === 200 ? 'Version already exists; refusing re-release' : 'Registry check inconclusive; refusing publish');
}
export function checkToolchain(nodeVersion, npmVersion) {
  function atLeast(v, floor) {
    if (!/^\d+\.\d+\.\d+$/.test(v)) return false;
    const parts = v.split('.').map(Number);
    for (let i = 0; i < 3; i++) { if (parts[i] !== floor[i]) return parts[i] > floor[i]; }
    return true;
  }
  requireThat(atLeast(nodeVersion,[22,14,0]) && atLeast(npmVersion,[11,5,1]), 'Trusted publishing needs Node >=22.14.0 and npm >=11.5.1');
}
const execute = (command,args,options={}) => execFileSync(command,args,{encoding:'utf8',...options});
function digest(file) { return createHash('sha256').update(readFileSync(file)).digest('hex'); }
function sourceSHA() {
  const sha = execute('git',['rev-parse','HEAD']).trim();
  if (process.env.GITHUB_SHA) requireThat(sha === process.env.GITHUB_SHA, 'Checkout/source SHA differs');
  return sha;
}
function tarPackage(file) {
  const entries = execute('tar',['-tzf',file]).trim().split('\n');
  requireThat(entries.filter(x => x === 'package/package.json').length === 1, 'Missing/duplicate tar manifest');
  requireThat(entries.every(x => x.startsWith('package/') && !x.split('/').includes('..') && !x.includes('\\') && !x.startsWith('/')), 'Unsafe archive path');
  requireThat(!entries.some(x => /^package\/(scripts|\.github)\//.test(x)), 'Release helpers leaked into package');
  return JSON.parse(execute('tar',['-xOzf',file,'package/package.json']));
}
export function verifyArtifact(directory, expected = process.env.EXPECTED_VERSION || '') {
  const pkg = validateIdentity(JSON.parse(readFileSync('package.json','utf8')),expected);
  const seal = JSON.parse(readFileSync(join(directory,'manifest.json'),'utf8'));
  validateSeal(seal,pkg,sourceSHA());
  const file = join(directory,'package.tgz');
  requireThat(digest(file) === seal.sha256,'Tarball checksum differs');
  const packed = validateIdentity(tarPackage(file),pkg.version);
  requireThat(JSON.stringify(packed) === JSON.stringify(pkg),'Packed metadata differs from checked-out source');
  return {pkg,file};
}
async function main() {
  const mode = process.argv[2];
  const dir = resolve(process.argv[3] || 'release-artifact');
  const pkg = validateIdentity(JSON.parse(readFileSync('package.json','utf8')),process.env.EXPECTED_VERSION || '');
  if (mode === 'seal') {
    mkdirSync(dir,{recursive:true});
    const packed = JSON.parse(execute('npm',['pack','--ignore-scripts','--json','--pack-destination',dir]));
    requireThat(packed.length === 1 && packed[0].filename === `${NAME}-${pkg.version}.tgz`, 'Unexpected pack filename');
    renameSync(join(dir,packed[0].filename),join(dir,'package.tgz'));
    writeFileSync(join(dir,'manifest.json'),JSON.stringify({name:pkg.name,version:pkg.version,sourceSHA:sourceSHA(),filename:'package.tgz',sha256:digest(join(dir,'package.tgz'))},null,2)+'\n');
    verifyArtifact(dir);
    console.log(`Sealed and verified ${NAME}@${pkg.version}`);
  } else if (mode === 'verify') {
    verifyArtifact(dir); console.log(`Verified artifact ${NAME}@${pkg.version}`);
  } else if (mode === 'registry') {
    await assertUnpublished(pkg); console.log(`Registry confirms ${NAME}@${pkg.version} is not published`);
  } else if (mode === 'toolchain') {
    checkToolchain(process.versions.node,execute('npm',['--version']).trim());
    console.log('OIDC toolchain minimum verified');
  } else if (mode === 'publish') {
    requireThat(process.env.GITHUB_EVENT_NAME === 'workflow_dispatch' && process.env.GITHUB_REPOSITORY === REPOSITORY && process.env.GITHUB_REF === REF && process.env.PUBLISH_REQUESTED === 'true', 'Publishing is restricted to explicit dispatch on the canonical default branch');
    validateVersion(process.env.EXPECTED_VERSION);
    checkToolchain(process.versions.node,execute('npm',['--version']).trim());
    const artifact = verifyArtifact(dir);
    await assertUnpublished(artifact.pkg);
    // A clean working directory and empty config files prevent legacy-token fallback
    // and project-level publish configuration. Preserve GitHub OIDC/provenance env.
    const clean = mkdtempSync(join(tmpdir(),'npm-oidc-'));
    try {
      const config = join(clean,'empty.npmrc'); writeFileSync(config,'');
      const env = {...process.env};
      for (const key of Object.keys(env)) if (/^npm_config_/i.test(key) || ['NPM_TOKEN','NODE_AUTH_TOKEN'].includes(key)) delete env[key];
      env.NPM_CONFIG_USERCONFIG = config;
      env.NPM_CONFIG_GLOBALCONFIG = join(clean,'global.npmrc'); writeFileSync(env.NPM_CONFIG_GLOBALCONFIG,'');
      execute('npm',['publish',artifact.file,'--access','public','--provenance','--ignore-scripts','--tag','latest','--registry','https://registry.npmjs.org'],{cwd:clean,env,stdio:'inherit'});
    } finally { rmSync(clean,{recursive:true,force:true}); }
  } else throw Error('Usage: node scripts/release.mjs seal|verify|registry|toolchain|publish [artifact-directory]');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => {console.error(error.message); process.exitCode = 1;});
}
