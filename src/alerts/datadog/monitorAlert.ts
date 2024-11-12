import { Monitor } from '@cdktf/provider-datadog/lib/monitor';
import { Construct } from 'constructs';
import { DatadogMonitorType, severityToDatadogPriority, transformTags } from '.';
import { Alert } from '../../types';

export interface DatadogMonitorAlert<Namespace extends string> extends Alert<Namespace> {
  readonly message?: string;
  readonly query: string;
}

export class DatadogMonitorAlertConstruct<Namespace extends string> extends Construct {
  constructor(scope: Construct, id: string, config: DatadogMonitorAlert<Namespace>, notifier: string, monitorType: DatadogMonitorType) {
    super(scope, id);
    const {
      critical,
      message = 'An error occured in {{log.service}}\n\n{{log.message}}',
      name, query, severity, tags, warning,
    } = config;

    new Monitor(this, 'monitor', {
      query,
      message: `${message}\nNotify: @webhook-${notifier}`,
      name,
      type: monitorType,
      monitorThresholds: {
        critical: critical.toString(),
        warning: warning?.toString(),
      },
      priority: severityToDatadogPriority[severity],
      tags: transformTags(tags),
    });
  }
}
