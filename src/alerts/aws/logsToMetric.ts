import { CloudwatchLogMetricFilter } from '@cdktf/provider-aws/lib/cloudwatch-log-metric-filter';
import { TaggedConstruct, TaggedConstructConfig } from '@rlmartin-projen/cdktf-project/lib/constructs/aws/taggedConstruct';
import { Construct } from 'constructs';
import { AwsMetric } from './metricAlert';

export interface AnyPattern {
  readonly any: string[];
}
function isAny(pattern: any): pattern is AnyPattern {
  return (pattern as AnyPattern).any !== undefined;
}
function isRegExp(pattern: any): pattern is RegExp {
  return (pattern as RegExp).source !== undefined && (pattern as RegExp).flags !== undefined;
}

export interface LogsToMetricConfig extends TaggedConstructConfig {
  readonly name: string;
  readonly pattern: string | AnyPattern | RegExp;
  readonly metric: AwsMetric;
  readonly logGroupName: string;
  readonly value?: string;
  readonly defaultValue?: string;
}

export class LogsToMetric extends TaggedConstruct {
  private _name: string;
  private _namespace: string;
  private _dimensions: string[];

  constructor(scope: Construct, id: string, config: LogsToMetricConfig) {
    super(scope, id, config);
    const { defaultValue, logGroupName, pattern, metric: { dimensions, name, namespace }, name: filterName, value } = config;
    this._name = name;
    this._namespace = namespace;
    this._dimensions = Object.keys(dimensions ?? {});

    let patternString = pattern.toString();
    if (isAny(pattern)) patternString = `?${pattern.any.join(' ?')}`;
    if (isRegExp(pattern)) {
      patternString = pattern.toString();
      if (pattern.flags != '') {
        patternString = patternString.replace(new RegExp(`${pattern.flags}$`), '');
        console.log('WARNING: AWS log patterns do not support flags.');
      }
      patternString = patternString.replace(/^\//, '%').replace(/\/$/, '%');
      if (patternString.includes('(') && patternString.includes(')')) console.log('WARNING: AWS log patterns do not support subpatterns');
    }
    patternString = patternString.trim();
    // See https://github.com/hashicorp/terraform-provider-aws/issues/28881#issuecomment-1435975827
    if (this._dimensions.length > 0) {
      if (
        !(patternString.startsWith('{') && patternString.endsWith('}'))
        && !(patternString.startsWith('[') && patternString.endsWith(']'))
      ) throw new Error('Only JSON and space-delimited log patterns allow dimensions');
    }

    new CloudwatchLogMetricFilter(this, 'metric-filter', {
      name: filterName,
      pattern: patternString,
      logGroupName,
      metricTransformation: {
        name,
        namespace,
        dimensions,
        value: value ?? '1',
        defaultValue,
      },
    });
  }

  get dimensions(): string[] {
    return this._dimensions;
  }

  get name(): string {
    return this._name;
  }

  get namespace(): string {
    return this._namespace;
  }
}