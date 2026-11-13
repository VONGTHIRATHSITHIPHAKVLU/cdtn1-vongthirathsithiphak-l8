# Buổi 16 — kiểm chứng đóng gói SmartCRM L8

Cập nhật sau công bố: [clean clone GitHub commit b6a66b5 đã PASS C1/C3/C8](github-cleanclone-report.md).
Các nhận định public clone BLOCKED bên dưới là trạng thái lịch sử của lượt snapshot trước công bố, không phải trạng thái hiện tại.

Thời điểm: 12–13/11/2026 Asia/Bangkok; tên evidence dùng UTC, bắt đầu `20261112T165956Z`.
Nguồn: HEAD local `a85cd54502d6a026ff01e547c5af03d8de4addaa` **cộng các thay đổi chưa commit**. Không commit/push/tag.

Evidence gốc: [buoi16-20261112T165956Z](evidence/buoi16-20261112T165956Z/); kết quả gói cuối: [final](evidence/buoi16-20261112T165956Z/final/).

## Phạm vi và cách ly

- Mở Docker Desktop đã cài sẵn; Engine 29.9.2 hoạt động khi chạy ngoài sandbox. Không đổi ACL, context mặc định hoặc cấu hình hệ thống. Lỗi quyền đọc `.docker` trước đó là giới hạn sandbox; daemon ban đầu chưa chạy.
- Sao chép 299 file tracked/untracked không bị ignore vào snapshot độc lập. Không copy `.env`, SQLite, `.git`, node_modules hoặc dist; không dùng database/dependency của working directory chính.
- Snapshot nằm dưới `.tmp` của workspace vì giới hạn quyền ghi, nhưng có source, `.env` sinh mới, dependency, container/network và named volume riêng. Không coi đây là thư mục clone GitHub.
- Trial đầu: `.tmp/buoi16-20261112T165956Z-snapshot`; gói cuối sau sửa Nginx: `.tmp/buoi16-20261112T165956Z-final`.
- Project cuối: `buoi16-20261112t165956z-final`; volume SQLite tương ứng có hậu tố `_sqlite_data`. Không dùng volume dự án chính.
- `snapshot-manifest.json` lưu hash từng file. `snapshot-amendment.json` ghi thay đổi Nginx giữa trial đầu và bản cuối. Snapshot cuối được copy mới từ source đã sửa, không yêu cầu sửa tay sau khi dựng.

## Lệnh đã thực hiện

Từ thư mục dự án chính, khởi động bản cuối bằng **một lệnh launcher** sau bước chuẩn bị snapshot nội bộ:

```powershell
node .tmp/buoi16-20261112T165956Z-final/scripts/demo.js
```

Launcher tự chạy `docker compose up --build -d --wait --wait-timeout 180` tại snapshot. Dùng cổng mặc định 8080/3000; không cần copy env hoặc tự nhập mật khẩu. Điều này chỉ xác minh launcher trên snapshot local, không thay cho điều kiện clone public.

Các lệnh kiểm sau chạy với working directory là snapshot cuối (working directory được công cụ đặt trực tiếp, không tính là bước setup clean clone):

```powershell
npm.cmd ci
npm.cmd test
node scripts/test-buoi14.js TC-07
docker compose ps
docker compose exec -T api node scripts/migrate.js
docker compose exec -T api node scripts/seed.js
docker compose restart api
docker compose up -d --wait --wait-timeout 90
```

Migrate/seed được chạy hai vòng trong verifier; count SQL trước/sau được kiểm trực tiếp trong container. Lệnh verifier thực tế, chạy từ dự án chính:

```powershell
node docs/testing/evidence/buoi16-20261112T165956Z/verify-runtime.cjs docs/testing/evidence/buoi16-20261112T165956Z/final
```

Verifier là artifact của lần chạy này, cần Playwright tạm trong `.tmp/tools` và Chrome đã cài; không phải dependency hoặc lệnh bắt buộc của deployment. Không chạy lại trên cùng volume nếu muốn tái lập điều kiện database trống: lần chạy đã tạo response thử.

## Kết quả thực tế của gói cuối

| Kiểm tra | Kết quả | Evidence trong `final/` |
|---|---|---|
| Build/up bằng launcher | PASS, exit 0 | `local-snapshot-deploy.txt`, `deploy-status.json` |
| API và frontend healthcheck | Cả hai healthy | `containers.ndjson`, `docker-healthy.txt` |
| Web và `/api/health` qua Nginx | HTTP 200; health `status=ok` | `runtime-results.json`, `clean-api-health.png` |
| Chrome login, mẫu CSAT seed | PASS, thấy mẫu thật | `clean-web-demo.png` |
| Dữ liệu ban đầu | `[4,4,1,0,0,0]` | `runtime-results.json` |
| Luồng mời/trả lời/báo cáo | Một response, CSAT 100 | `runtime-results.json` |
| Migrate/seed hai vòng sau thao tác | Không đổi `[4,4,1,1,1,2]` | `docker-seed-repeat.txt`, `runtime-results.json` |
| Restart API | Response và counts giữ nguyên; đăng nhập lại thành công | `runtime-results.json` |
| Cài host dependency từ lockfile | PASS, exit 0 | `snapshot-npm-ci.txt`, `test-status.json` |
| Một lệnh toàn suite `npm.cmd test` | 44 PASS / 0 FAIL / 0 SKIP | `snapshot-npm-test.txt` |
| Một TC chạy riêng | TC-07 PASS, exit 0 | `snapshot-single-case.txt` |
| Raw Docker logs | Không có password/token được quan sát hoặc comment synthetic | `log-privacy.json`, `docker-logs-safe.txt` |

Test suite chạy bằng Node trên host trong snapshot với dependency cài riêng, không phải bên trong API runtime image. Không tuyên bố đã kiểm toàn suite trong container.

## Phát hiện và sửa lỗi log Nginx

Trial đầu healthy nhưng kiểm privacy FAIL: Nginx kế thừa default `main` access log đồng thời với safe JSON log, làm lộ **marker URL synthetic**, chưa dùng token thật cho probe này. Trước khi ghi evidence, marker được che và file được gắn tên `nginx-privacy-before-redacted.log`; JSON giữ kết quả FAIL thật.

Sửa `deploy/nginx.conf`: đặt `access_log ... crm_safe` trong `server` để thay log kế thừa. Kiểm sau sửa PASS; sau đó dựng snapshot cuối mới từ source đã sửa và volume trống, kiểm lại toàn vòng PASS. Không sửa log hoặc ảnh Buổi 14.

## Screenshot và nguồn gốc

- [Web demo](evidence/buoi16-20261112T165956Z/final/clean-web-demo.png): ảnh Chrome chụp ứng dụng thật sau đăng nhập.
- [API health](evidence/buoi16-20261112T165956Z/final/clean-api-health.png): ảnh response thật qua Nginx.
- [Docker healthy](evidence/buoi16-20261112T165956Z/final/docker-healthy-raw-log-browser.png): Chrome mở file stdout thật của `docker compose ps`.
- [44 test PASS](evidence/buoi16-20261112T165956Z/final/tests-pass-raw-log-browser.png): Chrome mở raw output thật của `npm.cmd test`, cuộn đến kết quả cuối.

Hai ảnh raw log **không phải ảnh terminal hệ điều hành**. Không dựng giao diện terminal, không tạo dòng lệnh/kết quả giả, không chỉnh nội dung log để chụp. Đã mở xem cả bốn ảnh. Không chụp `.env`, password, sessionStorage hoặc URL có token.

## C1, C3, C8 và phần còn chặn

| Tiêu chí | Kết luận |
|---|---|
| C1 | **LOCAL SNAPSHOT PASS; PUBLIC CLEAN CLONE BLOCKED**. GitHub main kiểm qua API vẫn là `a85cd54`, không có `scripts/demo.js`, guide hoặc checklist mới. Không thể chạy workflow mới từ bản clone công khai hiện tại; chưa đánh dấu C1 hoàn tất. |
| C3 | **PASS trên snapshot cuối**: suite một lệnh 44/44 và TC-07 chạy riêng. |
| C8 | **PASS trên snapshot Docker cuối**: migration/seed lặp không thêm dòng; dữ liệu giữ sau restart. |

Quy trình public đang chờ publication của revision phù hợp, không phải chờ sửa Docker:

```powershell
git clone https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8.git smartcrm-l8-demo
node smartcrm-l8-demo/scripts/demo.js
```

Đếm **hai lệnh**, bao gồm clone; không có `cd`. Các lệnh kiểm thử/diagnostic là kiểm sau deployment và được ghi riêng, không ẩn vào hai lệnh setup. Không tự commit/push để vượt điều kiện này.

Trial đầu đã được dừng bằng `docker compose down` **không `-v`**, volume được giữ. Project cuối được để chạy tại http://127.0.0.1:8080 để xem lại. Nếu cần giải phóng cổng, chạy `docker compose down` từ thư mục snapshot cuối; không dùng lệnh này tại dự án chính hoặc thêm `-v`. Docker Desktop cũng được để hoạt động. Không volume nào bị xóa.
