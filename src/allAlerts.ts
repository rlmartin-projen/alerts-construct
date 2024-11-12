import { TaggedConstruct } from '@rlmartin-projen/cdktf-project/lib/constructs/aws/taggedConstruct';
import { Construct } from 'constructs';
import { Alert, AlertConstruct, AlertConstructors, Alerts, ImplementationMap, MonitoringConfig, NotificationEndpoints, Severity, TeamNotificationMap, WithOwner } from './types';

export abstract class AllAlerts<
  Teams extends string,
  Namespace extends string,
  Implementations extends ImplementationMap<Teams, Namespace>,
  Environments,
  Notifier,
> extends TaggedConstruct {
  protected abstract alertConstructors: AlertConstructors<Implementations, Notifier>;
  protected abstract severityMap: Record<Severity, keyof NotificationEndpoints<Notifier>>;
  protected env: keyof Environments;
  protected teamNotifications: TeamNotificationMap<Teams, Notifier>;

  constructor(scope: Construct, id: string, config: MonitoringConfig<Teams, Namespace, Implementations, Environments, Notifier>) {
    super(scope, id, config);
    const { alerts, tags: allTags } = config;
    this.env = config.env;
    this.teamNotifications = config.teamNotifications;

    Object.keys(alerts).forEach((alertType) => {
      // Force TS to recognize the type of alertType.
      const at: keyof Alerts<Implementations> = alertType as keyof Alerts<Implementations>;

      // Pull the appropriate constructor for the alert type.
      const ctor = this.alertConstructors[at] as AlertConstruct<Implementations[typeof at], Notifier>;

      // Iterate alerts that use the same constructor to build a
      // CDK Construct for each.
      (alerts[at] ?? []).forEach(alertConfig => {
        const alertWithOverrides = this.envOverrides(alertConfig);
        const { name, tags: alertTags } = alertWithOverrides;
        return new ctor(this, `${String(at)}-${name}`, { ...alertWithOverrides, tags: { ...allTags, ...alertTags } }, this.getNotifier(alertWithOverrides));
      });
    });
  }

  envOverrides<T extends Alert<Namespace> & WithOwner<Teams>>(alert: T): T {
    return alert;
  }

  getNotifier(alert: Alert<Namespace> & WithOwner<Teams>): Notifier {
    const notifierType = this.severityMap[alert.severity];
    return this.teamNotifications[alert.owner][notifierType];
  }
}