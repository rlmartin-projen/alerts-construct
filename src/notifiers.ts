import { NotificationEndpoints } from './types';

export interface WithNotifierMetadata<Environments, Team> {
  readonly env: Environments;
  readonly notifierType: keyof NotificationEndpoints<any>;
  readonly team: Team;
}

export interface WebhookNotifier {
  readonly url: string;
}
export function isWebhookNotifier(notifier: any): notifier is WebhookNotifier {
  return (notifier as WebhookNotifier).url !== undefined;
}

export interface DatadogWebhookNotifier extends WebhookNotifier {
  readonly name: string;
  readonly webhookType: 'datadog';
}
export function isDatadogWebhookNotifier(notifier: any): notifier is DatadogWebhookNotifier {
  return (notifier as DatadogWebhookNotifier).webhookType === 'datadog';
}

export interface ZendutyWebhookNotifier extends WebhookNotifier {
  readonly webhookType: 'zenduty';
}
export function isZendutyWebhookNotifier(notifier: any): notifier is ZendutyWebhookNotifier {
  return (notifier as ZendutyWebhookNotifier).webhookType === 'zenduty';
}

export interface SnsNotifier {
  readonly arn: string;
  readonly name: string;
}
export function isSnsNotifier(notifier: any): notifier is SnsNotifier {
  return ((notifier as SnsNotifier).arn !== undefined)
    && ((notifier as SnsNotifier).name !== undefined)
  ;
}

export type DefinedNotifier<Environments, Teams> =
  string
  | (
    (DatadogWebhookNotifier | SnsNotifier | ZendutyWebhookNotifier)
    & WithNotifierMetadata<Environments, Teams>
  );
