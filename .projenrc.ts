import { typescript } from 'projen';
import { NpmAccess } from 'projen/lib/javascript';
import { ReleaseTrigger } from 'projen/lib/release';
import { unifyNpmReleaseTrigger } from '@rlmartin-projen/projen-project/lib/helpers';

const majorVersion = 0;
const options: typescript.TypeScriptProjectOptions = {
  defaultReleaseBranch: 'main',
  name: '@rlmartin-projen/alerts-construct',
  projenrcTs: true,
  releaseToNpm: true,
  npmAccess: NpmAccess.PUBLIC,
  npmTrustedPublishing: true,
  repository: 'https://github.com/rlmartin-projen/alerts-construct',
  workflowNodeVersion: '24',
  majorVersion,
  releaseBranches: {
    dev: { prerelease: 'dev', npmDistTag: 'dev', majorVersion },
  },
  releaseTrigger: ReleaseTrigger.workflowDispatch(),
  depsUpgradeOptions: {
    workflowOptions: {
      branches: ['main'],
    },
  },
  deps: [
    '@cdktn/provider-aws@~22',
    '@cdktf/provider-datadog@~10',
    '@rlmartin-projen/cdktf-project@~8',
    'change-case@~4',
    'constructs@~10',
  ],
  // description: undefined,  /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],             /* Build dependencies for this module. */
  // packageName: undefined,  /* The "name" in package.json. */
};
const project = new typescript.TypeScriptProject(options);
unifyNpmReleaseTrigger(project, options);
project.synth();
