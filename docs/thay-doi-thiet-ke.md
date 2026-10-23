# Nhật ký thay đổi thiết kế

## Sprint 1–2 — buổi 8–9–10, ngày 23/10/2026

### TD-08 Dùng SQLite làm CSDL dự phòng
- Đầu vào : README ghi MySQL, SRS ghi MongoDB, DDL BT1 ghi PostgreSQL; repo chưa có implementation.
- Quyết định : SỬA, chọn SQLite có sẵn trong Node 24 để chạy cục bộ; giữ 6 bảng và quan hệ BT1.
- Lý do : Buổi 8 cho phép SQLite dự phòng; tránh yêu cầu cài dịch vụ PostgreSQL để kiểm chứng module đầu tiên.
- Ảnh hưởng : migration SQL thực thi trong database/migrations/001.sql; README, .env và SRS thống nhất. PostgreSQL là thiết kế đích, chưa có adapter production.

### TD-09 Thực thi hợp đồng mẫu khảo sát và thời hạn
- Đầu vào : DDL BT1 thiếu question/allowComment đã có trong API; SRS cũ ghi 7 ngày nhưng API ghi 14 ngày.
- Quyết định : SỬA, thêm question/allow_comment, chọn 14 ngày theo API BT1; không cho sửa/xóa mẫu đã dùng.
- Lý do : Không thể dựng form từ CSDL nếu thiếu câu hỏi; giữ lịch sử thang điểm nhất quán.
- Ảnh hưởng : migration, validator, service, SRS/API và unit test. docs/ddl-l8.sql là bản thiết kế PostgreSQL cũ, không chạy như migration SQLite.

### TD-10 Chuẩn hóa hợp đồng lỗi theo buổi 9
- Đầu vào : Contract cũ dùng code/errors, tài liệu buổi 9 yêu cầu error/message/fields.
- Quyết định : SỬA đồng thời backend, frontend và tài liệu; thêm CRUD đọc/sửa/xóa và API danh sách.
- Lý do : Một ranh giới chuyển đổi và một client HTTP để xử lý 401, lỗi mạng và validation nhất quán.
- Ảnh hưởng : api-contract.md, toTemplate/toInvitation, DataState, test HTTP; không có client cũ đang triển khai trong repo.

### TD-11 Giới hạn Sprint 2 và minh chứng
- Đầu vào : Buổi 10 cho phép hoãn chức năng phụ nhưng giữ luồng chính, test và README.
- Quyết định : GIỮ luồng tạo mẫu–mời–phản hồi–báo cáo; tạm hoãn gửi EMAIL/SMS thật, scheduler, export, nhắc lại, workflow tiêu cực và phân quyền trung tâm.
- Lý do : Chưa có thông tin tích hợp, dữ liệu CSV chính thức hoặc tài khoản SmartCRM; không tuyên bố tích hợp ngoài đã chạy.
- Ảnh hưởng : lời mời trả deliveryMode LOCAL_LINK, UI và README ghi rõ demo; bộ test HTTP chứng minh luồng cục bộ. Chưa đánh dấu hoàn tất tiêu chí dữ liệu thật, ảnh màn hình hay peer review.

## Sau phản hồi Bài tập 1 (buổi 8, ngày 19/10/2026)

Chuyên đề tốt nghiệp 1 · Track SE · Luồng L8 (khảo sát CSAT/NPS) · Mekong Mobile

Phản hồi của GV (ThS. Nguyễn Minh Tân) có phần "Điểm tốt" (NFR có điều kiện đo, đặc tả UC3, lập luận kiến trúc, thuật ngữ thống nhất): giữ nguyên, không thay đổi thiết kế. Các điểm "Cần khắc phục" xử lý như dưới đây.

### TD-01 Giảm số User Story từ 8 xuống 7
- Phản hồi của GV : Có 8 User Story, đề yêu cầu 5–7.
- Quyết định : SỬA
- Lý do : US4 (xem điểm CSAT/NPS) và US7 cũ (xuất CSV) cùng do Quản lý thực hiện trên cùng dữ liệu báo cáo, nên gộp được mà không mất yêu cầu nào. FR5 và FR8 vẫn tách riêng, UC4 và UC7 vẫn giữ.
- Ảnh hưởng : SRS mục 4 (US4 gộp, US8 cũ đổi thành US7), bảng truy vết mục 7, danh sách Use Case (Chương 2), API contract (Chương 3). Use Case Diagram không đổi.

### TD-02 Bỏ bảng service_center khỏi ERD của L8
- Phản hồi của GV : ERD có 7 bảng, đề yêu cầu 4–6; có thể bỏ bảng chỉ đọc như service_center.
- Quyết định : SỬA
- Lý do : service_center thuộc luồng khác và L8 chỉ đọc. L8 chỉ cần mã trung tâm (center_id) để phân quyền theo QT-14, nên giữ cột support_request.center_id mà không cần bảng.
- Ảnh hưởng : ERD còn 6 bảng (customer, support_request, survey_template, survey_invitation, response, survey_log); Chương 4 mục 1 và DDL; thuật ngữ số 9. Về mã nguồn: migration không tạo service_center và không nạp dữ liệu service_centers; support_request.center_id là cột thường, không có khóa ngoại trong CSDL của L8.

### TD-03 Thêm chú thích ký hiệu cho sơ đồ kiến trúc
- Phản hồi của GV : Sơ đồ kiến trúc chưa có chú thích ký hiệu (khối, mũi tên nghĩa là gì).
- Quyết định : SỬA
- Lý do : Người đọc không suy ra được màu khối và chiều mũi tên nếu thiếu chú thích.
- Ảnh hưởng : Hình 3.1 (docs/export/architecture.png). Việc còn lại: cập nhật file .drawio gốc cho khớp.

### TD-04 Sửa MSSV trên trang bìa
- Phản hồi của GV : MSSV trên trang bìa ghi sai (237480210IS04).
- Quyết định : SỬA
- Lý do : Đối chiếu với tên file nộp, MSSV đúng là 237480201IS04.
- Ảnh hưởng : Trang bìa và dòng ký tên cuối báo cáo.

### TD-05 Đặt link GitHub ở trang bìa
- Phản hồi của GV : Link GitHub cần đặt ở trang bìa.
- Quyết định : SỬA
- Lý do : Giảng viên cần mở thẳng repo từ trang đầu để chấm.
- Ảnh hưởng : Trang bìa. Việc còn lại: cập nhật link sau khi đổi tên repo (TD-07).

### TD-06 Viết lại cột "Đã kiểm chứng thế nào" trong Phụ lục AI
- Phản hồi của GV : Phụ lục AI còn dòng mẫu; phải tự ghi cách đã kiểm chứng.
- Quyết định : SỬA
- Lý do : Phần này phải phản ánh việc em thực sự đã làm.
- Ảnh hưởng : Phụ lục AI. Trạng thái: CHƯA XONG, em tự điền.

### TD-07 Chỉnh repo GitHub
- Phản hồi của GV : Repo chưa có file .drawio gốc; commit "upload", "change" chưa rõ nghĩa; tên repo "lead-management" không đúng luồng L8.
- Quyết định : SỬA
- Lý do : Repo là nơi GV đối chiếu thiết kế với mã nguồn, nên tên, sơ đồ gốc và lịch sử commit phải rõ ràng.
- Ảnh hưởng : Đổi tên repo thành smartcrm-l8-csat-nps; thêm các file .drawio vào docs/export/ hoặc docs/diagrams/; commit mới theo Conventional Commits (không viết lại lịch sử cũ). Trạng thái: commit mới đã theo quy ước; còn đổi tên repo trên GitHub và thêm file .drawio gốc.
