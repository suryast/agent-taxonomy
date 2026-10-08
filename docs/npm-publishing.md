# npm release workflow

This repository's `.github/workflows/publish.yml` verifies pull requests and supports manual **Run workflow** dispatches. `publish` defaults to **false**. Verification requires no npm login or enrolled environment. Publishing requires `publish=true`, an exact stable `expected_version` matching `package.json`, and the canonical `main` branch after this workflow is merged there. Never dispatch publication from a release-candidate branch.

## One-time operator setup (not automated)

1. In GitHub `suryast/agent-taxonomy` → Settings → Environments, manually create **npm**. Choose **Selected branches and tags**, add exactly one **Branch** rule named **main** (no tag rule/wildcard). Enable required reviewer **suryast**. Leave **Prevent self-review** unchecked so the sole owner can approve a manual run. No npm token or environment secret is needed.
2. In npm package **agent-taxonomy** → Settings → Trusted publishing → GitHub Actions, enter owner **suryast**, repository **agent-taxonomy**, workflow filename **publish.yml**, environment **npm**. Permit direct `npm publish` for this publisher; this workflow does not implement staged publishing. Account setup and approval stay with the operator; never send passwords, 2FA codes or tokens to an agent.
3. Review and merge the source workflow, run verification-only first, then explicitly request publication of the reviewed manifest version and approve the GitHub environment deployment.

The GET-only preflight uses `contents: read` and `actions: read`. It checks the existing environment, required reviewer and exact branch rule **before** the environment-bound publishing job can be scheduled. Missing/forbidden/unreadable configuration fails closed; it never creates or repairs configuration. If your token/platform cannot read these endpoints, resolve permissions as an operator, not by adding an administrative token or write fallback. Do not change/delete environment rules while a release is running.

Build/test jobs have no OIDC permission. They pack with lifecycle scripts disabled and seal SHA-256, package name/version and checked-out source SHA. Node 18/24 consumer jobs verify and install the same tarball without install scripts, exercise modules and the CLI. Only the gated publish job has `id-token: write`; it rechecks all artifact bindings, requires a conclusive registry 404 for the exact version, and publishes that tarball using `--access public --provenance --ignore-scripts --tag latest`. The publish process uses empty npm config files and removes legacy token variables; no `npm whoami` or `NPM_TOKEN` fallback. It requires Node >=22.14.0/npm >=11.5.1 and uses Node 24 on GitHub-hosted Ubuntu 24.04.

First-party action pins were resolved through `api.github.com/repos/actions/<action>/releases/latest` and `git/ref/tags/<release>` (annotated tags dereferenced):

| Action | Release | Commit |
|---|---|---|
| checkout | v7.0.1 | 3d3c42e5aac5ba805825da76410c181273ba90b1 |
| setup-node | v7.1.0 | 949feb2413d6458794dcd2491c4babbbce0c15c1 |
| upload-artifact | v7.0.2 | cf430e030ddbb5b0abf93d22962f4752f3646cd9 |
| download-artifact | v8.0.2 | 9000827ccba6bdab643e8b6fd33ac0654aef8333 |

Primary references: [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/), [GitHub environments API](https://docs.github.com/en/rest/deployments/environments), [deployment branch policies API](https://docs.github.com/en/rest/deployments/branch-policies).
