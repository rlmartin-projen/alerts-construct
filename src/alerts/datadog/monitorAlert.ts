import { Monitor } from '@cdktf/provider-datadog/lib/monitor';
import { Construct } from 'constructs';
import { DatadogMonitorType, severityToDatadogPriority, transformTags } from '.';
import { toDatadogNotifier } from './helper';
import { DefinedNotifier } from '../../notifiers';
import { Alert } from '../../types';

export interface DatadogMonitorAlert<Namespace extends string> extends Alert<Namespace> {
  readonly message?: string;
  readonly query: string;
}

export class DatadogMonitorAlertConstruct<
  Namespace extends string,
  Environments,
  Teams extends string,
  NotifierType
> extends Construct {
  constructor(
    scope: Construct,
    id: string,
    config: DatadogMonitorAlert<Namespace>,
    notifier: DefinedNotifier<Environments, Teams, NotifierType>,
    monitorType: DatadogMonitorType,
  ) {
    super(scope, id);
    const {
      critical,
      message = 'An error occured in {{log.service}}\n\n{{log.message}}',
      name, query, severity, tags, warning,
    } = config;

    const datadogNotifier = toDatadogNotifier(notifier, this, 'TODO');

    new Monitor(this, 'monitor', {
      query,
      message: `${message}\nNotify: ${datadogNotifier}`,
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
