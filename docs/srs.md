# SRS — SmartCRM L8: CSAT/NPS

Track SE · Node.js, React, SQLite dự phòng. Đây là bản đồng bộ Sprint 1–2; thay bản cũ ghi lẫn MongoDB/MySQL/PostgreSQL và 8 story. PostgreSQL trong thiết kế BT1 được giữ làm đích khi triển khai, migration hiện chạy SQLite (TD-08).

## Phạm vi và actor

Khách hàng mở token và trả lời; nhân viên CSKH tạo lời mời; Quản lý quản lý mẫu và theo dõi kết quả; Scheduler kích hoạt sau hoàn tất trong thiết kế đích. Prototype hiện dùng một tài khoản demo Quản lý; chưa có scheduler hay phân quyền theo trung tâm.

## User story và truy vết

| US | Nhu cầu | Ưu tiên | Mã hiện thực / trạng thái |
|---|---|---|---|
| US1 | Quản lý tạo và quản lý mẫu CSAT/NPS | MUST | CRUD mẫu, Templates, toTemplate |
| US2 | CSKH mời khách sau yêu cầu hoàn tất | MUST | invite; liên kết cục bộ, chưa gửi thư/scheduler |
| US3 | Khách chấm điểm, nhận xét một lần qua token | MUST | publicSurvey/respond, Survey |
| US4 | Quản lý xem điểm và xuất báo cáo (gộp story xuất cũ) | SHOULD | summary, Dashboard; chưa xuất file/lọc thời gian |
| US5 | CSKH nhận biết và xử lý phản hồi tiêu cực | SHOULD | flaggedNegative, đếm; chưa workflow xử lý/thông báo |
| US6 | CSKH nhắc lại lời mời chưa phản hồi | COULD | chưa hiện thực |
| US7 | Khách từ chối nhận khảo sát | SHOULD | kiểm tra survey_opt_out; chưa có trang opt-out |

Đăng nhập là cơ chế hỗ trợ dùng chung. Bảy story theo nhật ký TD-01, thuật ngữ theo API contract; không thêm chức năng CRM ngoài L8.

## Use case chính — Trả lời khảo sát

Điều kiện trước: yêu cầu COMPLETED, lời mời đã tạo, chưa phản hồi, thời điểm hiện tại < expiresAt.

1. Nhân viên chọn yêu cầu và mẫu, tạo lời mời.
2. Khách mở `/survey/:token`; API kiểm tra token và hạn 14 ngày.
3. Giao diện đọc thang điểm và câu hỏi từ API, không ghi cứng dữ liệu khảo sát.
4. Khách chọn điểm và nhập nhận xét nếu mẫu cho phép.
5. API kiểm tra số nguyên và giới hạn, lưu phản hồi, cập nhật ANSWERED, ghi log trong một transaction.
6. Hiện lời cảm ơn; quản lý mở báo cáo lấy dữ liệu CSDL mới.

Ngoại lệ: token sai 404; hết hạn 409 EXPIRED; trả lời lần hai 409 ALREADY_ANSWERED; điểm sai 400 và không lưu; mất kết nối hiển thị lỗi có Thử lại. Mẫu đã dùng không chỉnh sửa, tránh đổi thang điểm của phản hồi lịch sử.

## Dữ liệu và chất lượng

6 bảng: customer, support_request, survey_template, survey_invitation, response, survey_log. customer/support_request là dữ liệu từ luồng khác, chỉ đọc qua API L8. center_id không FK theo TD-02. Question và allow_comment được bổ sung vào template để thực thi contract đã nộp.

Mục tiêu NFR: 95% API <500ms, gửi khảo sát ≤5 phút, thông báo tiêu cực ≤1 phút; các ngưỡng này chưa được kiểm chứng bằng load test hay tích hợp nhà cung cấp. Prototype dùng phiên RAM 1 giờ và token khảo sát randomBytes; không tuyên bố đã đạt xác thực/phân quyền production. Dữ liệu seed demo không thay thế dữ liệu mẫu chính thức.

Kiểm chứng nghiệp vụ: `npm.cmd test`; checklist và giới hạn ở `docs/buoi-08-10.md`.
