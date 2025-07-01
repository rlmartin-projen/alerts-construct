import { Construct } from 'constructs';
import { AnyPattern, LogsToMetric } from './logsToMetric';
import { AwsMetric, AwsMetricAlert, AwsMetricAlertConstruct } from './metricAlert';
import { DefinedNotifier } from '../../notifiers';

export interface AwsLogAlert<Namespace extends string> extends AwsMetricAlert<Namespace> {
  /**
   * Pattern to match and/or extract values from logs
   *
   * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/FilterAndPatternSyntax.html
   */
  readonly pattern: string | AnyPattern | RegExp;
  readonly metric: AwsMetric & {
    readonly createDimensions?: { [key: string]: string };
  };
  readonly logGroupName: string;
  readonly value?: string;
  readonly defaultValue?: string;
}

export class AwsLogAlertConstruct<
  Namespace extends string,
  Environments,
  Teams extends string,
> extends AwsMetricAlertConstruct<Namespace, Environments, Teams> {
  constructor(
    scope: Construct,
    id: string,
    config: AwsLogAlert<Namespace>,
    notifier: DefinedNotifier<Environments, Teams>,
    warningNotifier: DefinedNotifier<Environments, Teams>,
  ) {
    super(scope, id, config, notifier, warningNotifier);
    const { defaultValue, logGroupName, metric, name, pattern, tags, value } = config;

    new LogsToMetric(this, 'metric', {
      name,
      pattern,
      logGroupName,
      metric: {
        ...metric,
        dimensions: metric.createDimensions,
      },
      value,
      defaultValue,
      tags,
    });
  }
}
