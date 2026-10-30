# SmartCRM L8 — Khảo sát hài lòng CSAT / NPS

Track SE · VONGTHIRATH SITHIPHAK · MSSV 237480201IS04 · Lớp 261_71ITGR40203_03.

## 1. Phạm vi

Module khảo sát sau hỗ trợ: quản lý mẫu → tạo lời mời cho yêu cầu hoàn tất → khách hàng phản hồi → tổng hợp CSAT/NPS. Frontend React gọi API Node.js thật và lưu vào SQLite. Không xây dựng toàn bộ CRM.

## 2. Yêu cầu môi trường

- Node.js **24.15 trở lên**, npm; `node:sqlite` đi kèm Node, không cần dịch vụ CSDL riêng.
- Hai terminal PowerShell. Dùng `npm.cmd` nếu PowerShell chặn `npm.ps1`.
- Sao chép `.env.example` thành `.env`; điền `DEMO_PASSWORD` của riêng bạn. Tài khoản demo là `demo`, vai trò Quản lý.
- `APP_PORT=3000`, `DB_PATH=data/smartcrm.sqlite`, `VITE_API_BASE_URL=/api`. Vite đọc `APP_PORT` từ `.env` để chuyển `/api` tới backend. `APP_HOST=127.0.0.1` khi chạy cục bộ; container dùng `0.0.0.0`.
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

[API](docs/api-contract.md) · [SRS](docs/srs.md) · [Kiểm chứng BT2](docs/buoi-11-12.md) · [DDL](database/migrations/001.sql).

## 5. Quy tắc và giới hạn

- Chỉ mời yêu cầu `COMPLETED`, đúng khách hàng, đang hoạt động và chưa opt-out; có thông tin liên hệ tương ứng.
- Một lời mời/yêu cầu; một phản hồi/lời mời. Token ngẫu nhiên 32 ký tự hex, hết hạn sau **14 ngày** theo API contract BT1. Đúng thời điểm hết hạn cũng bị chặn.
- CSAT: số nguyên 1–5, tiêu cực ≤2, CSAT% = điểm 4–5 / tổng phản hồi CSAT ×100.
- NPS: số nguyên 0–10, tiêu cực ≤6; NPS = %điểm 9–10 − %điểm 0–6. Không trộn mẫu số CSAT và NPS.
- Nhận xét tối đa 500 ký tự; không có dữ liệu thì trả `null` cho tỷ lệ, giao diện hiển thị `—`.
- Tạo lời mời hiện trả **liên kết cục bộ**, không gửi EMAIL/SMS và không tuyên bố người nhận đã nhận thư. `SENT` là trạng thái tương thích BT1; `deliveryMode=LOCAL_LINK` thể hiện giới hạn.
- Đăng nhập demo một vai trò, phiên ngẫu nhiên trong RAM, hết hạn 1 giờ; sai 5 lần khóa 15 phút. Chưa tích hợp tài khoản/phân quyền trung tâm SmartCRM thật, scheduler, gửi lại, xử lý phản hồi tiêu cực hoặc xuất Excel.
- Session token lưu `sessionStorage`, vẫn có rủi ro bị đọc nếu có XSS. React hiển thị nội dung dưới dạng text. Mật khẩu demo lấy từ `.env`; không phải hệ thống tài khoản production.

## 6. Trạng thái hiện tại — buổi 11–12

- [x] Migration 6 bảng, seed demo chạy lại được.
- [x] CRUD entity mẫu khảo sát qua routes → service → repository.
- [x] Lời mời/phản hồi transaction, ràng buộc UNIQUE chống trùng.
- [x] API client riêng, chuyển đổi hợp đồng; lỗi `error/message/fields`; 401 xóa phiên.
- [x] ≥3 màn hình gọi API thật, DataState tải/rỗng/lỗi và thử lại.
- [x] 20/20 test PASS: luồng đúng, giá trị biên, dữ liệu sai, HTTP end-to-end, CRUD lời mời, seed lặp lại, logging và lỗi 500/requestId. Output mới: [latest-test-output.txt](docs/evidence/bt2/latest-test-output.txt).
- [x] Hai thực thể có CRUD qua API: mẫu khảo sát và lời mời. Lời mời chỉ sửa kênh khi còn hiệu lực; không xóa lời mời đã trả lời.
- [ ] Chạy dữ liệu mẫu chính thức của môn học (cần cung cấp CSV).
- [x] Docker runtime/proxy và SQLite persistence qua restart/recreate đã có bằng chứng riêng.
- [x] Templates local sau sửa CSS: 375×812 không tràn, desktop 1440×900 giữ giao diện; CRUD PASS. [Kết quả](docs/evidence/bt2/templates-responsive/after.json).
- [x] Docker sau sửa CSS: CRUD, persistence, 5 màn hình × 2 kích thước và raw log an toàn PASS. [Bằng chứng](docs/evidence/bt2/smartcrm-bt2-runtime-1793305395728/results.json).
- [ ] Sinh viên đối chiếu wireframe BT1 và tự xác nhận.
- [ ] Peer review bởi sinh viên khác; commit/push theo từng đơn vị công việc, đối chiếu số commit yêu cầu.
- [ ] Cập nhật sơ đồ `.drawio` gốc, bìa và đổi tên repo GitHub theo TD-03/05/07.

Trạng thái kiểm chứng và việc còn lại: [biên bản BT2](docs/buoi-11-12.md).

## 7. Docker Compose (buổi 11)

Cần Docker Desktop đang chạy với Linux containers. Tạo `.env` từ `.env.example`, điền `DEMO_PASSWORD`, rồi:

```powershell
docker compose config --quiet
docker compose build
docker compose up --build -d
docker compose ps
```

Mở **http://127.0.0.1:8080** (`WEB_PORT`). API tự chạy migration và seed, lưu SQLite trong volume `sqlite_data`; web Nginx đợi API healthy. Không cần container CSDL riêng vì SQLite là CSDL nhúng. Không dùng Vite dev server trong container.

```powershell
docker compose logs api
docker compose down
```

`down` giữ dữ liệu; không dùng `down -v` với dữ liệu cần giữ. Cổng Docker bận: đổi `WEB_PORT` hoặc `API_HOST_PORT` trong `.env`, rồi chạy lại `docker compose up -d`. `APP_PORT` chỉ đổi cổng backend khi chạy local. Nếu trước đây dùng `APP_PORT` để đổi cổng host Docker, chuyển giá trị đó sang `API_HOST_PORT`.

| Biến/cấu hình | Local | Docker | Thời điểm áp dụng |
|---|---|---|---|
| `APP_HOST`, `APP_PORT` | Backend bind `127.0.0.1:3000` mặc định; Vite proxy đọc `APP_PORT` | Compose đặt cố định `0.0.0.0:3000` | Backend runtime |
| `DB_PATH` | Đường dẫn SQLite tương đối thư mục gốc, mặc định `data/smartcrm.sqlite` | Cố định `/app/data/smartcrm.sqlite`, nằm trong volume | Backend runtime |
| `DEMO_PASSWORD`, `LOG_LEVEL` | Node đọc từ `.env` | Compose truyền vào API qua `environment` | Backend runtime; đổi cần tạo lại container |
| `VITE_API_BASE_URL` | Vite dev/build đọc `.env`, mặc định `/api` | Compose truyền build argument cố định `/api` | Frontend build-time; cần build lại image để đổi bundle |
| `API_HOST_PORT` | Không dùng | `127.0.0.1:API_HOST_PORT` → `api:3000` | Compose tạo container |
| `WEB_PORT` | Không dùng; Vite dùng 5173 | `127.0.0.1:WEB_PORT` → `web:80` | Compose tạo container |

Compose dùng `.env` để nội suy các biến được tham chiếu, không tự truyền toàn bộ `.env` vào container. `.env` và dữ liệu local bị loại khỏi Docker build context. Biến `VITE_*` là cấu hình công khai trong JavaScript gửi tới trình duyệt; không đặt mật khẩu/token vào đó. Docker cố định `/api` để tránh gọi nhầm backend ngoài proxy.

Luồng Docker: trình duyệt gọi `http://127.0.0.1:WEB_PORT/api/...` → Nginx giữ nguyên đường dẫn `/api/...` → `http://api:3000/api/...`. `api` là DNS nội bộ Docker, không phải URL dành cho trình duyệt. Nginx phân giải lại DNS khi API được tạo lại; frontend route như `/survey/<token>` dùng SPA fallback. Vite dev proxy chỉ có tác dụng khi chạy `npm.cmd run dev`.

Volume `sqlite_data` gắn tại `/app/data`; tên thực tế thường là `<compose-project>_sqlite_data`. Giữ nguyên thư mục/tên project Compose (không đổi `-p` hoặc `COMPOSE_PROJECT_NAME`) để dùng lại volume cũ. Restart/recreate container cùng project giữ database; migration/seed chạy trước API và không nhân đôi dữ liệu. Docker không tự nhập `data/smartcrm.sqlite` trên máy host. Không xóa volume hoặc đổi `DB_PATH` sang thư mục ngoài mount nếu muốn giữ dữ liệu qua recreate.

Kiểm tra vận hành bằng `docker compose ps`, `docker compose logs api`, và `http://127.0.0.1:WEB_PORT/api/health`. Có thể kiểm tra restart bằng `docker compose restart api`, đợi API healthy và gọi lại API đọc dữ liệu; phiên đăng nhập trong RAM sẽ mất nên cần đăng nhập lại. Với kiểm tra mất backend, giao diện phải báo lỗi và cho thử lại. Chỉ kiểm tra recreate/persistence trên môi trường đã sao lưu hoặc volume kiểm thử riêng.

Log JSON ra stdout có timestamp, level, requestId, method, route, status, durationMs; token trong đường dẫn được che, không ghi body/header/password/comment. Lỗi 5xx có thông tin chẩn đoán đã lọc trong log, API và giao diện có mã tra cứu requestId. `LOG_LEVEL=debug|info|warn|error`.

Kết quả runtime Docker: [results.json](docs/evidence/bt2/smartcrm-bt2-runtime-1793303619791/results.json). API healthy, web/proxy hoạt động, dữ liệu giữ sau restart và force-recreate. Đây là lịch sử trước sửa. Lượt Docker mới `smartcrm-bt2-runtime-1793305395728` đã kiểm lại CSS: cả 5 màn hình/2 kích thước không tràn document, CRUD và persistence PASS; [responsive](docs/evidence/bt2/smartcrm-bt2-runtime-1793305395728/responsive.json). Không kết luận về trình duyệt ngoài Chrome.

## 8. Chuẩn bị nộp BT2

[Checklist và demo 3 phút](docs/buoi-11-12.md) · [Bug Log](docs/bug-log.md) · [Khai báo AI](docs/ai-disclosure.md).

Báo cáo chuẩn bị: [PDF 8 trang](docs/BT2_237480201IS04_VONGTHIRATH_SITHIPHAK.pdf), [nguồn HTML báo cáo](docs/BT2_237480201IS04_VONGTHIRATH_SITHIPHAK.html), [ảnh chạy thật](docs/evidence/bt2/). Muốn xuất lại sau khi sửa HTML, cần Chrome và công cụ tạm (không phải dependency của ứng dụng):

```powershell
npm.cmd install --prefix .tmp/tools --no-package-lock --no-save playwright
node scripts/export-bt2.cjs
```

`node scripts/capture-bt2.cjs` chụp lại luồng trên SQLite tạm, dùng cổng 3102/5175; không thay CSDL demo hiện có. Sau khi chụp lại, xuất PDF lần nữa.

Script capture trên là công cụ lịch sử, chạy tập con 17 test và ghi ảnh/tệp cũ. Không dùng output đó để xác nhận 20 test. Báo cáo hiện dùng `latest-tests.png` và `latest-test-output.txt` từ lệnh đầy đủ `npm.cmd test`; ảnh luồng Docker lấy từ thư mục runtime riêng.

Kiểm tra báo cáo PDF, tên lớp trên bìa, ảnh minh chứng và mã nguồn trước khi commit/tag. Tag `v0.2` phải trỏ tới commit chứa toàn bộ bài; đẩy nhánh và tag riêng. Xác nhận repo public và nộp PDF + link repo trên VLU E-learning trước khi kết thúc buổi 12. Không coi bản nháp báo cáo hay tag cục bộ là đã nộp.

Mã lớp đã xác nhận: **261_71ITGR40203_03**. Thông tin nộp còn thiếu: xác nhận URL remote hiện tại và chênh lệch MSSV trong tên repo (`237480210is04`) với MSSV đúng (`237480201IS04`); commit/link sửa lỗi; tag v0.2 local/remote; repo public; clone-and-run theo tag; sinh viên tự kiểm khai báo AI; xác nhận nộp E-learning. Xem [kiểm kê minh chứng](docs/evidence/bt2/evidence-audit.md).

Checklist theo ba PDF và giới hạn: [bt2-checklist.md](docs/bt2-checklist.md). C1 sau push: [clone-and-run-v0.2.md](docs/clone-and-run-v0.2.md); chưa PASS trước khi clone thật. PostgreSQL trong PDF là mẫu triển khai; chấp thuận SQLite khi chấm sát mẫu cần giảng viên xác nhận.
