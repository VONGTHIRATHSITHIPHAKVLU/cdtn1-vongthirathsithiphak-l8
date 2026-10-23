# SmartCRM L8 — Khảo sát hài lòng CSAT / NPS

Track SE · VONGTHIRATH SITHIPHAK · MSSV 237480201IS04.

## 1. Phạm vi

Module khảo sát sau hỗ trợ: quản lý mẫu → tạo lời mời cho yêu cầu hoàn tất → khách hàng phản hồi → tổng hợp CSAT/NPS. Frontend React gọi API Node.js thật và lưu vào SQLite. Không xây dựng toàn bộ CRM.

## 2. Yêu cầu môi trường

- Node.js **24.15 trở lên**, npm; `node:sqlite` đi kèm Node, không cần dịch vụ CSDL riêng.
- Hai terminal PowerShell. Dùng `npm.cmd` nếu PowerShell chặn `npm.ps1`.
- Sao chép `.env.example` thành `.env`; điền `DEMO_PASSWORD` của riêng bạn. Tài khoản demo là `demo`, vai trò Quản lý.
- `APP_PORT=3000`, `DB_PATH=data/smartcrm.sqlite`, `VITE_API_BASE_URL=/api`. Vite chuyển `/api` tới backend cùng máy tại cổng 3000; nếu đổi cổng, cập nhật `vite.config.js`.
- SQLite là phương án dự phòng được tài liệu buổi 8 cho phép. Quyết định và giới hạn: [TD-08–TD-11](docs/thay-doi-thiet-ke.md).

## 3. Các bước dựng và chạy hệ thống

Chạy từ thư mục gốc của bản sao dự án:

```powershell
npm.cmd ci
Copy-Item .env.example .env
```

Mở `.env` trong IDE và điền `DEMO_PASSWORD`, sau đó:

```powershell
npm.cmd run migrate
npm.cmd run seed
npm.cmd run server
```

Terminal thứ hai, cùng thư mục gốc:

```powershell
npm.cmd run dev
```

Mở **http://127.0.0.1:5173**. Đăng nhập `demo` bằng mật khẩu bạn vừa cấu hình.

Kiểm thử và đóng gói frontend:

```powershell
npm.cmd test
npm.cmd run build
```

Luồng kiểm tra bằng giao diện:

1. Mở **Mẫu khảo sát**: tạo mẫu CSAT hoặc NPS, chỉnh sửa/xóa mẫu chưa dùng.
2. Mở **Lời mời**: chọn `YC-DEMO-001`, mẫu khảo sát, kênh dự kiến; tạo liên kết.
3. Mở liên kết trong tab mới: chọn điểm, nhập nhận xét, gửi, nhận lời cảm ơn.
4. Quay về **Tổng quan**: xem số phản hồi và CSAT/NPS từ CSDL. Mở lại lời mời sẽ báo đã trả lời.
5. Dừng backend, chuyển trang: phải có thông báo lỗi và nút **Thử lại**. Khởi động backend lại; phiên đăng nhập lưu trong RAM bị xóa nên đăng nhập lại.

Seed chạy lại không nhân đôi dữ liệu. Mỗi yêu cầu chỉ có một lời mời; dùng `YC-DEMO-002` để thử tiếp. `YC-DEMO-003` chưa hoàn tất và `YC-DEMO-004` đã từ chối nhận khảo sát để thử ngoại lệ.

**Dữ liệu seed chỉ là demo do dự án tạo**, không phải dữ liệu Mekong Mobile chính thức. Repo chưa có CSV được mô tả trước đây. Chưa thể đánh dấu hoàn thành yêu cầu chạy với bộ dữ liệu thật của môn học.

## 4. Kiến trúc và hợp đồng

```text
src/backend/routes/         HTTP + xác thực demo
src/backend/validators/     kiểm tra dữ liệu đầu vào
src/backend/services/       quy tắc khảo sát, CSAT/NPS
src/backend/repositories/   SQLite, transaction
src/backend/contracts/      snake_case → camelCase
src/frontend/src/api/       HTTP client duy nhất
src/frontend/src/pages/     Login, Templates, Invitations, Survey, Dashboard
src/frontend/src/components/ DataState và useData
database/migrations/        DDL chạy được, 6 bảng
scripts/                    migrate, seed
tests/                      nghiệp vụ + hợp đồng HTTP
```

[API](docs/api-contract.md) · [SRS](docs/srs.md) · [Kiểm chứng buổi 8–10](docs/buoi-08-10.md) · [DDL](database/migrations/001.sql).

## 5. Quy tắc và giới hạn

- Chỉ mời yêu cầu `COMPLETED`, đúng khách hàng, đang hoạt động và chưa opt-out; có thông tin liên hệ tương ứng.
- Một lời mời/yêu cầu; một phản hồi/lời mời. Token ngẫu nhiên 32 ký tự hex, hết hạn sau **14 ngày** theo API contract BT1. Đúng thời điểm hết hạn cũng bị chặn.
- CSAT: số nguyên 1–5, tiêu cực ≤2, CSAT% = điểm 4–5 / tổng phản hồi CSAT ×100.
- NPS: số nguyên 0–10, tiêu cực ≤6; NPS = %điểm 9–10 − %điểm 0–6. Không trộn mẫu số CSAT và NPS.
- Nhận xét tối đa 500 ký tự; không có dữ liệu thì trả `null` cho tỷ lệ, giao diện hiển thị `—`.
- Tạo lời mời hiện trả **liên kết cục bộ**, không gửi EMAIL/SMS và không tuyên bố người nhận đã nhận thư. `SENT` là trạng thái tương thích BT1; `deliveryMode=LOCAL_LINK` thể hiện giới hạn.
- Đăng nhập demo một vai trò, phiên ngẫu nhiên trong RAM, hết hạn 1 giờ; sai 5 lần khóa 15 phút. Chưa tích hợp tài khoản/phân quyền trung tâm SmartCRM thật, scheduler, gửi lại, xử lý phản hồi tiêu cực hoặc xuất Excel.
- Session token lưu `sessionStorage`, vẫn có rủi ro bị đọc nếu có XSS. React hiển thị nội dung dưới dạng text. Mật khẩu demo lấy từ `.env`; không phải hệ thống tài khoản production.

## 6. Trạng thái hiện tại — buổi 8–9–10

- [x] Migration 6 bảng, seed demo chạy lại được.
- [x] CRUD entity mẫu khảo sát qua routes → service → repository.
- [x] Lời mời/phản hồi transaction, ràng buộc UNIQUE chống trùng.
- [x] API client riêng, chuyển đổi hợp đồng; lỗi `error/message/fields`; 401 xóa phiên.
- [x] ≥3 màn hình gọi API thật, DataState tải/rỗng/lỗi và thử lại.
- [x] 13 test PASS: luồng đúng, giá trị biên, dữ liệu sai, hợp đồng HTTP end-to-end.
- [ ] Chạy dữ liệu mẫu chính thức của môn học (cần cung cấp CSV).
- [ ] Chụp ảnh trình duyệt kết quả, kiểm tra rộng/hẹp 375px và đối chiếu wireframe BT1.
- [ ] Peer review bởi sinh viên khác; commit/push theo từng đơn vị công việc, đối chiếu số commit yêu cầu.
- [ ] Cập nhật sơ đồ `.drawio` gốc, bìa và đổi tên repo GitHub theo TD-03/05/07.

Trạng thái build và kiểm chứng bản sao sạch được ghi riêng trong [biên bản](docs/buoi-08-10.md); không coi checklist toàn bộ môn học đã hoàn tất khi còn các mục trên.
