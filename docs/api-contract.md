# API contract — L8 Sprint 1–2

API dùng JSON UTF-8; body thành công là đối tượng hoặc mảng trực tiếp. Lỗi thống nhất: `{ "error": "CODE", "message": "Thông báo cho người dùng", "fields": {} }`. `fields` chứa lỗi theo trường khi validation. Tất cả thời gian ISO 8601 UTC. ID mẫu/lời mời/phản hồi là số nguyên; mã yêu cầu là string. Token khảo sát sinh dạng hex 32 ký tự. Session token đăng nhập là hex 64 ký tự, gửi đúng header `Authorization: Bearer <token>`; token trần không được chấp nhận. Dữ liệu không tồn tại trả 404, danh sách rỗng trả `[]`, tỷ lệ chưa có mẫu số trả `null`.

| Method | Endpoint | Auth | Kết quả |
|---|---|---|---|
| POST | `/api/auth/login` | Không | 200 `{token,role,expiresAt}` |
| POST | `/api/auth/logout` | Bearer | 200 `{loggedOut:true}`, thu hồi phiên |
| GET | `/api/survey-templates` | Bearer | 200 mảng template |
| POST | `/api/survey-templates` | Bearer | 201 template |
| GET | `/api/survey-templates/:id` | Bearer | 200 template |
| PUT | `/api/survey-templates/:id` | Bearer | 200 template |
| DELETE | `/api/survey-templates/:id` | Bearer | 200 `{id}` |
| GET | `/api/support-requests` | Bearer | 200 `{id,customerId,customerName,status,centerId,completedAt,maskedEmail}[]` |
| GET | `/api/survey-invitations` | Bearer | 200 mảng invitation |
| POST | `/api/survey-invitations` | Bearer | 201 invitation + `deliveryMode` |
| GET | `/api/survey-invitations/:id` | Bearer | 200 invitation, không có trả 404 |
| PUT | `/api/survey-invitations/:id` | Bearer | 200 invitation, body chỉ chọn channel |
| DELETE | `/api/survey-invitations/:id` | Bearer | 200 `{id}`, ANSWERED bị chặn 409 |
| GET | `/api/public/surveys/:token` | Không | 200 form |
| POST | `/api/public/surveys/:token/responses` | Không | 201 response |
| GET | `/api/reports/summary` | Bearer | 200 summary |
| GET | `/api/health` | Không | 200 `{status:"ok"}` sau SQLite SELECT 1 |

## Đầu vào

- Login: `{username:"demo", password:string}`. Đúng mật khẩu cấu hình trong `DEMO_PASSWORD`. Năm lần sai đầu trả 401; lần sai thứ năm kích hoạt khóa 15 phút, các lần thử trong thời gian khóa trả 429 (kể cả đúng mật khẩu). Thiếu cấu hình trả 503 với body `INTERNAL_ERROR`. Phiên 1 giờ, mất khi backend khởi động lại.

Buổi 15: verifier mật khẩu scrypt có salt trong RAM; map phiên chỉ lưu hash token. Actor của các thao tác ghi lấy từ identity demo trong session, không từ payload. Vẫn chỉ có một manager demo; chưa có kiểm quyền owner/center. Mật khẩu provisioning trong `.env` và token khảo sát trong SQLite chưa được mã hoá. Xem [Security Checklist](security-checklist.md).

- Template: `{name:string(3..100),type:"CSAT"|"NPS",question:string(10..300),allowComment?:boolean}`; boolean mặc định true. Mẫu đã được dùng không được sửa/xóa.
- Invitation: `{supportRequestId:string,customerId:positiveInteger,templateId:positiveInteger,channel:"EMAIL"|"SMS"}`. Request code tham chiếu đúng khách hàng, trạng thái COMPLETED. Kiểm tra liên hệ và opt-out.
- Response: `{score:integer,comment?:string(0..500)}`. CSAT 1..5, NPS 0..10. Mẫu không cho nhận xét sẽ từ chối nhận xét khác rỗng.

## Đầu ra ở ranh giới

Cập nhật giao diện theo Wireframe1–3: public form bổ sung `supportRequestId` (mã yêu cầu) và `centerId` (mã trung tâm); danh sách support-requests bổ sung `completedAt` (ISO hoặc null) và `maskedEmail` (email che một phần hoặc null). Không đưa email/tên khách vào form public. Dữ liệu thiết bị và tên người tạo chưa có trong API, giao diện không tự điền dữ liệu giả từ ảnh.

- Template: `{id,name,type,scaleMin,scaleMax,question,allowComment,createdAt}`. Hàm `toTemplate` là nơi duy nhất chuyển snake_case sang camelCase.
- Invitation: `{id,supportRequestId,templateId,templateName,customerName,channel,status,sentAt,expiresAt,link}`. Link tương đối `/survey/:token`, giữ cùng origin frontend. POST thêm `deliveryMode:"LOCAL_LINK"`. `SENT` trong prototype nghĩa là liên kết đã tạo; chưa tích hợp nhà cung cấp gửi thư.
- Support request: `{id,customerId,customerName,status,centerId,completedAt,maskedEmail}`; riêng `id` ở đây là request code dạng string (`YC-DEMO-001`), không phải ID số của bảng SQLite. Email được che một phần; có thể null.
- Public form: `{templateName,type,scaleMin,scaleMax,question,allowComment,expiresAt,supportRequestId,centerId}`. Không lộ tên/email khách.
- Response: `{id,invitationId,score,comment,flaggedNegative,submittedAt}`. Comment không nhập trả null.
- Summary: `{responseCount,invitationCount,csat,csatCount,nps,npsCount,negativeCount,generatedAt,source,csatTarget}`. CSAT đơn vị %, NPS điểm −100..100; phạm vi toàn thời gian. `csatTarget=80` chỉ là mốc tham chiếu minh họa.

## Lỗi và hành vi phía gọi

| HTTP | Mã điển hình | Xử lý |
|---|---|---|
| 400 | VALIDATION_ERROR, INVALID_JSON, REQUEST_NOT_COMPLETED, CUSTOMER_MISMATCH, CONTACT_MISSING | Sửa dữ liệu; fields nếu có |
| 401 | UNAUTHORIZED, INVALID_CREDENTIALS | Xóa phiên với API bảo vệ, về đăng nhập |
| 404 | NOT_FOUND | Báo không tìm thấy |
| 405 | METHOD_NOT_ALLOWED | Phương thức không hỗ trợ tại route public survey đã nhận diện |
| 409 | TEMPLATE_NAME_EXISTS, TEMPLATE_IN_USE, INVITATION_EXISTS, INVITATION_LOCKED, CUSTOMER_OPTED_OUT, EXPIRED, ALREADY_ANSWERED | Hiển thị thông báo nghiệp vụ |
| 413 | BODY_TOO_LARGE | Giảm kích thước request (tối đa 16 KiB) |
| 429 | ACCOUNT_LOCKED | Chờ 15 phút |
| 500/503 | INTERNAL_ERROR | Thông báo an toàn và requestId, không lộ SQL/stack |

`AUTH_NOT_CONFIGURED` là mã nội bộ ánh xạ 503; `server.js` che mã/message của lỗi 5xx nên body thực tế vẫn là `INTERNAL_ERROR`. RequestId có trong header của mọi response và trong body lỗi 5xx. Không khẳng định mọi endpoint đều trả 405: các method không được xử lý ở route quản trị hiện fall through thành 404 sau kiểm session. Route quản trị thiếu/sai phiên trả 401 trước khi phân giải endpoint; health/public survey không cần session.

HTTP boundary đọc/kiểm JSON object cho POST và PUT trước khi gọi router; do đó JSON sai hoặc body quá 16 KiB có thể trả 400/413 trước cả kiểm session. Logout không cần payload, thành công trả `{loggedOut:true}`; dùng lại phiên đã logout trả 401. Lỗi 5xx có body `{error:"INTERNAL_ERROR",message:string,fields:{},requestId:string}`; message là thông báo chung, không phải raw exception. Bảng trên mô tả 17 cặp method/path đã hiện thực, không ngụ ý có PATCH, phân trang hoặc CRUD customer/support request.

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
