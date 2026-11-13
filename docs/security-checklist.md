# Security Checklist — SmartCRM L8, Buổi 15

Lượt kiểm gốc ngày 12/11/2026 (Asia/Bangkok); code được công bố trong b6a66b5. Cập nhật hồ sơ local ngày 13/11/2026, không tạo kết quả test mới.
Evidence gốc: [security-20261112T165156Z](testing/evidence/security-20261112T165156Z/). Dẫn trực tiếp: [suite](testing/evidence/security-20261112T165156Z/npm-test.txt), [secret scan](testing/evidence/security-20261112T165156Z/secret-scan.json), [triage](testing/evidence/security-20261112T165156Z/secret-triage.json), [npm audit](testing/evidence/security-20261112T165156Z/npm-audit-online.json), [build](testing/evidence/security-20261112T165156Z/build-status.json). Evidence mới: [clean clone GitHub](testing/github-cleanclone-report.md), [log privacy](testing/evidence/github-cleanclone-20261112T172747Z/verified/log-privacy.json).
Trạng thái dưới đây có phạm vi và giới hạn; không phải chứng nhận an toàn production.

## 1. Không có secret trong repository

**Trạng thái: ĐÃ LÀM — C7 PASS trong phạm vi source/Git history đã kiểm, kết hợp xác nhận chủ dự án ngày 13/11/2026; không bảo đảm an toàn tuyệt đối.**

- File: `.gitignore`, `.dockerignore`, `.env.example`, `scripts/demo-env.js`, `scripts/scan-secrets.js`.
- Cách kiểm: `node scripts/scan-secrets.js`. Script chỉ xuất vị trí, rule và object ID; không xuất giá trị. Quét source/tài liệu/evidence hiện tại, gồm untracked, và toàn bộ blob/commit/tag reachable từ các ref Git local; hỗ trợ UTF-8 và log UTF-16LE có BOM.
- Bằng chứng kỹ thuật: `secret-scan.json`, `secret-triage.json` trong thư mục evidence; lượt rà sau phân loại 48 lượt khớp thành 26 fixture test, 20 placeholder token đã redaction và hai lượt cùng credential capture tại `scripts/capture-bt2.cjs:11`. Không có credential production bị lộ được xác nhận trong phạm vi kiểm. Giữ nguyên raw scan/triage cũ, không sửa chúng thành một kết quả kiểm mới.
- Xác nhận sử dụng ngoài repo: chủ dự án xác nhận trực tiếp trong hội thoại ngày 13/11/2026 rằng capture credential chỉ dùng demo/capture local, test fixtures chỉ dùng automated tests; chưa từng dùng cho production, deployment public, tài khoản thật hoặc môi trường có dữ liệu thật, không có credential production liên quan cần rotate. Scanner không tự chứng minh thông tin này. Đã ghi nhận trong [readiness, phần C7](testing/bt3-readiness.md).
- Lịch sử đường dẫn `.env*` local chỉ thấy `.env.example`; không thấy `.env` đã commit trong các ref đã quét. Mật khẩu demo mới được sinh ngẫu nhiên trong `.env` ignored; không thấy giá trị này trong nội dung được quét.
- Giới hạn: heuristic không bảo đảm tìm mọi secret; không OCR ảnh/PDF, không quét binary, dependency/build/cache/temp, dangling objects, ref chưa có local hoặc secret bên ngoài repo. Không đưa `.env` provisioning vào source scan, nhưng dùng giá trị hiện tại để dò rò rỉ sang source/history. Kết luận PASS dựa trên phạm vi này và xác nhận chủ dự án, không phải chứng nhận toàn bộ hệ thống hoặc mọi lịch sử sử dụng ngoài repo. Không tái sử dụng fixture công khai cho môi trường thật; đánh giá lại/rotate nếu có thông tin mới về việc sử dụng thật. Không rewrite Git history hoặc sửa evidence cũ.

## 2. Validation dữ liệu đầu vào

**Trạng thái: ĐÃ LÀM.**

- File: `src/backend/validators/survey.js`, `src/backend/services/survey.service.js`, `src/backend/repositories/survey.repository.js`, `src/backend/server.js`.
- Cách kiểm: `npm.cmd test`; xem TC-04/05, EXP-01/02 và các test nghiệp vụ. HTTP kiểm JSON object, giới hạn body 16 KiB; validator kiểm kiểu/độ dài/miền điểm. Service kiểm yêu cầu, khách, opt-out, thời hạn; SQL dùng bound parameters cho dữ liệu đầu vào.
- Bằng chứng: `npm-test.txt` của lượt bảo mật ghi toàn suite PASS, có các test validation và rollback/không ghi khi sai. Đây không phải penetration test hoặc bằng chứng chống mọi loại injection.

## 3. Kiểm soát truy cập theo chủ sở hữu

**Trạng thái: CHƯA LÀM đầy đủ; đã kiểm xác thực và ràng buộc token hiện có.**

- File: `docs/srs.md` phần actor, `src/backend/routes/api.js`, `src/backend/services/survey.service.js`, `tests/security.test.js`.
- Thiết kế hiện tại xác nhận một tài khoản Quản lý demo; chưa có danh sách user/center hoặc quy tắc owner của mẫu/lời mời. Không tự biến `created_by` thành quy tắc chỉ chủ sở hữu được sửa, vì chưa có yêu cầu đó.
- Cải thiện: session có identity manager demo `userId=1`; các thao tác ghi lấy actor từ session, bỏ literal actor tại từng route. Payload không thể tự nâng actor/role. ID 1 vẫn là danh tính demo duy nhất, không phải phân quyền nhiều người.
- Cách kiểm: `node --test tests/security.test.js` hoặc toàn suite. Kiểm token giả/sai header/logout bị từ chối, payload giả actor bị bỏ qua. Các test Buổi 14 kiểm token khảo sát chỉ truy cập lời mời tương ứng và không trả lời hai lần.
- Bằng chứng: `npm-test.txt`; test "session identity controls audit actor..." PASS. Chưa có kiểm owner/center giữa hai manager vì không có hai identity và chính sách hợp lệ trong thiết kế. Không đánh dấu mục này KHÔNG ÁP DỤNG để bỏ qua thiếu sót.

## 4. Bảo vệ mật khẩu và dữ liệu nhạy cảm

**Trạng thái: CHƯA LÀM đầy đủ; đã cải thiện verifier và lưu phiên.**

- File: `src/backend/auth.js`, `src/backend/routes/api.js`, `scripts/demo-env.js`, `deploy/nginx.conf`, `src/backend/server.js`, `tests/security.test.js`.
- Router tạo verifier scrypt với salt ngẫu nhiên, so digest constant-time; không giữ plaintext làm giá trị so sánh trong router. Đây là verifier RAM dùng tham số mặc định Node, không phải user database/password policy production. `.env` và biến môi trường vẫn chứa mật khẩu provisioning nguyên văn.
- Session token sinh từ 32 byte ngẫu nhiên, map RAM chỉ dùng SHA-256 của token làm khóa; hết hạn một giờ/logout thu hồi. Client vẫn giữ token trong sessionStorage, có rủi ro XSS. Header yêu cầu dạng `Bearer <hex64>`.
- Token khảo sát vẫn lưu nguyên văn trong SQLite để giữ contract/link cũ; customer/comment cũng chưa mã hoá at rest. HTTP local chưa có TLS. Header `Referrer-Policy: no-referrer` cho API/Nginx đã được xác nhận trong runtime snapshot Buổi 16; xem evidence cập nhật bên dưới.
- Cách kiểm: test verifier, token và header HTTP trong `tests/security.test.js`; bootstrap tests kiểm sinh mật khẩu và giữ nguyên khi chạy lại.
- Bằng chứng: `npm-test.txt` 44/44 PASS. Clean deployment hai lệnh giữ nguyên, không thêm migration hoặc bước nhập secret. Không tuyên bố dữ liệu nhạy cảm đã được mã hoá toàn diện.

Cập nhật 13/11/2026: runtime snapshot Buổi 16 đã xác nhận header `no-referrer` trên web và API qua Nginx (`buoi16-20261112T165956Z/final/http-headers.json` trong evidence). Nhận định chưa kiểm Nginx runtime ở trên là trạng thái Buổi 15; giới hạn mã hoá/TLS vẫn giữ nguyên.

## 5. Thông báo lỗi không lộ thông tin nội bộ

**Trạng thái: ĐÃ LÀM tại HTTP boundary.**

- File: `src/backend/server.js`, `src/backend/logger.js`, `tests/errors.test.js`, `tests/security.test.js`.
- Cách kiểm: `npm.cmd test`. Cố ý gây lỗi nội bộ trong fixture, kiểm response chỉ có lỗi chung và requestId; không có message nội bộ, SQL hoặc stack. Không gây lỗi trên database hiện tại.
- Bằng chứng: `npm-test.txt`; test HTTP 500 mới và test lỗi cũ PASS. Lỗi nghiệp vụ đã biết vẫn có message/fields để người dùng sửa dữ liệu; stack đã lọc chỉ nằm trong log server.

## 6. Log không chứa secret hoặc dữ liệu cá nhân

**Trạng thái: ĐÃ LÀM trong các đường ghi log ứng dụng và Docker runtime đã kiểm.**

- File: `src/backend/logger.js`, `src/backend/server.js`, `deploy/nginx.conf`, `tests/errors.test.js`, `tests/security.test.js`.
- Logger dùng allowlist metadata; không ghi body/header/raw error message. Server chỉ ghi route template đã biết, ID thành `:id`, URL không nhận diện thành `other`, route khảo sát che token. Nginx log không ghi URI/query/IP/header/body.
- Cách kiểm: test HTTP login, lỗi 500 và URL chứa marker synthetic; assertion bảo đảm password/token/marker/segment khách không có trong log. Không in marker ra diagnostics. Runtime Nginx đã kiểm ở Buổi 16 và clean clone GitHub; Docker bị chặn chỉ là trạng thái lịch sử của lượt Buổi 15.
- Bằng chứng: `npm-test.txt`; các test log privacy PASS. Evidence BT2 cũ đã được giữ nguyên, không dùng kết luận mới để chứng nhận mọi artifact lịch sử không chứa dữ liệu cá nhân.

Cập nhật Buổi 16, 13/11/2026: Docker runtime đã chạy. Phát hiện cấu hình `access_log` ở HTTP context chưa chặn default inherited log, marker URL synthetic bị ghi lại. Đã chuyển safe access log vào server context, dựng lại và kiểm thêm trên snapshot mới/volume mới. Raw log cuối không chứa mật khẩu, các token quan sát được hoặc comment synthetic. Giữ FAIL trước sửa trong `nginx-privacy-before.json` và bản log ghi rõ redaction; PASS sau sửa ở `final/log-privacy.json`. Xem [báo cáo Buổi 16](testing/buoi16-deployment-report.md). Giới hạn runtime nêu ở đoạn trên là lịch sử của lượt Buổi 15.

## 7. Dependency được ghim phiên bản và kiểm tra lỗ hổng

**Trạng thái: ĐÃ LÀM cho npm tại thời điểm kiểm.**

- File: `package.json`, `package-lock.json`, `Dockerfile`.
- Dependency trực tiếp ghim version; có lockfile và dùng `npm ci`. Image có version tag, chưa ghim digest. Không nâng dependency trong lượt này.
- Cách kiểm: `npm.cmd audit --json`, `npm.cmd test`, `npm.cmd run build`.
- Bằng chứng: `npm-audit-online.json` ghi **0 vulnerabilities**, exit 0. Lượt audit sandbox không truy cập registry được, giữ riêng `npm-audit-sandbox.json`; không coi lỗi mạng là kết quả sạch. Suite 44/44 PASS. Build sandbox lỗi quyền đọc; chạy lại ngoài sandbox exit 0 (`npm-build-elevated.txt`, `build-status.json`).
- Giới hạn: npm audit không quét package hệ điều hành/image và không chứng minh không có lỗ hổng chưa công bố. Chưa có image vulnerability scan hoặc audit tự động trong CI; chạy lại trước phát hành.
