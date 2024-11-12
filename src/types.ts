import { TaggedConstructConfig } from '@rlmartin-projen/cdktf-project/lib/constructs/aws/taggedConstruct';
import { Construct } from 'constructs';

export type Severity = 'SEV0' | 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';

export type ConvertInterfaceToDict<T> = {
  [K in keyof T]: T[K];
};

export interface NotificationEndpoints<T> {
  readonly highPriority: T;
  readonly lowPriority: T;
}
export type TeamNotificationMap<Teams extends string, Notifier> = { [key in Teams]: NotificationEndpoints<Notifier> }

export interface Alert<Namespace extends string> {
  readonly name: string;
  readonly namespace?: Namespace;
  readonly critical: number;
  readonly warning?: number;
  readonly severity: Severity;
  readonly tags?: { [key: string]: string };
}
export interface WithOwner<Teams> {
  readonly owner: Teams;
}

export interface ImplementationMap<Teams, Namespace extends string> {
  [key: string | number | symbol]: Alert<Namespace> & WithOwner<Teams>;
}

export interface MonitoringConfig<
  Teams extends string,
  Namespace extends string,
  Implementations extends ImplementationMap<Teams, Namespace>,
  Environments,
  Notifier,
> extends TaggedConstructConfig {
  readonly env: keyof Environments;
  readonly teamNotifications: TeamNotificationMap<Teams, Notifier>;
  //  readonly alerts: { [key in keyof TeamNotificationMap<Teams, Notifier>]: Alerts<Implementations> };
  readonly alerts: Alerts<Implementations>;
}

export interface AlertConstruct<T, Notifier> {
  new (scope: Construct, id: string, config: T, notifier: Notifier): Construct;
}

export type AlertConstructors<T, Notifier> = { [K in keyof T]: AlertConstruct<T[K], Notifier> }

export type Alerts<T> = { [K in keyof T]?: T[K][] }