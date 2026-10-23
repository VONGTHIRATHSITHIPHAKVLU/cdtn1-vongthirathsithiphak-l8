import { invalid } from '../services/errors.js';
export function templateInput(body) {
  const { name, type, question, allowComment = true } = body;
  if (typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 100) invalid('name', 'Tên mẫu phải từ 3–100 ký tự');
  if (!['CSAT', 'NPS'].includes(type)) invalid('type', 'Chỉ nhận CSAT hoặc NPS');
  if (typeof question !== 'string' || question.trim().length < 10 || question.trim().length > 300) invalid('question', 'Câu hỏi phải từ 10–300 ký tự');
  if (typeof allowComment !== 'boolean') invalid('allowComment', 'Giá trị phải là boolean');
  return { name: name.trim(), type, question: question.trim(), allowComment };
}
export function invitationInput(body) {
  if (typeof body.supportRequestId !== 'string' || !body.supportRequestId.trim()) invalid('supportRequestId', 'Chọn yêu cầu hỗ trợ');
  for (const key of ['customerId', 'templateId']) if (!Number.isSafeInteger(body[key]) || body[key] <= 0) invalid(key, 'Mã phải là số nguyên dương');
  if (!['EMAIL', 'SMS'].includes(body.channel)) invalid('channel', 'Chọn EMAIL hoặc SMS');
  return body;
}
export function responseInput(body, template) {
  const min = template.type === 'NPS' ? 0 : 1, max = template.type === 'NPS' ? 10 : 5;
  if (!Number.isInteger(body.score) || body.score < min || body.score > max) invalid('score', `Điểm phải từ ${min} đến ${max}`);
  if (body.comment !== undefined && (typeof body.comment !== 'string' || body.comment.length > 500)) invalid('comment', 'Nhận xét tối đa 500 ký tự');
  if (!template.allow_comment && body.comment) invalid('comment', 'Mẫu này không nhận nhận xét');
  return { score: body.score, comment: body.comment?.trim() || null };
}
