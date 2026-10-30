# Bug Log — Buổi 11–12, BT2

Ngày rà soát: 30/10/2026 (Asia/Bangkok). Mỗi mục dùng 7 dòng theo mẫu D1 của tài liệu tự học Buổi 11. Severity là đánh giá tác động trong demo.

**Chưa có commit sửa/link commit cho các thay đổi này.** Không coi là hoàn tất điều kiện link commit của BT3. BUG-01–03 là ghi nhận lịch sử: bằng chứng sau sửa không thay cho bằng chứng FAIL-before.

## BUG-01 · Major — Docker chưa phục vụ toàn bộ ứng dụng

| Dòng | Nội dung |
|---|---|
| 1. ID và mức độ | BUG-01 · Major |
| 2. Phát hiện bởi | Rà soát Dockerfile và bind address; ghi nhận bug log cũ ngày 30/10/2026. Chưa có artifact FAIL-before. |
| 3. Hiện tượng | Container cũ chỉ có API, không build/phục vụ React; bind loopback trong container. |
| 4. Tái lập | Với cấu hình cũ: chạy Docker và truy cập web từ host. Hiện đã sửa, không đổi ngược mã để tái lập. |
| 5. Nguyên nhân | Dùng cấu hình dev hai terminal để đóng gói, thiếu web server và bind phù hợp. |
| 6. Sửa | Dockerfile build React, Nginx proxy /api, API 0.0.0.0:3000, healthcheck và depends_on healthy. |
| 7. Commit và xác nhận | Chưa có commit/link. [Runtime results](evidence/bt2/smartcrm-bt2-runtime-1793303619791/results.json), [containers](evidence/bt2/smartcrm-bt2-runtime-1793303619791/final-containers.json), ảnh 01–09: luồng UI/API chạy thật. Chưa có test FAIL-before tự động. |

## BUG-02 · Major — Vite proxy không theo APP_PORT

| Dòng | Nội dung |
|---|---|
| 1. ID và mức độ | BUG-02 · Major |
| 2. Phát hiện bởi | Rà soát README/Vite; ghi nhận bug log cũ. Chưa lưu output lỗi trước sửa. |
| 3. Hiện tượng | Proxy cũ cố định 3000 dù backend đọc APP_PORT. |
| 4. Tái lập | Với cấu hình cũ: đổi APP_PORT khỏi 3000, chạy backend/Vite, gọi /api/health qua Vite. |
| 5. Nguyên nhân | Cổng khai báo hai nơi nhưng chỉ backend đọc môi trường. |
| 6. Sửa | vite.config.js dùng loadEnv; .env.example phân biệt APP_PORT local và API_HOST_PORT Docker. |
| 7. Commit và xác nhận | Chưa có commit/link. [Responsive after.json](evidence/bt2/templates-responsive/after.json) và ảnh ghi nhận CRUD qua Vite/API với cổng riêng 13183/15183. Không có test FAIL-before được lưu. |

## BUG-03 · Major — API thoát mã 0 trên Linux

| Dòng | Nội dung |
|---|---|
| 1. ID và mức độ | BUG-03 · Major |
| 2. Phát hiện bởi | Chạy Docker Linux, ghi nhận bug log cũ; không có log container lỗi gốc còn lưu. |
| 3. Hiện tượng | Image build được nhưng API exited (0), web không qua điều kiện healthy. |
| 4. Tái lập | Với entry point cũ ghép file:/// thủ công: docker compose up --build -d --wait trên Linux. |
| 5. Nguyên nhân | argv Linux đã có /; ghép URL thủ công khác import.meta.url, nhánh listen không chạy. |
| 6. Sửa | src/backend/server.js dùng pathToFileURL(process.argv[1]).href. |
| 7. Commit và xác nhận | Chưa có commit/link. [Container sau recreate](evidence/bt2/smartcrm-bt2-runtime-1793303619791/final-containers.json) có API healthy; [log](evidence/bt2/smartcrm-bt2-runtime-1793303619791/compose.log) có API started. Chưa có test riêng entry point Linux. |

## BUG-04 · Major — Lỗi 500 thiếu chẩn đoán và mã tra cứu UI

| Dòng | Nội dung |
|---|---|
| 1. ID và mức độ | BUG-04 · Major |
| 2. Phát hiện bởi | Rà soát server.js, logger.js, client.js và yêu cầu bổ sung logging. |
| 3. Hiện tượng | Log chỉ ghi INTERNAL_ERROR; frontend không hiển thị X-Request-Id. |
| 4. Tái lập | Tiêm repository ném Error có cause rồi gọi /api/health; test dùng fixture, không DB thật. |
| 5. Nguyên nhân | Logger chưa nhận chẩn đoán Error; error response/client chưa đưa requestId tới thông báo. |
| 6. Sửa | logger.js giữ type, mã hạ tầng allowlist, cause giới hạn và stack vị trí nguồn, bỏ raw message. server.js trả requestId an toàn; client.js hiển thị mã tra cứu. |
| 7. Commit và xác nhận | Chưa có commit/link. tests/errors.test.js kiểm log không chứa password/token/email; HTTP 500/503 có requestId khớp; UI client xử lý JSON/non-JSON 500. [Output 20 test](evidence/bt2/latest-test-output.txt). Chưa lưu FAIL-before. |

## BUG-05 · Minor — Templates tràn ngang ở mobile 375px

| Dòng | Nội dung |
|---|---|
| 1. ID và mức độ | BUG-05 · Minor |
| 2. Phát hiện bởi | Chrome headless trong Docker: [results](evidence/bt2/smartcrm-bt2-runtime-1793303619791/results.json), ảnh 11-mobile-templates.png. |
| 3. Hiện tượng | Viewport 375px, document 453px, tràn 78px trong Docker. Local seed khác đo 448px trước sửa. |
| 4. Tái lập | Mở Templates 375×812, đo documentElement.scrollWidth và vị trí .sr-only: [before.json](evidence/bt2/templates-responsive/before.json). |
| 5. Nguyên nhân | Nhãn absolute .sr-only không có containing block ở th, thoát vùng cuộn bảng và mở rộng document. |
| 6. Sửa | src/frontend/src/style.css: .templates-grid th{position:relative}. Không thêm overflow-x:hidden; bảng giữ cuộn ngang nội bộ. |
| 7. Commit và xác nhận | Chưa có commit/link. [after.json](evidence/bt2/templates-responsive/after.json): mobile 375/375, desktop 1440/1440; tạo/sửa/xóa PASS cả hai. Ảnh desktop kiểm soát trước/sau giống byte. Chưa rebuild/retest Docker sau sửa CSS; giữ nguyên FAIL lịch sử Docker. |

### Xác nhận bổ sung BUG-05

[smartcrm-bt2-runtime-1793305395728](evidence/bt2/smartcrm-bt2-runtime-1793305395728/responsive.json) đã rebuild Docker sau CSS: Templates và bốn màn hình khác đều không tràn ở hai kích thước. Giữ nguyên số đo FAIL trước sửa ở trên.

## BUG-06 · Major — Nginx ghi token khảo sát vào log mặc định

| Dòng | Nội dung |
|---|---|
| 1. ID và mức độ | BUG-06 · Major: token public survey có thể bị lộ qua log. |
| 2. Phát hiện bởi | Đọc deploy/nginx.conf và log Docker trước sửa; artifact cũ đã che token khi lưu nên không dùng nó để chứng minh raw log an toàn. |
| 3. Hiện tượng | Access log mặc định ghi request URL; lỗi upstream cũng có thể chứa URL khảo sát. |
| 4. Tái lập | Mở survey có token, dừng API rồi gọi lại qua Nginx; kiểm raw docker compose logs. Chỉ dùng token demo. |
| 5. Nguyên nhân | Nginx format mặc định chứa request và error log mức error chứa URL, dù backend đã che token. |
| 6. Sửa | deploy/nginx.conf: JSON access log không URI/query/header/IP; error_log crit. Giữ status/timing/requestId; backend giữ chẩn đoán ứng dụng đã lọc. |
| 7. Commit và xác nhận | Chưa commit/link. [smartcrm-bt2-runtime-1793305395728](evidence/bt2/smartcrm-bt2-runtime-1793305395728/results.json) mục safe raw API and Nginx logs kiểm trước redaction không chứa password/token khảo sát; API down/retry và mọi chức năng vẫn PASS. |
