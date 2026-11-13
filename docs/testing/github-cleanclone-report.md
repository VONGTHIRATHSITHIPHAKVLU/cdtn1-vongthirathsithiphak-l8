# Clean clone GitHub — SmartCRM L8, C1/C3/C8

Ngày 13/11/2026 (Asia/Bangkok); thư mục evidence dùng UTC `github-cleanclone-20261112T172747Z`.
Commit đã clone trực tiếp từ GitHub: `b6a66b5e4c26a1a7ed0b48a8666d0bb1d6dd03a4`.

**C1 PASS trong môi trường đã kiểm; C3 PASS; C8 PASS.** Đây là clone public thật, không phải bản copy source local. Các giới hạn bảo mật đã công bố vẫn giữ nguyên; kết quả không chứng nhận hoàn tất toàn bộ BT3.

## Môi trường và nguồn gốc

- Thư mục cha mới, ban đầu trống: `.tmp/github-cleanclone-20261112T172747Z/`.
- Clone: `smartcrm-l8-demo/` bên trong thư mục cha đó, có Git metadata/origin riêng. Nằm dưới workspace chỉ vì giới hạn quyền ghi; source/dependency/env/database không dùng chung dự án chính.
- `git rev-parse HEAD` đúng `b6a66b5...`; `git diff` không có thay đổi tracked. Không copy `.env`, node_modules, SQLite hoặc source local sang clone.
- Docker Desktop/Engine 29.9.2 đang chạy; Docker build cache hiện có được tái sử dụng. Không tuyên bố đây là máy vật lý mới hoặc kiểm không cache.
- Project `smartcrm-l8-demo` chưa có volume trước lần dựng. Đã dừng riêng project snapshot cũ để giải phóng 3000/8080, không xóa volume.
- `provenance.json`, `run.json` trong [evidence](evidence/github-cleanclone-20261112T172747Z/) ghi thông tin này. Field `snapshot` trong run.json chỉ dùng tương thích đường dẫn của verifier; loại nguồn được ghi rõ GitHub public clone.

## Hai lệnh setup thực tế

Terminal bắt đầu ở thư mục cha trống. Không chạy `cd` vào clone:

```powershell
git clone https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8.git smartcrm-l8-demo
node smartcrm-l8-demo/scripts/demo.js
```

**Đếm: clone = 1, launcher = 2.** Cả hai exit 0; log ở `01-git-clone.txt`, `02-launcher.txt`, mã thoát ở `01-status.json`, `02-status.json`. Log PowerShell có thể bọc stderr progress thành NativeCommandError dù process exit 0; đối chiếu exit code và container health, không coi chữ đó là lỗi clone.

Không copy env, nhập secret, cài npm host, migrate hoặc seed thủ công để khởi động. Launcher tự tạo mật khẩu demo riêng và chờ hai container healthy. Đọc credential riêng trong file và thao tác trình duyệt là bước kiểm giao diện; mật khẩu không được ghi vào evidence.

## Kết quả kiểm sau deployment

| Kiểm tra | Kết quả thực tế | File evidence |
|---|---|---|
| Build/up Docker | PASS, exit 0 | `02-launcher.txt`, `02-status.json` |
| API/frontend health | Cả hai healthy | `verified/containers.ndjson`, `verified/docker-healthy.txt` |
| Web/API health qua proxy | HTTP 200, `status=ok` | `verified/runtime-results.json` |
| Dữ liệu seed ban đầu | `[4,4,1,0,0,0]` | `verified/runtime-results.json` |
| Chrome login và mẫu CSAT | PASS | `verified/clean-web-demo.png` |
| Luồng khảo sát | Một response, CSAT 100 | `verified/runtime-results.json` |
| Migration/seed hai vòng | `[4,4,1,1,1,2]` không đổi | `verified/docker-seed-repeat.txt`, `verified/runtime-results.json` |
| Restart API | Counts và response giữ nguyên, đăng nhập lại thành công | `verified/runtime-results.json` |
| C3 toàn suite một lệnh | `npm.cmd test`: 44 PASS, 0 FAIL/SKIP | `npm-test.txt`, `test-status.json` |
| C3 chạy riêng một ca | `node scripts/test-buoi14.js TC-07`: PASS | `single-case.txt`, `test-status.json` |
| Privacy raw Docker logs | Không chứa password/token quan sát được hoặc comment synthetic | `verified/log-privacy.json`, `verified/docker-logs-safe.txt` |

`npm.cmd ci` được chạy sau khi hai lệnh setup đã hoàn tất, để cài host dependencies cho việc kiểm test, không phải điều kiện dựng Docker. Test suite chạy bằng Node host trong clone. Không tuyên bố suite chạy bên trong runtime image.

## Lỗi công cụ kiểm UI và cách giữ evidence

Attempt đầu kiểm Docker, web health và counts đều PASS, nhưng UI verifier FAIL: PowerShell đọc script UTF-8 như ANSI làm selector tiếng Việt bị mojibake. Source ứng dụng clone không thay đổi. Giữ nguyên script lỗi và `runtime-results.json`/`runtime-console.json` của lần đầu; không sửa FAIL thành PASS.

Tạo `verify-runtime-utf8.cjs` mới bằng Node đọc UTF-8 đúng, chạy lại trên cùng clone vào thư mục `verified/`. Database trước khi chạy lại vẫn chưa có invitation/response vì attempt đầu dừng ở bước login UI. Lượt đúng UTF-8 hoàn tất toàn vòng PASS. Chi tiết: `verifier-encoding-note.json`.

## Screenshot thật

- [Ứng dụng sau đăng nhập](evidence/github-cleanclone-20261112T172747Z/verified/clean-web-demo.png).
- [API health](evidence/github-cleanclone-20261112T172747Z/verified/clean-api-health.png).
- [Docker healthy](evidence/github-cleanclone-20261112T172747Z/verified/docker-healthy-raw-log-browser.png).
- [44 test PASS](evidence/github-cleanclone-20261112T172747Z/verified/tests-pass-raw-log-browser.png).

Đã mở xem cả bốn ảnh. Hai ảnh Docker/test là Chrome hiển thị raw stdout thật, không phải terminal hệ điều hành. `verified/npm-test.txt` là bản copy byte-for-byte của cùng lượt test ở thư mục evidence cha để trình duyệt mở; không tạo lượt test thứ hai hoặc kết quả mới.

Project clone được để chạy tại http://127.0.0.1:8080, volume riêng `smartcrm-l8-demo_sqlite_data`. Không xóa dữ liệu/volume, không đổi v0.2, không tạo v1.0. Báo cáo/evidence C1 mới hiện còn local; không tự commit/push thêm.
