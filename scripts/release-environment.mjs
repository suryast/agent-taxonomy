// GET-only environment guard; never creates or updates GitHub resources.
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
const repository = 'suryast/agent-taxonomy';
const branch = 'main';
export function validateEnvironment(environment, policies) {
  const fail = message => { throw Error(message); };
  if (environment.name !== 'npm' || environment.deployment_branch_policy?.custom_branch_policies !== true || environment.deployment_branch_policy?.protected_branches !== false) fail('npm environment must use custom branch rules only');
  if (policies.total_count !== 1 || policies.branch_policies?.length !== 1 || policies.branch_policies[0].name !== branch || policies.branch_policies[0].type !== 'branch') fail('npm environment must allow exactly the default branch, no tags or wildcards');
  const rule = environment.protection_rules?.find(r => r.type === 'required_reviewers');
  if (!rule || rule.prevent_self_review !== false || !rule.reviewers?.some(r => r.type === 'User' && r.reviewer?.login?.toLowerCase() === 'suryast')) fail('npm environment requires suryast as reviewer with prevent-self-review disabled');
}
export async function checkEnvironment(request = fetch, token = process.env.GH_TOKEN) {
  if (!token) throw Error('Read-only GitHub token required for environment preflight');
  async function get(path) {
    const response = await request(`https://api.github.com/repos/${repository}/environments/npm${path}`,{method:'GET',redirect:'error',signal:AbortSignal.timeout(15000),headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${token}`,'X-GitHub-Api-Version':'2026-03-10'}});
    if (response.status !== 200) throw Error(`Environment preflight HTTP ${response.status}; configure npm environment manually, no fallback`);
    return response.json();
  }
  const environment = await get('');
  const policies = await get('/deployment-branch-policies?per_page=100');
  validateEnvironment(environment,policies);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  checkEnvironment().then(() => console.log('Existing npm environment protections verified')).catch(error => { console.error(error.message); process.exitCode=1; });
}
