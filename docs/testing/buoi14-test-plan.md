
# Test Plan — Buổi 14

VONGTHIRATH SITHIPHAK · 237480201IS04 · SE/L8 · 06/11/2026 (Asia/Bangkok).
Đối chiếu PDF Buổi 13 trang 6, 9, 11–16, 19–23 và PDF Buổi 14 trang 2–11.

Cập nhật hồ sơ BT3 ngày 13/11/2026: kế hoạch và phân bố 12 mã TC bên dưới là của Buổi 14; giữ nguyên dữ liệu/ảnh gốc. Ba bug đã có commit riêng, không còn thiếu bug thứ ba hoặc link commit. Suite hiện tại gồm 40 test lịch sử + 1 bootstrap + 3 security = **44**, đã PASS trên [clean clone GitHub b6a66b5](github-cleanclone-report.md). Docker/Chrome/persistence đã được kiểm riêng ở Buổi 16; các loại trừ dưới đây chỉ mô tả lượt Buổi 14. Không có kết quả test mới được tạo trong lần rà tài liệu này.

## 1. Phạm vi

Kiểm thử implementation hiện tại: mẫu CSAT/NPS, điều kiện COMPLETED, token riêng và dùng một lần, validation, hạn 14 ngày, transaction SQLite, tổng hợp riêng CSAT/NPS, migration/seed lặp. Nguồn: `docs/srs.md` US1–5/7 và ngoại lệ UC trả lời, `docs/api-contract.md`, README mục 5, validators/service/routes/migration và bug log BT2. SRS hiện chỉ có mô tả luồng và ngoại lệ, không có nguyên văn Given–When–Then BT1; không tự gán mã AC/QT chưa được cung cấp.

Chủ ý không kiểm: EMAIL/SMS thật, scheduler, nhắc lại, phân quyền trung tâm, xuất file, workflow xử lý tiêu cực (chưa hiện thực); acceptance bởi người dùng, tải đồng thời, penetration test, giao diện đa trình duyệt, Docker runtime/máy trắng. Không thay hoặc xuất lại PDF BT2.

## 2. Phân bố và kỹ thuật

Giữ **12 mã ca** với nền ban đầu **7 unit (TC-01–07), 3 integration (TC-08–10), 2 system/API (TC-11–12)**; bổ sung HTTP-04/05 để kiểm cùng tình huống sai của TC-04/05 qua HTTP thật. Không xóa unit cũ. Vì vậy có 14 test tự động cho 12 mã ca: 7 unit + 3 integration + 4 HTTP/API; TC-04/05 là ca có kiểm nhiều tầng. Unit cô lập SQLite/mạng, service dùng repo giả và đồng hồ cố định. Integration dùng service/repository/SQLite thật hoặc migration/seed thật. API dùng HTTP server thật trên loopback cổng ngẫu nhiên, mật khẩu/phiên phát sinh trong RAM.

Phân vùng tương đương: điểm số nguyên hợp lệ, ngoài miền, sai kiểu; tên hợp lệ/rỗng; yêu cầu COMPLETED/OPEN; token hợp lệ/sai/đã dùng. Giá trị biên: TC-02 điểm CSAT=1 và TC-03=0 ở hai bên ngưỡng dưới 1; TC-06 đúng thời điểm hết hạn. Năm loại gồm luồng đúng, biên, dữ liệu sai (TC-04/05), bảo mật/chất lượng dữ liệu (TC-10/12), tái lập (TC-09). Bộ cũ bổ sung NPS 0/10, CSAT 5/6, nhận xét 500/501, opt-out, mẫu đã dùng và CRUD lời mời.

## 3. Tiêu chí đo được

Mỗi assertion phải khớp hoàn toàn. Unit kiểm giá trị hoặc `AppError.code/fields`; **không gán HTTP status cho unit**. API TC-11 phải 404/NOT_FOUND và số mẫu 1→1; TC-12 phải 201, tên trả về và SQLite giống hệt tiếng Việt đầu vào, số mẫu 1→2. TC-08 không thêm invitation/log; TC-10 chỉ một response, ANSWERED, log 2→3, CSAT=100; TC-09 hai lần cùng số đếm [4,4,1,0,0,0]. Summary hỗn hợp phải CSAT=50, NPS=0, tiêu cực=2. Chạy riêng từng ca và cả suite để xác nhận độc lập. Ghi thời lượng thật trong raw output; không suy ra đạt NFR 95% API <500ms từ thời gian test hoặc số mẫu nhỏ. Yêu cầu toàn bộ 40 test PASS: 20 cũ + 12 workshop ban đầu + 2 HTTP bổ sung + 3 thăm dò + 3 regression BUG-14-03; diff check exit 0. Hai HTTP phải trả 400, body đúng error/message/fields và các số đếm SQLite giữ nguyên; phản hồi sai phải giữ lời mời SENT. Build đã có bằng chứng lịch sử, không chạy lại khi chỉ bổ sung test/runner/tài liệu.

## 4. Môi trường, dữ liệu và thực thi

Windows/PowerShell, Node v24.22.1, npm 11.19.1, React/Vite, Node HTTP thuần (không Express), `node:test`, `node:sqlite`. CI đề xuất Ubuntu cùng Node. SQLite `:memory:` mới cho từng ca; TC-09 dùng thư mục tạm mới, chạy script migrate/seed hai lần rồi dọn đúng thư mục đó. Dữ liệu synthetic: YC-001 COMPLETED, YC-002 OPEN, khách `test@example.invalid`; không đọc `.env`, không dùng database hiện hữu. Đồng hồ nghiệp vụ cố định `2026-11-06T00:00:00.000Z`; HTTP port 0; token ngẫu nhiên chỉ kiểm định dạng/tính khác nhau và không ghi token vào evidence.

Chạy `node scripts/test-buoi14.js` hoặc thêm `TC-01` … `TC-12` để chạy riêng (TC-04/05 gồm cả unit và HTTP). Mỗi lần tạo thư mục evidence UTF-8 mới `docs/testing/evidence/run-<UTC>-<pid>/`, không ghi đè file cũ. Thăm dò bổ sung: giới hạn body 16384/16385 byte, JSON lỗi/array/null, chưa đăng nhập, request thiếu/sai khách/thiếu liên hệ, biên khóa 15 phút và phiên 1 giờ; không coi test thăm dò PASS là bằng chứng có bug mới. Kiểm toàn bộ: `npm.cmd ci`, `npm.cmd test`, `npm.cmd run build`, `git diff --check`. Đã mở và đối chiếu đủ 12/12 [ảnh thật TC-01–TC-12](../screenshots/) ngày 07/11/2026; từng ảnh và raw của chính lần chụp được liên kết trong [Test Report](buoi14-test-report.md). Raw output does not replace required screenshots. Three bugs and their commit links are complete. Original personal BT2 feedback and BT1 Acceptance Criteria remain unavailable; do not invent them.
