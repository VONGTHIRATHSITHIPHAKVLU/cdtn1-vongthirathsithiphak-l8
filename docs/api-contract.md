# API contract — L8 Sprint 1–2

API dùng JSON UTF-8; body thành công là đối tượng hoặc mảng trực tiếp. Lỗi thống nhất: `{ "error": "CODE", "message": "Thông báo cho người dùng", "fields": {} }`. `fields` chứa lỗi theo trường khi validation. Tất cả thời gian ISO 8601 UTC; ID số nguyên, token chữ-số 32 ký tự. Dữ liệu không tồn tại trả 404, danh sách rỗng trả `[]`, tỷ lệ chưa có mẫu số trả `null`.

| Method | Endpoint | Auth | Kết quả |
|---|---|---|---|
| POST | `/api/auth/login` | Không | 200 `{token,role,expiresAt}` |
| POST | `/api/auth/logout` | Bearer | 200 xóa phiên |
| GET | `/api/survey-templates` | Bearer | 200 mảng template |
| POST | `/api/survey-templates` | Bearer | 201 template |
| GET | `/api/survey-templates/:id` | Bearer | 200 template |
| PUT | `/api/survey-templates/:id` | Bearer | 200 template |
| DELETE | `/api/survey-templates/:id` | Bearer | 200 `{id}` |
| GET | `/api/support-requests` | Bearer | 200 `{id,customerId,customerName,status,centerId}[]` |
| GET | `/api/survey-invitations` | Bearer | 200 mảng invitation |
| POST | `/api/survey-invitations` | Bearer | 201 invitation + `deliveryMode` |
| GET | `/api/public/surveys/:token` | Không | 200 form |
| POST | `/api/public/surveys/:token/responses` | Không | 201 response |
| GET | `/api/reports/summary` | Bearer | 200 summary |

## Đầu vào

- Login: `{username:"demo", password:string}`. Đúng mật khẩu cấu hình trong `DEMO_PASSWORD`. Sai 401, sau 5 lần khóa 15 phút trả 429; thiếu cấu hình trả 503. Phiên 1 giờ, mất khi backend khởi động lại.
- Template: `{name:string(3..100),type:"CSAT"|"NPS",question:string(10..300),allowComment?:boolean}`; boolean mặc định true. Mẫu đã được dùng không được sửa/xóa.
- Invitation: `{supportRequestId:string,customerId:positiveInteger,templateId:positiveInteger,channel:"EMAIL"|"SMS"}`. Request code tham chiếu đúng khách hàng, trạng thái COMPLETED. Kiểm tra liên hệ và opt-out.
- Response: `{score:integer,comment?:string(0..500)}`. CSAT 1..5, NPS 0..10. Mẫu không cho nhận xét sẽ từ chối nhận xét khác rỗng.

## Đầu ra ở ranh giới

Cập nhật giao diện theo Wireframe1–3: public form bổ sung `supportRequestId` (mã yêu cầu) và `centerId` (mã trung tâm); danh sách support-requests bổ sung `completedAt` (ISO hoặc null) và `maskedEmail` (email che một phần hoặc null). Không đưa email/tên khách vào form public. Dữ liệu thiết bị và tên người tạo chưa có trong API, giao diện không tự điền dữ liệu giả từ ảnh.

- Template: `{id,name,type,scaleMin,scaleMax,question,allowComment,createdAt}`. Hàm `toTemplate` là nơi duy nhất chuyển snake_case sang camelCase.
- Invitation: `{id,supportRequestId,templateId,templateName,customerName,channel,status,sentAt,expiresAt,link}`. Link tương đối `/survey/:token`, giữ cùng origin frontend. POST thêm `deliveryMode:"LOCAL_LINK"`. `SENT` trong prototype nghĩa là liên kết đã tạo; chưa tích hợp nhà cung cấp gửi thư.
- Public form: `{templateName,type,scaleMin,scaleMax,question,allowComment,expiresAt}`. Không lộ tên/email khách.
- Response: `{id,invitationId,score,comment,flaggedNegative,submittedAt}`. Comment không nhập trả null.
- Summary: `{responseCount,invitationCount,csat,csatCount,nps,npsCount,negativeCount,generatedAt,source,csatTarget}`. CSAT đơn vị %, NPS điểm −100..100; phạm vi toàn thời gian. `csatTarget=80` chỉ là mốc tham chiếu minh họa.

## Lỗi và hành vi phía gọi

| HTTP | Mã điển hình | Xử lý |
|---|---|---|
| 400 | VALIDATION_ERROR, INVALID_JSON, REQUEST_NOT_COMPLETED, CUSTOMER_MISMATCH, CONTACT_MISSING | Sửa dữ liệu; fields nếu có |
| 401 | UNAUTHORIZED, INVALID_CREDENTIALS | Xóa phiên với API bảo vệ, về đăng nhập |
| 404 | NOT_FOUND | Báo không tìm thấy |
| 409 | TEMPLATE_NAME_EXISTS, TEMPLATE_IN_USE, INVITATION_EXISTS, CUSTOMER_OPTED_OUT, EXPIRED, ALREADY_ANSWERED | Hiển thị thông báo nghiệp vụ |
| 413 | BODY_TOO_LARGE | Giảm kích thước request (tối đa 16 KiB) |
| 429 | ACCOUNT_LOCKED | Chờ 15 phút |
| 500/503 | INTERNAL_ERROR, AUTH_NOT_CONFIGURED | Thông báo an toàn, không lộ SQL/stack |

Thay đổi so với BT1: lỗi `code/errors` thống nhất thành `error/message/fields` theo buổi 9; thêm CRUD, đọc danh sách, auth, báo cáo. Hạn 14 ngày và thang CSAT/NPS giữ theo contract BT1. Hai phía frontend/backend đã chuyển cùng đợt vì repo chưa có client triển khai trước đó. Test HTTP kiểm chứng 401, trường lỗi, lời mời, form, phản hồi và báo cáo.
# Bổ sung BT2 — 30/10/2026

`GET /api/health` không yêu cầu đăng nhập, kiểm kết nối SQLite và trả `{ "status": "ok" }`. Mỗi phản hồi có `X-Request-Id` do server sinh.

CRUD thực thể thứ hai (cần Bearer session của tài khoản demo):

| Method | URL | Body / kết quả |
|---|---|---|
| POST | `/api/survey-invitations` | Body tạo lời mời như contract bên dưới; 201 |
| GET | `/api/survey-invitations/:id` | Một lời mời; 200 hoặc 404 |
| PUT | `/api/survey-invitations/:id` | `{ "channel": "SMS" }` hoặc EMAIL; 200. Chỉ khi SENT và chưa hết hạn, kiểm thông tin liên hệ |
| DELETE | `/api/survey-invitations/:id` | 200 `{ "id": 1 }`; không xóa ANSWERED (409 INVITATION_LOCKED) |

PUT không đổi token/mẫu/yêu cầu/expiresAt; DELETE xóa log liên quan trong cùng transaction. Token bị xóa trả 404. Không ghi log HTTP chứa token/body/header. Mẫu khảo sát và lời mời là hai thực thể CRUD; response giữ bất biến.
