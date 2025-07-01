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
> extends Construct {
  constructor(
    scope: Construct,
    id: string,
    config: DatadogMonitorAlert<Namespace>,
    _: keyof Environments,
    notifier: DefinedNotifier<Environments, Teams>,
    warningNotifier: DefinedNotifier<Environments, Teams>,
    monitorType: DatadogMonitorType,
  ) {
    super(scope, id);
    const {
      critical, description,
      message = 'An error occured in {{log.service}}\n\n{{log.message}}',
      name, query, severity, tags, warning,
    } = config;

    // TODO: implement a notification rule to send warning to a different destination:
    // https://registry.terraform.io/providers/DataDog/datadog/latest/docs/resources/monitor_notification_rule
    const datadogNotifier = toDatadogNotifier(notifier, this, 'TODO');
    toDatadogNotifier(warningNotifier, this, 'TODO 2');

    new Monitor(this, 'monitor', {
      query,
      message: `${description ? 'Monitor [' + description + ']:\n\n' : ''}${message}\nNotify: ${datadogNotifier}`,
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
