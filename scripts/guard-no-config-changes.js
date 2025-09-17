const { execSync } = require('node:child_process');
const disallowed = [/^package\.json$/, /^pnpm-lock\.yaml$/, /^pnpm-workspace\.yaml$/, /^.*\/tsconfig.*\.json$/, /^\.eslintrc.*$/, /^\.prettierrc.*$/, /^\.npmrc$/, /^\.nvmrc$/, /^playwright\..*$/, /^e2e\/.*$/, /^tests\/e2e\/.*$/];
const out = execSync('git diff --cached --name-only', { encoding: 'utf8' }).split('\n').filter(Boolean);
const offenders = out.filter(f => disallowed.some(rx => rx.test(f)));
if (offenders.length) { console.error('❌ Protected files changed:\n' + offenders.join('\n')); process.exit(1); }
