import { Webhook } from '@cdktf/provider-datadog/lib/webhook';
import { paramCase } from 'change-case';
import { Construct } from 'constructs';
import { DefinedNotifier, isSnsNotifier, isWebhookNotifier, WithNotifierMetadata, ZendutyWebhookNotifier } from '../../notifiers';

export function toDatadogNotifier<Environments, Teams, NotifierType>(
  notifier: DefinedNotifier<Environments, Teams, NotifierType>,
  scope: Construct,
  name: string,
): string {
  // See https://docs.datadoghq.com/integrations/amazon_sns/#send-sns-notifications for initial setup
  if (isSnsNotifier(notifier)) return `@${notifier.name}`;
  if (isWebhookNotifier(notifier)) {
    switch (notifier.webhookType) {
      case 'datadog':
        return `@webhook-${notifier.name}`;
      case 'zenduty':
        const webhook = createZendutyWebhook(notifier, scope, name);
        return `@webhook-${webhook.name}`;
      default:
        throw new Error(`webhook type [${JSON.stringify(notifier)}] not implemented.`);
    }
  }
  return `@${notifier.toString()}`;
}

const ZENDUTY_WEBHOOK_JSON_PAYLOAD = JSON.stringify({
  alert_id: '$ALERT_ID',
  hostname: '$HOSTNAME',
  date_posix: '$DATE_POSIX',
  aggreg_key: '$AGGREG_KEY',
  title: '$EVENT_TITLE',
  alert_status: '$ALERT_STATUS',
  alert_transition: '$ALERT_TRANSITION',
  link: '$LINK',
  event_msg: '$TEXT_ONLY_MSG',
  priority: '$ALERT_PRIORITY',
});

function createZendutyWebhook<Environments, Teams, NotifierType>(
  webhook: ZendutyWebhookNotifier & WithNotifierMetadata<Environments, Teams, NotifierType>,
  scope: Construct, name: string,
): Webhook {
  return new Webhook(scope, name, {
    name: paramCase(`${webhook.env}-zenduty-${webhook.notifierType}-webhook-${webhook.team}`),
    url: webhook.url,
    payload: ZENDUTY_WEBHOOK_JSON_PAYLOAD,
  });
}