import { CloudwatchLogMetricFilter } from '@cdktf/provider-aws/lib/cloudwatch-log-metric-filter';
import { TaggedConstruct, TaggedConstructConfig } from '@rlmartin-projen/cdktf-project/lib/constructs/aws/taggedConstruct';
import { Construct } from 'constructs';
import { AwsMetric } from './metricAlert';

export interface LogsToMetricConfig extends TaggedConstructConfig {
  readonly name: string;
  readonly pattern: string;
  readonly metric: AwsMetric;
  readonly logGroupName: string;
  readonly value?: string;
}

export class LogsToMetric extends TaggedConstruct {
  private _name: string;
  private _namespace: string;
  private _dimensions: string[];

  constructor(scope: Construct, id: string, config: LogsToMetricConfig) {
    super(scope, id, config);
    const { logGroupName, pattern, metric: { dimensions, name, namespace }, name: filterName, value } = config;
    this._name = name;
    this._namespace = namespace;
    this._dimensions = Object.keys(dimensions ?? {});

    new CloudwatchLogMetricFilter(this, 'metric-filter', {
      name: filterName,
      pattern,
      logGroupName,
      metricTransformation: {
        name,
        namespace,
        dimensions,
        value: value ?? '1',
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