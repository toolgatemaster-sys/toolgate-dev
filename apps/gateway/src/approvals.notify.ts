// Notifications for approval state changes

import { Approval } from '../../../packages/core/approval.js';

export interface NotificationPayload {
  id: string;
  status: Approval['status'];
  agentId?: string;
  ctx: Approval['ctx'];
  ts: number;
}

/**
 * Send notification for approval state change
 */
export async function sendNotification(approval: Approval): Promise<void> {
  const webhookUrl = process.env.TOOLGATE_WEBHOOK_URL;
  
  if (!webhookUrl) {
    // No webhook configured, skip notification
    return;
  }

  try {
    const payload: NotificationPayload = {
      id: approval.id,
      status: approval.status,
      agentId: approval.agentId,
      ctx: approval.ctx,
      ts: Date.now(),
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'toolgate-gateway/1.0',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(`[notifications] Webhook failed: ${response.status} ${response.statusText}`);
    } else {
      console.log(`[notifications] Sent notification for approval ${approval.id} (${approval.status})`);
    }
  } catch (error) {
    // Log error but don't throw - notifications should not block the flow
    console.error(`[notifications] Failed to send notification for approval ${approval.id}:`, error);
  }
}

/**
 * Send notification for approval state change (fire and forget)
 */
export function sendNotificationAsync(approval: Approval): void {
  // Fire and forget - don't wait for the notification
  sendNotification(approval).catch(error => {
    console.error(`[notifications] Async notification failed for approval ${approval.id}:`, error);
  });
}
