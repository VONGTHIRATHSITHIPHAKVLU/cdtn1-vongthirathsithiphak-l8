# SmartCRM L8 — Khảo sát hài lòng CSAT / NPS

Buổi 15 / BT3: [Deployment Guide (English)](docs/deployment-guide.md).
[Security Checklist: bảy mục, kết quả và giới hạn](docs/security-checklist.md).
Trong checkout hiện tại chạy `node scripts/demo.js` để tự tạo mật khẩu demo local
và dựng Docker; không cần tự điền secret. Quy trình clone mới gồm hai lệnh trong
guide, nhưng **C1 chưa xác minh** cho đến khi chạy thật từ revision được công bố.
Giữ SQLite, named volume và cách chạy npm/manual bên dưới; không đổi tag v0.2.

Trạng thái Buổi 15–16, 13/11/2026: snapshot local độc lập đã build/up Docker,
API/web healthy, suite 44/44 PASS, TC-07 PASS, seed lặp và restart persistence PASS.
Xem [báo cáo và ảnh thật](docs/testing/buoi16-deployment-report.md).
Đây chưa phải clean clone GitHub; C1 chỉ hoàn tất sau khi kiểm revision công khai.
Các mục Buổi 11–14 bên dưới giữ số liệu lịch sử 20/40 test của từng giai đoạn;
không dùng chúng thay cho kết quả Buổi 15–16. Security Checklist còn ghi rõ giới hạn
owner/center, mã hoá dữ liệu và TLS; chưa xác nhận hoàn tất toàn bộ BT3.

Kiểm thử Buổi 14: [Test Plan](docs/testing/buoi14-test-plan.md),
[12 test case và kết quả thật](docs/testing/buoi14-test-report.md),
[Bug Log](docs/testing/buoi14-bug-log.md), [12 ảnh TC đã kiểm tra](docs/screenshots/).
Chạy từng ca độc lập: `node scripts/test-buoi14.js TC-01` (đến `TC-12`);
chạy toàn bộ 12 ca và lưu raw evidence: `node scripts/test-buoi14.js`.
`npm.cmd test` chạy cả bộ cũ lẫn mới. Các commit sửa ba bug Buổi 14 đã có;
không chạy script xuất PDF BT2 khi thực hiện workshop này.

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

Sơ đồ triển khai và luồng dữ liệu được vẽ lại từ các entry point hiện tại trong
`src/`, `Dockerfile`, `compose.yaml` và `deploy/nginx.conf`:
[architecture.svg](docs/export/architecture.svg).

```text
Browser → Nginx (web:80) → Node API (api:3000)
                                      ↓
                           SQLite /app/data (named volume)
```

Chú thích: khối là một tiến trình/container hoặc vùng dữ liệu; mũi tên liền
là HTTP/proxy; mũi tên xuống là lời gọi nội bộ hoặc đọc/ghi dữ liệu. Khi chạy
local, Vite thay Nginx và proxy `/api` tới backend `APP_PORT`.

Các lớp trong API: `routes` (HTTP + xác thực demo) → `validators`/`services`
(kiểm tra và quy tắc CSAT/NPS) → `repositories` (SQLite, transaction);
`contracts` chuyển đổi `snake_case` ↔ `camelCase`. Frontend dùng HTTP client
duy nhất trong `src/frontend/src/api/`; migration/seed nằm trong `scripts/`;
test nghiệp vụ và HTTP nằm trong `tests/`.

[API](docs/api-contract.md) · [SRS](docs/srs.md) · [Minh chứng BT2](docs/evidence/bt2/evidence-audit.md) · [DDL](database/migrations/001.sql).

## 5. Quy tắc và giới hạn

- Chỉ mời yêu cầu `COMPLETED`, đúng khách hàng, đang hoạt động và chưa opt-out; có thông tin liên hệ tương ứng.
- Một lời mời/yêu cầu; một phản hồi/lời mời. Token ngẫu nhiên 32 ký tự hex, hết hạn sau **14 ngày** theo API contract BT1. Đúng thời điểm hết hạn cũng bị chặn.
- CSAT: số nguyên 1–5, tiêu cực ≤2, CSAT% = điểm 4–5 / tổng phản hồi CSAT ×100.
- NPS: số nguyên 0–10, tiêu cực ≤6; NPS = %điểm 9–10 − %điểm 0–6. Không trộn mẫu số CSAT và NPS.
- Nhận xét tối đa 500 ký tự; không có dữ liệu thì trả `null` cho tỷ lệ, giao diện hiển thị `—`.
- Tạo lời mời hiện trả **liên kết cục bộ**, không gửi EMAIL/SMS và không tuyên bố người nhận đã nhận thư. `SENT` là trạng thái tương thích BT1; `deliveryMode=LOCAL_LINK` thể hiện giới hạn.
- Đăng nhập demo một vai trò, phiên ngẫu nhiên trong RAM, hết hạn 1 giờ; sai 5 lần khóa 15 phút. Chưa tích hợp tài khoản/phân quyền trung tâm SmartCRM thật, scheduler, gửi lại, xử lý phản hồi tiêu cực hoặc xuất Excel.
- Session token lưu `sessionStorage`, vẫn có rủi ro bị đọc nếu có XSS. React hiển thị nội dung dưới dạng text. Mật khẩu demo lấy từ `.env`; không phải hệ thống tài khoản production.

## 6. Trạng thái lịch sử — buổi 11–12

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

Trạng thái kiểm chứng và việc còn lại: [kiểm kê minh chứng BT2](docs/evidence/bt2/evidence-audit.md).

## 7. Docker Compose (buổi 11)

Cần Docker Desktop đang chạy với Linux containers. Tạo `.env` từ `.env.example`, điền `DEMO_PASSWORD`, rồi:

```powershell
docker compose config --quiet
docker compose build
docker compose up --build -d
docker compose ps
```

Mở **http://127.0.0.1:8080** (`WEB_PORT`). API tự chạy migration và seed, lưu SQLite trong volume `sqlite_data`; web Nginx đợi API healthy. Không cần container CSDL riêng vì SQLite là CSDL nhúng. Không dùng Vite dev server trong container.

`WEB_PORT` là cổng trên máy host được ánh xạ vào Nginx ở cổng 80 trong
container. Có thể đặt trong `.env` trước khi chạy Compose, ví dụ:

```dotenv
WEB_PORT=8090
API_HOST_PORT=3001
```

Sau đó chạy lại `docker compose up --build -d` và mở
`http://127.0.0.1:8090`. `API_HOST_PORT` chỉ dành cho việc truy cập API từ
host; trình duyệt vẫn dùng web port và đường dẫn `/api`. Nếu cổng bận, đổi
`WEB_PORT` (hoặc `API_HOST_PORT`) sang cổng chưa dùng.

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

[Kiểm kê minh chứng BT2](docs/evidence/bt2/evidence-audit.md) · [Bug Log](docs/bug-log.md) · [Khai báo AI](docs/ai-disclosure.md).

Báo cáo chuẩn bị: PDF BT2 `docs/BT2_237480201IS04_VONGTHIRATH_SITHIPHAK.pdf` (không có trong checkout hiện tại, chưa cung cấp link công khai), nguồn HTML báo cáo `docs/BT2_237480201IS04_VONGTHIRATH_SITHIPHAK.html` (không có trong checkout), [ảnh chạy thật](docs/evidence/bt2/). Muốn xuất lại sau khi sửa HTML, cần Chrome và công cụ tạm (không phải dependency của ứng dụng):

```powershell
npm.cmd install --prefix .tmp/tools --no-package-lock --no-save playwright
node scripts/export-bt2.cjs
```

`node scripts/capture-bt2.cjs` chụp lại luồng trên SQLite tạm, dùng cổng 3102/5175; không thay CSDL demo hiện có. Sau khi chụp lại, xuất PDF lần nữa.

Script capture trên là công cụ lịch sử, chạy tập con 17 test và ghi ảnh/tệp cũ. Không dùng output đó để xác nhận 20 test. Báo cáo hiện dùng `latest-tests.png` và `latest-test-output.txt` từ lệnh đầy đủ `npm.cmd test`; ảnh luồng Docker lấy từ thư mục runtime riêng.

Ghi chú nộp BT2 lịch sử: kiểm tra PDF, bìa, minh chứng và nguồn trước khi nộp. Tag `v0.2` hiện là mốc lưu trữ BT2; không di chuyển hoặc tạo lại tag này trong Buổi 15–16. Không coi bản nháp hay tag cục bộ là bằng chứng đã nộp E-learning.

Mã lớp: **261_71ITGR40203_03**, MSSV: **237480201IS04**. Repository hiện tại: [cdtn1-vongthirathsithiphak-l8](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8). Ba commit bug Buổi 14 đã có; tag local `v0.2` được giữ nguyên. Những nhận định thiếu URL/tag/commit trong [kiểm kê BT2](docs/evidence/bt2/evidence-audit.md) là lịch sử. Xác nhận nộp E-learning và sinh viên tự kiểm khai báo AI vẫn cần bằng chứng riêng.

Checklist BT2 lịch sử: [kiểm kê BT2](docs/evidence/bt2/evidence-audit.md). [clone-and-run-v0.2.md](docs/clone-and-run-v0.2.md) là bản hướng dẫn BT2 cũ, còn URL lịch sử; không dùng cho C1 BT3. Dùng [Deployment Guide hiện tại](docs/deployment-guide.md) và [báo cáo Buổi 16](docs/testing/buoi16-deployment-report.md). SQLite tiếp tục là database của implementation này; không tự thay bằng PostgreSQL.

## 9. Buổi 14 – Workshop kiểm thử hệ thống SmartCRM L8

VONGTHIRATH SITHIPHAK · MSSV 237480201IS04 · Track SE · Luồng L8.
Nội dung tổng hợp từ hồ sơ kiểm thử ngày **06/11/2026**, đối chiếu PDF Buổi 13 và Buổi 14. Đã bổ sung và chạy lại HTTP validation cùng full suite; bằng chứng mới lưu riêng, giữ nguyên các lần chạy cũ. Build/CI được phân biệt với kết quả lịch sử.

**Trạng thái:** ba bug đã sửa, commit riêng và push lên repo PUBLIC; 12 ảnh TC cùng BUG-14-03-fixed có thật; suite 40/40 PASS, build thành công, Actions success. **Chưa hoàn tất đối chiếu phản hồi BT2/Acceptance Criteria gốc vì chưa được cung cấp**, không tự tạo phản hồi giảng viên.

### 9.1. Mục tiêu và phạm vi kiểm thử

Kiểm chứng hệ thống khảo sát CSAT/NPS sau hỗ trợ: quản lý mẫu → mời khách sau khi yêu cầu hoàn tất → phản hồi qua token → tổng hợp báo cáo. Nguồn truy vết: SRS US1–5/7, ngoại lệ use case trả lời khảo sát, API contract, quy tắc trong README và bug log BT2.

Các chức năng/quy tắc được kiểm trong bộ mới và bộ cũ:

- Mẫu hợp lệ, chuẩn hóa tên, kiểm trường bắt buộc; mẫu đã dùng không sửa/xóa.
- Chỉ mời yêu cầu `COMPLETED`, đúng khách hàng, có liên hệ, không opt-out; mỗi yêu cầu một lời mời.
- Token riêng, dùng một lần, hạn 14 ngày; chặn token sai, đúng thời điểm hết hạn và trả lời lần hai.
- CSAT là số nguyên 1–5, NPS 0–10; kiểm sai kiểu, ngoài miền, nhận xét 500/501 ký tự. CSAT tiêu cực ≤2, NPS tiêu cực ≤6.
- Lưu phản hồi, trạng thái `ANSWERED` và log trong transaction; thao tác thất bại không thêm dữ liệu.
- CSAT% dùng điểm 4–5 trên tổng phản hồi CSAT; NPS dùng tỷ lệ điểm 9–10 trừ tỷ lệ điểm 0–6, không trộn mẫu số; kiểm tổng số và số tiêu cực.
- Migration/seed lặp không nhân đôi; CRUD lời mời, xác thực HTTP và lỗi trong bộ cũ; hồi quy ID=0 và UTF-8 bị chia chunk trong bộ mới.

**Chủ ý không kiểm:** EMAIL/SMS thật, scheduler, nhắc lại, phân quyền trung tâm, xuất file, workflow xử lý tiêu cực vì chưa hiện thực; acceptance bởi người dùng, tải đồng thời, penetration test, đa trình duyệt, Docker runtime/máy trắng mới. Evidence Docker BT2 ở phần trước là lịch sử riêng.

SRS hiện có US và ngoại lệ, chưa có bảng AC Given–When–Then BT1 gốc hoặc phản hồi cá nhân BT2 đầy đủ; chưa xác nhận bao phủ toàn bộ những tài liệu chưa được cung cấp.

### 9.2. Test Plan — bốn mục

1. **Phạm vi và phần không kiểm:** luồng CSAT/NPS, ngoại lệ, validation, token, SQLite, tổng hợp và tái lập như mục 9.1; giữ các giới hạn kiểm thử đã công bố.
2. **Loại test và phân bố:** Nền ban đầu: **7 unit (TC-01–07), 3 integration (TC-08–10), 2 system/API (TC-11–12)**; giữ nguyên 12 test này và bổ sung 2 test HTTP cho TC-04/05. Vì vậy hai mã TC này có kiểm ở cả unit và HTTP. Tổng test tự động phục vụ 12 mã TC là **14 = 7 unit + 3 integration + 4 HTTP/API**. Unit tách CSDL/mạng, dùng repo giả và đồng hồ tiêm; integration dùng SQLite và thành phần thật; API chạy HTTP server thật. Phân vùng tương đương theo điểm hợp lệ/ngoài miền/sai kiểu, tên hợp lệ/rỗng, yêu cầu COMPLETED/OPEN, token hợp lệ/sai/đã dùng. Phân tích giá trị biên: CSAT=1 và CSAT=0 ở hai bên ngưỡng dưới 1; đúng thời điểm token hết hạn. Đủ năm loại: luồng đúng, biên, dữ liệu sai, bảo mật/chất lượng dữ liệu, tái lập.
3. **Tiêu chí thành công đo được:** giá trị/error và tác dụng phụ phải khớp hoàn toàn. TC-11: 404 NOT_FOUND, mẫu 1→1; TC-12: 201, response và SQLite giữ đúng tiếng Việt, mẫu 1→2. TC-08 không thêm lời mời/log; TC-10 chỉ một phản hồi, ANSWERED, log 2→3, CSAT=100; TC-09 hai lần cùng [4,4,1,0,0,0]. TC-07 phải CSAT=50, NPS=0, tổng=5, tiêu cực=2. Yêu cầu 12 ca mới và 20 ca cũ PASS, build và diff check exit 0. Thời lượng thật có trong raw; không suy ra đạt NFR 95% API <500ms từ thời gian test.
4. **Môi trường và dữ liệu:** Windows/PowerShell, Node v24.22.1, npm 11.19.1, React/Vite, Node HTTP thuần, `node:test`, `node:sqlite`. Mỗi ca dựng SQLite `:memory:` mới; TC-09 dùng thư mục tạm mới, migrate/seed hai lần rồi dọn. Dữ liệu synthetic: YC-001 COMPLETED, YC-002 OPEN, khách `test@example.invalid`; đồng hồ `2026-11-06T00:00:00.000Z`. HTTP dùng cổng 0, mật khẩu/phiên trong RAM; không đọc `.env` hoặc database ứng dụng. Từng ca chạy lại độc lập, không dựa vào dữ liệu còn sót.

Chi tiết: [Test Plan Buổi 14](docs/testing/buoi14-test-plan.md).

### 9.3. Test Report — 12 test case, đủ tám cột

Kết quả đã ghi nhận:

| Lần kiểm thử | PASS | FAIL | NOT RUN | Bằng chứng |
|---|---|---|---|---|
| Bộ cũ trước bổ sung | 20 | 0 | 0 | [Baseline](docs/testing/evidence/baseline-tests.txt) |
| 12 ca mới trước sửa | 10 | 2 | 0 | [FAIL-before](docs/testing/evidence/before-fixes.txt) |
| 12 ca mới sau sửa | 12 | 0 | 0 | [PASS-after](docs/testing/evidence/after-fixes.txt), [mã thoát từng ca](docs/testing/evidence/test-cases/cases.json) |
| Full suite hiện tại sau cả ba bug | 40 | 0 | 0 | [Full suite](docs/testing/evidence/bug14-03-fix-20261106T175309250796Z/full-suite.txt) |

12 mã TC tương ứng 14 test tự động vì TC-04/05 có cả unit và HTTP; các test bổ sung và regression đưa toàn suite hiện tại lên 40 test. Evidence được gọn lại: [12 kết quả đúng lần chụp ảnh](docs/testing/evidence/test-cases/cases.json), [trước/sau BUG-14-03 và suite/build mới nhất](docs/testing/evidence/bug14-03-fix-20261106T175309250796Z/), [kiểm tra chuyên sâu](docs/testing/evidence/deep-review-20261106T174341298331Z/deep-cases-public.txt). Chỉ loại các lần chạy lặp và metadata thừa; nội dung raw được giữ không bị sửa.

Bảng dưới lấy từ [Test Report chi tiết](docs/testing/buoi14-test-report.md), chuyển đường dẫn evidence để dùng từ README gốc. **F** = SQLite memory mới, 1 mẫu, 1 khách synthetic, YC-001 COMPLETED và YC-002 OPEN, đồng hồ cố định như mục 9.2. TC-04/05 giữ unit cũ và có HTTP bổ sung thật; các unit thuần không thực thi HTTP/SQLite, không gán status giả.

**Screenshot TC-01.png đến TC-12.png: ĐÃ CÓ VÀ ĐÃ KIỂM TRA 12/12 vào 07/11/2026.** Đã mở từng PNG, đúng lệnh/mã TC và PASS; TC-04/05 thấy HTTP 400 và SQLite không đổi, TC-11 thấy 404, TC-12 thấy 201 và tên tiếng Việt đúng. Từng dòng dưới có link ảnh và raw của chính lần chụp; giữ nguyên ảnh gốc. [Kiểm kê ảnh, kích thước và SHA-256](docs/testing/evidence/screenshot-review-20261106T172858877593Z/screenshots.json).

| Mã | Tiền điều kiện | Các bước | Dữ liệu thử | Kết quả mong đợi | Mức ưu tiên | Kết quả thực tế | PASS/FAIL |
|---|---|---|---|---|---|---|---|
| TC-01 · Unit · đúng · US1 | Validator độc lập | 1. Gọi templateInput; 2. So toàn bộ object | name=`  Mẫu CSAT  `; type=CSAT; question=`Bạn hài lòng thế nào?`; allowComment=true | Tên trim thành `Mẫu CSAT`, giữ đúng các trường | Cao | Object khớp; HTTP/DB không áp dụng. [Raw](docs/testing/evidence/test-cases/TC-01.txt) [Ảnh](docs/screenshots/TC-01.png) | PASS |
| TC-02 · Unit · biên · US3 | Template CSAT, allow_comment=1 | 1. Gọi responseInput; 2. So score/comment | score=1 | Nhận `{score:1,comment:null}` | Cao | Nhận đúng 1/null; HTTP/DB không áp dụng. [Raw](docs/testing/evidence/test-cases/TC-02.txt) [Ảnh](docs/screenshots/TC-02.png) | PASS |
| TC-03 · Unit · biên đối ứng · US3 | Như TC-02 | 1. Gọi responseInput; 2. Kiểm code và field | score=0 | VALIDATION_ERROR, fields.score có thông báo | Cao | VALIDATION_ERROR; score=`Điểm phải từ 1 đến 5`; HTTP/DB không áp dụng. [Raw](docs/testing/evidence/test-cases/TC-03.txt) [Ảnh](docs/screenshots/TC-03.png) | PASS |
| TC-04 · Unit + HTTP bổ sung · sai kiểu · ngoại lệ UC | Validator cũ và F mới; một lời mời SENT; HTTP server thật | 1. Giữ kiểm validator; 2. POST /api/public/surveys/:token/responses; 3. So status/body, đếm DB và trạng thái | score=`"5"` | HTTP 400; VALIDATION_ERROR; message và fields.score=`Điểm phải từ 1 đến 5`; không ghi dữ liệu, vẫn SENT | Cao | Unit PASS; HTTP 400, body khớp chính xác; [mẫu,mời,response,log]=[1,1,0,1]→[1,1,0,1]; SENT→SENT. [Raw](docs/testing/evidence/test-cases/TC-04.txt) [Ảnh](docs/screenshots/TC-04.png) | PASS |
| TC-05 · Unit + HTTP bổ sung · tên rỗng · US1 | Validator cũ và F mới; HTTP server thật; đăng nhập demo | 1. Giữ kiểm validator; 2. POST /api/survey-templates; 3. So status/body và SQLite | name=`""`; type=CSAT; question=`Bạn hài lòng thế nào?`; allowComment=true | HTTP 400; VALIDATION_ERROR; message và fields.name=`Tên mẫu phải từ 3–100 ký tự`; DB không đổi | Cao | Unit PASS; HTTP 400, body khớp chính xác; [1,0,0,0]→[1,0,0,0]; không có mẫu tên rỗng. [Raw](docs/testing/evidence/test-cases/TC-05.txt) [Ảnh](docs/screenshots/TC-05.png) | PASS |
| TC-06 · Unit · biên hết hạn · ngoại lệ UC | Repo giả trả SENT; đồng hồ tiêm | 1. Đặt now=expires_at; 2. publicSurvey | now=expires_at=`2026-11-06T00:00:00.000Z`; token synthetic 32 chữ a | EXPIRED tại đúng hạn | Cao | EXPIRED; HTTP/DB không áp dụng. [Raw](docs/testing/evidence/test-cases/TC-06.txt) [Ảnh](docs/screenshots/TC-06.png) | PASS |
| TC-07 · Unit · đúng tổng hợp · US4/5 | Repo giả 5 phản hồi, 5 lời mời | 1. summary; 2. So các chỉ số tính tay | CSAT=[4,2]; NPS=[9,6,8]; 2 tiêu cực | CSAT=50; NPS=0; count=5; negative=2 | Cao | Đúng 50/0/5/2; HTTP/DB không áp dụng. [Raw](docs/testing/evidence/test-cases/TC-07.txt) [Ảnh](docs/screenshots/TC-07.png) | PASS |
| TC-08 · Integration · ngoại lệ · US2 | F mới; YC-002 OPEN | 1. Đếm bảng; 2. invite YC-002; 3. Đếm lại | customerId=1; templateId=1; channel=EMAIL | REQUEST_NOT_COMPLETED; mọi số đếm giữ nguyên | Cao | Code đúng; [mẫu,mời,response,log]=[1,0,0,0]→[1,0,0,0]; HTTP không áp dụng. [Raw](docs/testing/evidence/test-cases/TC-08.txt) [Ảnh](docs/screenshots/TC-08.png) | PASS |
| TC-09 · Integration · tái lập · đóng gói | Thư mục SQLite tạm mới | 1. Chạy migrate+seed; 2. Đếm; 3. Lặp; 4. So đếm | DB_PATH riêng, seed demo của scripts/seed.js | Hai lần exit 0; [customer,request,template,invitation,response,log]=[4,4,1,0,0,0] | Cao | Hai lần cùng [4,4,1,0,0,0], không nhân đôi; HTTP không áp dụng. [Raw](docs/testing/evidence/test-cases/TC-09.txt) [Ảnh](docs/screenshots/TC-09.png) | PASS |
| TC-10 · Integration · đúng + bảo mật · US2/3/4 | F mới; đổi YC-002 thành COMPLETED | 1. Mời 2 yêu cầu; 2. Gửi token sai; 3. Trả lời token đầu; 4. Gửi lần hai; 5. Đếm và summary | EMAIL, CSAT=5; token sai=`invalid`; lần hai score=4 | Hai token hex32 khác nhau; NOT_FOUND không ghi; một response; lần hai ALREADY_ANSWERED; ANSWERED; CSAT=100 | Cao | Token khác; lỗi đúng; trước [1,2,0,2], sau [1,2,1,3]; ANSWERED; CSAT=100; HTTP không áp dụng. [Raw](docs/testing/evidence/test-cases/TC-10.txt) [Ảnh](docs/screenshots/TC-10.png) | PASS |
| TC-11 · System/API · sai ID + hồi quy BUG-14-01 · US1 | F + server thật + đăng nhập demo phiên RAM | 1. Login; 2. PUT /api/survey-templates/0; 3. So status/error/DB | name=`Unexpected create`, type=CSAT, question như TC-01 | Login 200; PUT 404 NOT_FOUND, không tạo mẫu | Cao | Trước sửa 200, mẫu 1→2 (FAIL). Sau sửa 404, message=`Không tìm thấy dữ liệu`, fields={}, mẫu 1→1; các bảng khác 0→0. [Raw](docs/testing/evidence/test-cases/TC-11.txt) [Ảnh](docs/screenshots/TC-11.png) | PASS |
| TC-12 · System/API · chất lượng dữ liệu + hồi quy BUG-14-02 · US1 | F + HTTP thật, phiên RAM | 1. Login; 2. POST /api/survey-templates bằng 2 chunk chia giữa byte chữ ẫ, cách 40ms; 3. So response và SQLite | name=`Mẫu tiếng Việt`, type=CSAT, question như TC-01; raw Buffer UTF-8 | 201; response.name và DB name đúng nguyên văn; mẫu 1→2 | Cao | Trước sửa 201 nhưng tên `M���u tiếng Việt` (FAIL). Sau sửa 201, response và DB đều `Mẫu tiếng Việt`; mẫu 1→2, mời/response/log giữ 0. [Raw](docs/testing/evidence/test-cases/TC-12.txt) [Ảnh](docs/screenshots/TC-12.png) | PASS |

Cột PASS/FAIL là trạng thái sau sửa. TC-11 và TC-12 trước sửa vẫn giữ FAIL trong evidence gốc. Thời lượng từng ca có trong raw output, không phải latency API.

### 9.4. Bug Log — hai bug thật, mỗi bug bảy dòng

Hai lỗi có bằng chứng tái lập trước sửa và chạy lại sau sửa. BUG-01–06 của BT2 là lịch sử, không đếm thành bug mới. Mức Critical dùng rubric Buổi 13 trang 21–22 về dữ liệu bị sai.

#### BUG-14-01

1. **Mã + severity:** BUG-14-01 · **Critical theo rubric Buổi 13 trang 21–22**: thao tác cập nhật một ID không tồn tại lại tạo dữ liệu ngoài ý muốn trong SQLite; rubric xếp dữ liệu bị sai vào Critical, không yêu cầu mất toàn bộ dữ liệu.
2. **Phát hiện bởi:** rà soát nhánh `if(id)` trong SurveyService và chạy TC-11 ngày 06/11/2026.
3. **Triệu chứng:** HTTP PUT `/api/survey-templates/0` trả 200 và tạo mẫu id=2, số mẫu 1→2; đúng ra phải 404 và không ghi.
4. **Tái lập:** F mới, đăng nhập; PUT endpoint trên với `{name:"Unexpected create",type:"CSAT",question:"Bạn hài lòng thế nào?",allowComment:true}`. Chạy `node scripts/test-buoi14.js TC-11`; kết quả mã gốc nằm trong before-fixes.txt, không khôi phục bug để tạo ảnh.
5. **Nguyên nhân:** `saveTemplate` kiểm truthiness của id; số 0 bị coi là không truyền ID nên bỏ kiểm tồn tại, repository đi nhánh INSERT.
6. **Cách sửa:** kiểm `id !== undefined` trong service; ID 0 được kiểm tồn tại trước khi repository ghi. Regression riêng: `tests/buoi14-bug01.test.js` kiểm status 404, error NOT_FOUND và toàn bộ số đếm không đổi.
7. **Commit + xác nhận:** [29b5658](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/29b56582cf6facb06a706c1ab34cfdf6a4a512df) — đã push và xác minh công khai: HTTP 200, không đăng nhập. [Raw](docs/testing/evidence/test-cases/TC-11.txt), [ảnh TC-11](docs/screenshots/TC-11.png) chứng minh PASS; cây commit thực tế 31/31 PASS ([log](docs/testing/evidence/publish-20261106T182108181513Z/bug14-01.txt)). Commit chỉ chứa source của bug, regression và ảnh/raw tương ứng.

#### BUG-14-02

1. **Mã + severity:** BUG-14-02 · **Critical theo rubric Buổi 13 trang 21–22**: đầu vào tiếng Việt hợp lệ bị thay đổi và lưu sai vào database; rubric xếp dữ liệu bị sai vào Critical. Đã chứng minh lỗi toàn vẹn dữ liệu, không tuyên bố có lộ dữ liệu hoặc sập hệ thống.
2. **Phát hiện bởi:** rà soát `text += chunk` trong HTTP body parser và chạy TC-12 ngày 06/11/2026.
3. **Triệu chứng:** POST mẫu trả 201 nhưng `Mẫu tiếng Việt` thành `M���u tiếng Việt` trong response và SQLite khi chữ ẫ bị chia giữa các chunk.
4. **Tái lập:** F mới và phiên demo; tạo Buffer JSON của payload TC-12; chia sau byte đầu của chữ ẫ, gửi chunk đầu rồi phần còn lại sau 40ms bằng node:http. Chạy `node scripts/test-buoi14.js TC-12`; raw trước sửa ghi cả inputName, response và stored.
5. **Nguyên nhân:** nối Buffer vào string giải mã UTF-8 riêng từng chunk; chuỗi byte chưa đủ bị thay bằng U+FFFD trước khi JSON.parse. HTTP chunk không bảo đảm trùng biên ký tự Unicode.
6. **Cách sửa:** giữ Buffer chunks, đếm byte thật với giới hạn 16384 byte như cũ, concat rồi giải mã UTF-8 một lần. Regression riêng: `tests/buoi14-bug02.test.js`, kiểm 201, response.name và SQLite name bằng chính chuỗi đầu vào.
7. **Commit + xác nhận:** [559437d](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/559437df380649e3f99ead6dc542b59aa335c45d) — đã push và xác minh công khai: HTTP 200, không đăng nhập. [Raw](docs/testing/evidence/test-cases/TC-12.txt), [ảnh TC-12](docs/screenshots/TC-12.png) chứng minh PASS; cây commit thực tế 32/32 PASS ([log](docs/testing/evidence/publish-20261106T182108181513Z/bug14-02.txt)). Commit chỉ chứa source của bug, regression và ảnh/raw tương ứng.

**Lịch sử trước BUG-14-03:** khi đó chỉ có 2 bug được chứng minh. Lượt thăm dò mới đã kiểm body 16384/16385 byte, JSON lỗi/array/null, ghi khi chưa đăng nhập, request thiếu/sai khách/thiếu liên hệ và biên khóa tài khoản/phiên; cả 3 test thăm dò PASS, chưa phát hiện bug thứ ba. Không tạo bug thứ ba và không gọi cập nhật tài liệu là bug phần mềm. Hướng kiểm tra thêm: body đúng/vượt 16 KiB, cạnh tranh SQLite, biên lockout/session, Unicode tên mẫu; các phép kiểm vừa chạy có raw mới; cạnh tranh SQLite và Unicode tên mẫu vẫn là hướng kiểm tiếp, chưa phải lỗi đã xác nhận.

Chi tiết và link commit thật: [Bug Log Buổi 14](docs/testing/buoi14-bug-log.md). Cả ba bug đã được commit riêng, push và kiểm link công khai không đăng nhập; tag `v0.2` giữ nguyên.

#### BUG-14-03 — Major, FIXED, đã commit và push riêng

Hai POST tạo mẫu có tên `Nul\u0000A` và `Nul\u0000B` được validator hiện chấp nhận. Lần đầu trả 201; lần sau **500 INTERNAL_ERROR**, dù SQLite coi hai tên trùng theo `COLLATE NOCASE` và contract quy định **409 TEMPLATE_NAME_EXISTS** cho tên trùng. Đã tái lập 2/2 lần; bảng mẫu 2→2, nội dung DB không đổi sau lỗi. Nguyên nhân: service so chuỗi bằng JavaScript `toLowerCase()`, khác phép so của ràng buộc UNIQUE SQLite khi có NUL. Đây là lỗi xử lý xung đột tên, độc lập với lỗi chunk UTF-8.

**Đã sửa:** repository kiểm tên bằng `COLLATE NOCASE`, loại trừ chính ID khi cập nhật; service dùng phép kiểm này và giữ phép so Unicode cũ. Contract không cấm NUL nên expected **409 TEMPLATE_NAME_EXISTS** được giữ nguyên, không tự đổi thành 400. Không đổi CSAT/NPS, invitation, token hoặc schema. [Regression trước sửa](docs/testing/evidence/bug14-03-fix-20261106T175309250796Z/before.txt) FAIL `500 !== 409`; [sau sửa](docs/testing/evidence/bug14-03-fix-20261106T175309250796Z/after.txt) **3/3 PASS**, số mẫu vẫn 2→2 khi từ chối trùng. Kiểm thêm sửa chính ID (200), sửa ID khác thành tên trùng (409), Unicode trùng (409) và tên khác hợp lệ (201). [Cả ba regression](docs/testing/evidence/bug14-03-fix-20261106T175309250796Z/all-bug-regressions.txt) **5/5 PASS**; [full suite](docs/testing/evidence/bug14-03-fix-20261106T175309250796Z/full-suite.txt) **40/40 PASS**; [build](docs/testing/evidence/bug14-03-fix-20261106T175309250796Z/build-elevated.txt) exit 0. Các FAIL trước sửa được giữ nguyên. [Bug Log bảy dòng](docs/testing/buoi14-bug-log.md); đã mở [ảnh BUG-14-03-fixed](docs/screenshots/BUG-14-03-fixed.png), thấy 3/3 PASS; link commit thật ở Bug Log đã kiểm HTTP 200 không đăng nhập.

### 9.5. Hướng dẫn chạy kiểm thử

Chạy từ thư mục gốc repository trên Windows/PowerShell:

```powershell
node scripts/test-buoi14.js
npm.cmd test
npm.cmd run build
git diff --check
```

Nếu cần cài dependency đúng lockfile trước khi chạy: `npm.cmd ci`. Chạy riêng bằng `node scripts/test-buoi14.js TC-01` (đến `TC-12`); hai ca hồi quy là TC-11 và TC-12.

Runner dựng fixture mới từng ca, không đọc `.env` hoặc thay database ứng dụng; ghi evidence UTF-8 vào thư mục **mới** `docs/testing/evidence/run-<UTC>-<pid>/` mỗi lần chạy. Không ghi đè bất kỳ evidence cũ nào. TC-04/05 chạy cả unit lẫn HTTP bổ sung; `npm.cmd test` hiện chạy 40 test (37 test trước BUG-14-03 + 3 regression cho BUG-14-03), tất cả đã PASS sau sửa. Ảnh thật cần thấy lệnh, mã TC, diagnostics và kết quả; không hiển thị token/mật khẩu.

### 9.6. Kết quả và checklist Buổi 14

**Kết quả hiện tại sau sửa BUG-14-03:** [regression trước sửa](docs/testing/evidence/bug14-03-fix-20261106T175309250796Z/before.txt) FAIL thật; [regression sau sửa](docs/testing/evidence/bug14-03-fix-20261106T175309250796Z/after.txt) 3/3 PASS; [cả ba bug](docs/testing/evidence/bug14-03-fix-20261106T175309250796Z/all-bug-regressions.txt) 5/5 PASS; [full suite](docs/testing/evidence/bug14-03-fix-20261106T175309250796Z/full-suite.txt) 40/40 PASS. Build trong sandbox lỗi quyền đọc, [build ngoài sandbox](docs/testing/evidence/bug14-03-fix-20261106T175309250796Z/build-elevated.txt) thành công, exit 0. Không ghi đè evidence cũ. Các đoạn mang mốc 37/37 bên dưới là lịch sử.

| Yêu cầu | Kết quả |
|---|---|
| Đọc phản hồi BT2 và ghi quyết định | Đã ghi quyết định với nội dung có sẵn; chưa có phản hồi cá nhân gốc |
| Test Plan đủ bốn mục, có kỹ thuật chọn dữ liệu | Đạt |
| 10–12 ca, đủ tám cột và ưu tiên | Đạt: 12 mã TC; nền 7 unit / 3 integration / 2 API và 2 test HTTP bổ sung |
| Đủ năm loại test | Có kiểm chứng; hai tình huống sai đã kiểm HTTP 400, message, field và SQLite |
| Chạy thật, kết quả cụ thể và tái lập độc lập | Đạt theo raw output và mã thoát từng ca |
| Ảnh từng ca | Đã mở và đối chiếu 12/12 ảnh đúng TC, có lệnh và PASS; link ở bảng TC |
| ≥3 bug, ≥1 Critical/Major, mỗi bug bảy dòng | Đã sửa 3 bug và đủ bảy dòng, có Critical/Major; đã có commit riêng, link công khai HTTP 200 đã kiểm |
| Commit riêng, link mở được | Đã push ba commit bug riêng; API và trang commit đều HTTP 200 không đăng nhập |
| Toàn bộ suite PASS | Đạt local sau sửa: 40 PASS / 0 FAIL / 0 NOT RUN |
| CI Actions xanh (khuyến khích) | [Run 42271266689](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/actions/runs/42271266689) completed/success; npm ci/test/build đều success |

**Chưa thể tuyên bố hoàn thành Buổi 14:** cả ba bug đã sửa local, còn thiếu phản hồi cá nhân BT2/AC gốc để đối chiếu đầy đủ. Ảnh TC-11/TC-12 đã chứng minh hồi quy hai bug; ảnh BUG-14-03-fixed cũng đã có; chưa có ảnh riêng toàn bộ suite hoặc Actions. Chưa có bằng chứng tải, acceptance hoặc Docker/máy trắng mới trong lượt kiểm thử này; không xác nhận hoàn tất toàn bộ BT3.

Tài liệu và bằng chứng: [Test Plan](docs/testing/buoi14-test-plan.md) · [Test Report](docs/testing/buoi14-test-report.md) · [Bug Log](docs/testing/buoi14-bug-log.md) · [thư mục Evidence](docs/testing/evidence/) · [12 ảnh TC](docs/screenshots/). Nội dung tổng hợp và checklist Buổi 14 nằm ngay trong mục 9 của README này.

### 9.7. Các bước còn lại: ảnh thật, commit riêng và Actions

Đã có đủ 12 ảnh TC, không cần chụp lại chỉ để đổi tên hoặc thời gian chạy. Xem link từng ảnh ở bảng 9.3. TC-11/TC-12 cũng là ảnh kiểm chứng hai bug; hiện không có file hướng dẫn `docs/screenshots/README.md`, vì vậy tài liệu liên kết trực tiếp đến [thư mục ảnh](docs/screenshots/).

Đã thực hiện commit hạ tầng [fc83221](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/fc8322178e532e8f9e6362ae9dad5181c98fcc0c), BUG-14-01 [29b5658](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/29b56582cf6facb06a706c1ab34cfdf6a4a512df), BUG-14-02 [559437d](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/559437df380649e3f99ead6dc542b59aa335c45d), BUG-14-03 [4e95e3f](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/4e95e3f4ccbc2eb6f6ebf2acbd56c221d1d47d5d). Cây commit tương ứng đã test 30/30, 31/31, 32/32, 35/35 PASS. Hunk ID=0 và hunk kiểm tên trùng được stage tách riêng, cached diff đã kiểm trước từng commit. [Log kiểm chứng](docs/testing/evidence/publish-20261106T182108181513Z/); tài liệu/CI/minh chứng commit sau. [Commit mới nhất trên main](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commits/main). Chưa coi link đã xác minh trước khi push/GET không đăng nhập thành công; không thay tag v0.2.

Đã kiểm Actions thực tế cho commit tài liệu [8626c93](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/8626c9310240d79d968916f4670ba3bcb8350cec): [run 42271266689](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/actions/runs/42271266689) **completed/success**; job check và các bước npm ci, npm test, npm run build đều success. [Kết quả API thật](docs/testing/evidence/publish-20261106T182108181513Z/actions-verified.json). Không chỉ suy ra CI từ test local.

Tài liệu còn cần bạn bổ sung: phản hồi cá nhân BT2 nguyên văn và bảng Acceptance Criteria Given–When–Then BT1 gốc (kèm đặc tả/quy tắc liên quan nếu nằm ngoài SRS hiện tại). Không lấy ví dụ chung trong slide làm phản hồi riêng của dự án.

### 9.8. Xác minh công khai sau push

Repo [PUBLIC](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8) được GitHub API không đăng nhập xác nhận private=false. Đã kiểm **84 URL công khai**, gồm đích liên kết tài liệu/evidence, trang commit và thư mục ảnh: tất cả HTTP 200; các ảnh PNG tải công khai có SHA-256 khớp file local. Đây là kiểm tra HTTP không cookie/token đăng nhập, tương đương kiểm quyền truy cập khi đăng xuất; không tuyên bố đã thao tác GUI cửa sổ ẩn danh. [Kết quả từng URL](docs/testing/evidence/publish-20261106T182108181513Z/public-links.json).

Các link cần nộp: [nhật ký xử lý thiết kế/BT2](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/blob/main/docs/thay-doi-thiet-ke.md), [Test Plan](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/blob/main/docs/testing/buoi14-test-plan.md), [Test Report](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/blob/main/docs/testing/buoi14-test-report.md), [Bug Log](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/blob/main/docs/testing/buoi14-bug-log.md), [13 ảnh](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/tree/main/docs/screenshots), [commit mới nhất trên main](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commits/main). Nhật ký thiết kế **không thay thế phản hồi cá nhân BT2 gốc**; mục này còn chờ tài liệu thật. Tag v0.2 giữ nguyên. Raw log có token fixture được giữ local nguyên bản; bản công khai được gắn nhãn redaction, không sửa status hoặc kết quả test.
