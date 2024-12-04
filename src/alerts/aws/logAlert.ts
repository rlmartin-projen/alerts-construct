import { Construct } from 'constructs';
import { LogsToMetric } from './logsToMetric';
import { AwsMetric, AwsMetricAlert, AwsMetricAlertConstruct } from './metricAlert';
import { DefinedNotifier } from '../../notifiers';

export interface AwsLogAlert<Namespace extends string> extends AwsMetricAlert<Namespace> {
  /**
   * Pattern to match and/or extract values from logs
   *
   * @see https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/FilterAndPatternSyntax.html
   */
  readonly pattern: string;
  readonly metric: AwsMetric & {
    readonly createDimensions?: { [key: string]: string };
  };
  readonly logGroupName: string;
}

export class AwsLogAlertConstruct<
  Namespace extends string,
  Environments,
  Teams extends string
> extends AwsMetricAlertConstruct<Namespace, Environments, Teams> {
  constructor(scope: Construct, id: string, config: AwsLogAlert<Namespace>, notifier: DefinedNotifier<Environments, Teams>) {
    super(scope, id, config, notifier);
    const { logGroupName, metric, pattern, tags } = config;

    new LogsToMetric(this, 'metric', {
      pattern,
      logGroupName,
      metric: {
        ...metric,
        dimensions: metric.createDimensions,
      },
      tags,
    });
  }
}
