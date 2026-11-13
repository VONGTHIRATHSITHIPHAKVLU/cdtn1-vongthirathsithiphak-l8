# BT3 readiness — SmartCRM L8, rà local 13/11/2026

**Repository local: READY WITH LIMITATIONS.** Source và bằng chứng kỹ thuật đã được kiểm; C7 PASS trong phạm vi source/Git history đã quét, kết hợp xác nhận của chủ dự án ngày 13/11/2026. Scanner vẫn có giới hạn và bản cập nhật tài liệu/evidence cuối chưa được công bố. Đây không phải xác nhận hồ sơ nộp BT3 chính thức đã hoàn tất.

**Phạm vi đã chốt:** chủ dự án tự thực hiện PDF BT3 và bảng AI Disclosure bốn cột trong file riêng. Không tạo PDF, Word, bản nháp báo cáo hoặc AI Disclosure trong repository; không yêu cầu các file này có trong VS Code. Sự vắng mặt của chúng không phải lỗi source hoặc điều kiện BLOCKED cho readiness của repository.

Nguồn tiêu chí C1–C9 và bảy mục bảo mật là phần slide Buổi 15–16 do chủ dự án cung cấp trong hội thoại. Không có PDF slide/đề BT3 gốc trong workspace để đối chiếu thêm số trang, thành phần bắt buộc và quy tắc nộp. Không dùng repo L4 làm nguồn quy định.

Rà này chỉ đọc source/Git và sửa tài liệu local; không chạy lại suite/build/Docker, không thay đổi dữ liệu. Những kết quả PASS bên dưới dẫn về log đã có; không phải kết quả test mới.

## C1–C9

| Tiêu chí | Readiness | Căn cứ và phần còn lại |
|---|---|---|
| C1 — dựng từ thư mục trống ≤2 lệnh | **READY** | [Clean clone](github-cleanclone-report.md) từ GitHub b6a66b5, clone + launcher exit 0, API/web healthy; không cd hoặc copy env. Chỉ xác nhận cho revision/môi trường đã kiểm. |
| C2 — 10–12 TC, tám cột, năm loại | **READY** | [Test Report](buoi14-test-report.md) có 12 TC/tám cột; loại đúng, biên, sai, bảo mật/toàn vẹn và tái lập. Giữ ảnh/raw Buổi 14, phân biệt 12 mã TC với 14 test nhóm và 44 test toàn suite. |
| C3 — suite một lệnh, replay một TC | **READY** | [44-test log](evidence/github-cleanclone-20261112T172747Z/npm-test.txt), [TC-07](evidence/github-cleanclone-20261112T172747Z/single-case.txt), [exit codes](evidence/github-cleanclone-20261112T172747Z/test-status.json). Chạy Node host trong clone, không tuyên bố trong runtime image. |
| C4 — ≥3 bug, severity, bảy mục, commit đúng | **READY** | [Bug Log](buoi14-bug-log.md), local Git có 29b5658/559437d/4e95e3f đúng source/regression/evidence tương ứng. Public-link HTTP 200 đã có evidence lịch sử; lượt local này không kiểm HTTP mới. |
| C5 — guide năm mục, Verify it works | **READY** | [Guide tiếng Anh](../deployment-guide.md) đúng năm mục, khớp launcher, env/demo/health; cập nhật C1 đã kiểm public. |
| C6 — checklist bảy mục, trạng thái/evidence | **READY về hồ sơ** | [Checklist](../security-checklist.md) đủ bảy mục và không che CHƯA LÀM ở owner/center, bảo vệ dữ liệu đầy đủ. READY nghĩa là điền trung thực, không phải cả bảy chức năng đều hoàn thiện. |
| C7 — không secret, .env chưa từng commit | **PASS trong phạm vi đã kiểm** | Scan không thêm candidate; không thấy .env đã commit trong các ref local được quét. 48 lượt khớp gồm 26 fixture, 20 placeholder và hai lượt cùng credential capture. Chủ dự án xác nhận ngày 13/11/2026: chỉ dùng local demo/test, chưa từng dùng production/public deployment/tài khoản thật/dữ liệu thật, không có credential production liên quan cần rotate. Xem giới hạn và nguồn xác nhận bên dưới. |
| C8 — chạy lần hai không lỗi/nhân đôi | **READY** | [Runtime clone](evidence/github-cleanclone-20261112T172747Z/verified/runtime-results.json): migrate/seed hai vòng giữ `[4,4,1,1,1,2]`, response giữ sau restart. |
| C9 — tài liệu theo track đúng thực tế | **READY ở local; bản public chưa cập nhật cuối** | [API](../api-contract.md) khớp 17 method/path, auth/payload/error thực tế; README phân biệt 40 test lịch sử với 44 hiện tại. Không mô tả EMAIL/SMS thật, scheduler, phân quyền nhiều manager hoặc mã hoá như đã có. Chưa xác nhận bao phủ AC/feedback nguyên bản chưa cung cấp. |

## Đã sửa tài liệu trong lượt rà này

- Test Plan: bỏ trạng thái thiếu bug thứ ba/link commit đã lỗi thời, ghi rõ 40 test lịch sử và 44 test hiện tại.
- Test Report/Bug Log: thêm dẫn chiếu clean clone và phân biệt các mốc lịch sử; không thay bảng kết quả, severity hoặc raw cũ.
- API Documentation: đủ 17 cặp method/path hiện thực; thêm health và CRUD lời mời vào bảng chính, trường public/support request đầy đủ, 405 đúng phạm vi, INVITATION_LOCKED, lỗi 503 thực trả INTERNAL_ERROR.
- Security Checklist: giữ đúng bảy mục, bổ sung link evidence trực tiếp và đường dẫn source đầy đủ; bỏ nhận định Docker chưa kiểm như trạng thái hiện tại. Không nâng mục 3/4 lên ĐÃ LÀM.
- README/guide: đã đối chiếu với cập nhật clean clone local; các phần BT2/Buổi 14 được gắn bối cảnh lịch sử, không thay tag hay tuyên bố v1.0.

## File đưa vào hồ sơ

Danh mục cụ thể: [bt3-file-manifest.md](../bt3-file-manifest.md). Chọn ảnh/raw theo đúng lần chạy. Bốn screenshot clean-clone đã được mở xem ở lượt kiểm trước; lượt này kiểm lại hash/file/link. Không tạo ảnh mới hoặc kết quả test mới.

## Phạm vi kết luận C7

Scanner kiểm source/tài liệu/evidence dạng text hiện tại, gồm untracked không bị loại trừ, và các blob/commit/tag reachable từ ref Git local. Có hỗ trợ UTF-8 và UTF-16LE có BOM. Kết quả chỉ ghi vị trí/rule/object ID, không ghi giá trị nghi là secret. Lịch sử đường dẫn `.env` được kiểm riêng; `.env.example` được cho phép.

Không quét node_modules, dist, cache/temp, `.tmp`, symlink, nội dung binary/ảnh bằng OCR, dangling object hoặc ref chưa có local; không kiểm bản sao ngoài repository. File `.env` provisioning không được xuất ra báo cáo; scanner dùng giá trị hiện tại để dò rò rỉ sang text đã quét. Quy tắc pattern và kết quả không có candidate mới không phải chứng minh tuyệt đối không có secret.

Đối chiếu 48 lượt khớp: 26 lượt fixture trong tests, 20 lượt placeholder đã redaction và hai lượt (worktree/history) của cùng credential demo tĩnh tại `scripts/capture-bt2.cjs:11`. Không phải 48 secret khác nhau. Scan không tự xác định được việc dùng credential ngoài repo; [triage gốc](evidence/security-20261112T165156Z/secret-triage.json) được giữ nguyên như bằng chứng tại thời điểm kiểm.

**Xác nhận của chủ dự án ngày 13/11/2026, cung cấp trực tiếp trong hội thoại:** credential capture chỉ dùng demo/capture local; fixtures trong tests chỉ dùng automated tests; các giá trị này chưa từng dùng cho production, deployment public, tài khoản thật hoặc môi trường chứa dữ liệu thật; không có nhu cầu rotate credential production liên quan. Đây là nguồn xác nhận của chủ dự án, không phải phát hiện do scanner tự chứng minh và không phải kết quả kiểm thử mới.

Kết hợp kết quả kiểm source/config/history với xác nhận trên, không còn trường hợp chưa xử lý được biết đến trong phạm vi C7 đã kiểm: **C7 PASS trong phạm vi đó**. Không mở rộng kết luận sang ref/binary/hệ thống ngoài phạm vi scan hoặc coi là chứng nhận an toàn tuyệt đối. Không cần rotate production liên quan theo xác nhận hiện có; nếu sau này có thông tin trái ngược hoặc có tái sử dụng thật, phải đánh giá lại và rotate tại môi trường liên quan. Xem thêm [Checklist bảo mật](../security-checklist.md).

## PDF và AI Disclosure ngoài phạm vi repository

Chủ dự án tự đối chiếu định dạng/nội dung PDF và AI Disclosure với yêu cầu giảng viên. Repository cung cấp source, tài liệu kỹ thuật và evidence thật để tham khảo; không tạo hoặc yêu cầu bản PDF/Word/HTML báo cáo hay file/bảng/thư mục AI Disclosure riêng trong repo. Các file khai báo cũ được giữ nguyên như tài liệu lịch sử, không được coi là yêu cầu tạo/cập nhật AI Disclosure BT3 tại đây.

## Việc còn lại trong phạm vi repository

1. Giữ credential fixture/capture trong phạm vi demo/test; phần xác nhận sử dụng lịch sử đã được chủ dự án cung cấp, không còn là việc đang chờ của C7. Đánh giá lại nếu xuất hiện thông tin mới hoặc tái sử dụng ngoài phạm vi này.
2. Giữ giới hạn bao phủ feedback BT2/AC BT1 vì chưa có nguyên bản; không tạo nội dung thay thế.
3. Tài liệu/evidence clean-clone và readiness mới còn local. Chỉ công bố sau khi được cho phép rõ ràng; không tự commit/push hoặc tạo v1.0.

Evidence audit local: `docs/testing/evidence/bt3-readiness-20261112T173603Z/`. Không sửa/xóa bất cứ screenshot/raw evidence cũ nào.

Kết quả audit thực tế: `links-and-structure-final.json` ghi 223 link local không thiếu đích, 12 ca đều tám cột, ba bug đều bảy mục, checklist bảy heading/bảy trạng thái, guide năm mục và API đủ 17 method/path. `image-hashes.json` ghi 21 ảnh khớp hash (12 TC, BUG-14-03, bốn ảnh snapshot và bốn ảnh clean clone). `diff-check-final.txt` exit 0. HTTP public không được kiểm lại trong lượt local này; không suy diễn HTTP 200 mới từ việc link file tồn tại.
