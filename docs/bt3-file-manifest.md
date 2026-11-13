# Danh mục hồ sơ BT3 — SmartCRM L8

Rà local ngày 13/11/2026. Đây là danh mục source, tài liệu kỹ thuật và evidence của repository, không phải danh mục file báo cáo cá nhân bắt buộc hoặc xác nhận đã nộp bài. Không di chuyển/xóa bằng chứng cũ. Xem [readiness C1–C9](testing/bt3-readiness.md).

PDF BT3 và bảng AI Disclosure bốn cột do chủ dự án tự thực hiện riêng, ngoài repository. Không tạo PDF, Word, bản nháp báo cáo, file/bảng/thư mục AI Disclosure tại đây và không yêu cầu đưa chúng vào VS Code. Thiếu các file này trong repository không phải lỗi kỹ thuật cần khắc phục.

## Tài liệu chính

| File | Vai trò |
|---|---|
| [README.md](../README.md) | Entry point, kiến trúc, chạy local/Docker, liên kết hồ sơ |
| [Test Plan](testing/buoi14-test-plan.md) | Phạm vi, kỹ thuật, môi trường và tiêu chí kiểm |
| [Test Report](testing/buoi14-test-report.md) | 12 TC, tám cột, năm loại; giữ số liệu lịch sử |
| [Bug Log](testing/buoi14-bug-log.md) | Ba bug có severity, bảy mục và commit thật |
| [Deployment Guide](deployment-guide.md) | Tiếng Anh, đúng năm mục, hai lệnh setup |
| [Security Checklist](security-checklist.md) | Đúng bảy mục, trạng thái/evidence/giới hạn |
| [API contract](api-contract.md) | Toàn bộ 17 cặp method/path hiện thực, auth, payload và lỗi |
| [Buổi 16 snapshot report](testing/buoi16-deployment-report.md) | Thử local trước công bố, Nginx FAIL/fix/retest |
| [GitHub clean-clone report](testing/github-cleanclone-report.md) | C1/C3/C8 trên commit công khai b6a66b5 |
| [Readiness](testing/bt3-readiness.md) | Tình trạng từng C1–C9, giới hạn C7 và mức sẵn sàng repository |
| [SRS](srs.md), [nhật ký thiết kế](thay-doi-thiet-ke.md), [architecture.svg](export/architecture.svg) | Bối cảnh và giới hạn hệ thống thật |

## Ảnh và evidence kỹ thuật hiện có

- `docs/screenshots/TC-01.png` đến `TC-12.png`: 12 ảnh test gốc, không thay bằng ảnh suite 44 test. Link từng ảnh đã có trong Test Report.
- [BUG-14-03-fixed.png](screenshots/BUG-14-03-fixed.png): regression bug thứ ba.
- `docs/testing/evidence/test-cases/TC-01.txt` đến `TC-12.txt` và [cases.json](testing/evidence/test-cases/cases.json): raw khớp 12 ảnh.
- [before-fixes.txt](testing/evidence/before-fixes.txt), [after-fixes.txt](testing/evidence/after-fixes.txt); [BUG-14-03 before](testing/evidence/bug14-03-fix-20261106T175309250796Z/before.txt), [after](testing/evidence/bug14-03-fix-20261106T175309250796Z/after.txt): nguồn FAIL → PASS thật.
- `docs/testing/evidence/github-cleanclone-20261112T172747Z/`: `01-git-clone.txt`, `01-status.json`, `02-launcher.txt`, `02-status.json`, `provenance.json`, `npm-test.txt`, `single-case.txt`, `test-status.json`, `status.json`.
- Trong thư mục clean clone trên, `verified/`: `runtime-results.json`, `containers.ndjson`, `docker-seed-repeat.txt`, `log-privacy.json`, `docker-logs-safe.txt`, `screenshots.json` và bốn PNG web/health/Docker/test. Hai ảnh raw log là trình duyệt hiển thị stdout, không phải terminal OS.
- `docs/testing/evidence/security-20261112T165156Z/`: `secret-scan.json`, `secret-triage.json`, `npm-audit-online.json`, `npm-test.txt`, `build-status.json`, `verification.md`.
- `docs/testing/evidence/buoi16-20261112T165956Z/`: giữ kết quả lỗi Nginx synthetic-marker đã redaction, amendment và lần kiểm lại. Không lấy log FAIL trước sửa làm kết quả cuối.
- `docs/testing/evidence/bt3-readiness-20261112T173603Z/`: audit link/hash và secret scan local mới; đây không phải một lần chạy test mới.

Các file raw phục vụ truy vết kết quả trong repository; việc lựa chọn trích dẫn cho PDF riêng do chủ dự án quyết định. Không gán ảnh của lần chạy khác cho kết quả đang mô tả. Giữ cả attempt verifier lỗi UTF-8 và lượt sửa công cụ; không che kết quả thất bại.

## Source và cấu hình kèm repository

`src/`, `tests/`, `database/migrations/001.sql`, `scripts/migrate.js`, `scripts/seed.js`, `scripts/demo.js`, `scripts/demo-env.js`, `scripts/scan-secrets.js`, `scripts/test-buoi14.js`, `package.json`, `package-lock.json`, `vite.config.js`, `Dockerfile`, `compose.yaml`, `deploy/nginx.conf`, `.env.example`, `.dockerignore`, `.gitignore`, `.gitattributes`.

Repository và revision đã kiểm phải được nhận diện rõ; b6a66b5 là revision ứng dụng clean-clone đã xác minh, còn cập nhật tài liệu/evidence mới vẫn local.

## Loại trừ và phần chưa có

- Không đưa `.env`, credential thật, SQLite/database đang dùng, node_modules, dist, `.tmp`, cache hoặc browser profile vào hồ sơ công khai.
- Không chỉnh/xuất lại PDF BT2. Checkout hiện không có PDF BT2 để đưa vào danh mục này.
- PDF BT3, nguồn Word/HTML báo cáo và AI Disclosure riêng không phải file cần tạo/đưa vào repository theo phạm vi đã chốt. Chủ dự án tự xử lý ngoài repo; không đánh dấu readiness của repo BLOCKED chỉ vì không có các file này.
- `docs/ai-disclosure.md` và `docs/AI.md` đã có từ trước được giữ nguyên như tài liệu lịch sử; không yêu cầu tạo/cập nhật AI Disclosure BT3 trong repository.
- Chưa có phản hồi cá nhân BT2 và Acceptance Criteria BT1 Given–When–Then nguyên văn. Không tự tạo các tài liệu này.
- Không có tag v1.0; chờ bước phát hành được cho phép. Các thay đổi local hiện tại chưa phải hồ sơ đã công bố/nộp.
