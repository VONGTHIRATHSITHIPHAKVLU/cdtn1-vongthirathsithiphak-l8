/** API template contract: integer id; CSAT 1..5 or NPS 0..10; UTC ISO createdAt.
 * Repository uses snake_case; presentation only receives this camelCase view.
 * Missing records are rejected by the service with 404, never an empty object.
 */
export function toTemplate(row) {
  return { id: row.template_id, name: row.name, type: row.type,
    scaleMin: row.type === 'NPS' ? 0 : 1, scaleMax: row.type === 'NPS' ? 10 : 5,
    question: row.question, allowComment: Boolean(row.allow_comment), createdAt: row.created_at };
}
export function toInvitation(row) {
  return { id: row.invitation_id, supportRequestId: row.request_code,
    templateId: row.template_id, templateName: row.name, customerName: row.full_name,
    channel: row.channel, status: row.status, sentAt: row.sent_at, expiresAt: row.expires_at,
    link: `/survey/${row.token}` };
}
