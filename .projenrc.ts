import { typescript } from 'projen';
import { NpmAccess } from 'projen/lib/javascript';

const majorVersion = 0;
const project = new typescript.TypeScriptProject({
  defaultReleaseBranch: 'main',
  name: '@rlmartin-projen/alerts-construct',
  projenrcTs: true,
  releaseToNpm: true,
  npmAccess: NpmAccess.PUBLIC,
  workflowNodeVersion: '20',
  majorVersion,
  releaseBranches: {
    dev: { prerelease: 'dev', npmDistTag: 'dev', majorVersion },
  },
  depsUpgradeOptions: {
    workflowOptions: {
      branches: ['main'],
    },
  },
  deps: [
    '@cdktf/provider-datadog@~10',
    '@rlmartin-projen/cdktf-project@~4',
    'constructs@~10',
  ],
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
});
project.synth();