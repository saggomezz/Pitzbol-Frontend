Stryker Mutation Testing (frontend)
=================================

How to run mutation testing locally (frontend):

1. Install the dev dependencies (in the frontend folder):

```bash
cd Pitzbol-Frontend
npm install --legacy-peer-deps --no-audit --no-fund
```

2. Run Stryker:

```bash
npm run mutation
```

Notes:
- The Stryker config is in `stryker.conf.js` and uses `jest.config.cjs` to run tests.
- The mutation set excludes `pages`, `public` and `node_modules`. Adjust `mutate` in `stryker.conf.js` if you want other folders.
- Mutation testing is CPU- and time-intensive; run it on CI/staging runner for full reports.
