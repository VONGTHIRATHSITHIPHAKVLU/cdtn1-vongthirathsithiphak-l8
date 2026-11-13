# Bug Log — Buổi 14

Ghi chú hồ sơ BT3, 13/11/2026: ba mục bug và evidence dưới đây là lịch sử, giữ nguyên nguồn phát hiện và số test theo từng commit. [Clean clone GitHub b6a66b5](github-cleanclone-report.md) đã chạy suite 44/44 PASS; không thay kết quả regression gốc bằng số test mới. Trong lượt rà local này chỉ đối chiếu object/diff Git và link file; trạng thái HTTP công khai trong từng mục là kết quả xác minh trước đó, không phải HTTP mới.

Trạng thái 07/11/2026: cả ba bug đã sửa và có **commit local riêng**, đã kiểm staged diff và nội dung commit; đã push; link công khai được kiểm HTTP 200 không đăng nhập. Regression ba bug 5/5 PASS; full suite 40/40 PASS, build thành công. 12 ảnh TC và ảnh BUG-14-03-fixed có thật, đã mở. Phản hồi BT2/AC gốc chưa được cung cấp. Actions run 42271266689 đã completed/success. Không dùng hash/link giả.

## BUG-14-01

1. **Mã + severity:** BUG-14-01 · **Critical theo rubric Buổi 13 trang 21–22**: thao tác cập nhật một ID không tồn tại lại tạo dữ liệu ngoài ý muốn trong SQLite; rubric xếp dữ liệu bị sai vào Critical, không yêu cầu mất toàn bộ dữ liệu.
2. **Phát hiện bởi:** rà soát nhánh `if(id)` trong SurveyService và chạy TC-11 ngày 06/11/2026.
3. **Triệu chứng:** HTTP PUT `/api/survey-templates/0` trả 200 và tạo mẫu id=2, số mẫu 1→2; đúng ra phải 404 và không ghi.
4. **Tái lập:** F mới, đăng nhập; PUT endpoint trên với `{name:"Unexpected create",type:"CSAT",question:"Bạn hài lòng thế nào?",allowComment:true}`. Chạy `node scripts/test-buoi14.js TC-11`; kết quả mã gốc nằm trong before-fixes.txt, không khôi phục bug để tạo ảnh.
5. **Nguyên nhân:** `saveTemplate` kiểm truthiness của id; số 0 bị coi là không truyền ID nên bỏ kiểm tồn tại, repository đi nhánh INSERT.
6. **Cách sửa:** kiểm `id !== undefined` trong service; ID 0 được kiểm tồn tại trước khi repository ghi. Regression riêng: `tests/buoi14-bug01.test.js` kiểm status 404, error NOT_FOUND và toàn bộ số đếm không đổi.
7. **Commit + xác nhận:** [29b5658](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/29b56582cf6facb06a706c1ab34cfdf6a4a512df) — đã push và xác minh công khai: HTTP 200, không đăng nhập. [Raw](evidence/test-cases/TC-11.txt), [ảnh TC-11](../screenshots/TC-11.png) chứng minh PASS; cây commit thực tế 31/31 PASS ([log](evidence/publish-20261106T182108181513Z/bug14-01.txt)). Commit chỉ chứa source của bug, regression và ảnh/raw tương ứng.

## BUG-14-02

1. **Mã + severity:** BUG-14-02 · **Critical theo rubric Buổi 13 trang 21–22**: đầu vào tiếng Việt hợp lệ bị thay đổi và lưu sai vào database; rubric xếp dữ liệu bị sai vào Critical. Đã chứng minh lỗi toàn vẹn dữ liệu, không tuyên bố có lộ dữ liệu hoặc sập hệ thống.
2. **Phát hiện bởi:** rà soát `text += chunk` trong HTTP body parser và chạy TC-12 ngày 06/11/2026.
3. **Triệu chứng:** POST mẫu trả 201 nhưng `Mẫu tiếng Việt` thành `M���u tiếng Việt` trong response và SQLite khi chữ ẫ bị chia giữa các chunk.
4. **Tái lập:** F mới và phiên demo; tạo Buffer JSON của payload TC-12; chia sau byte đầu của chữ ẫ, gửi chunk đầu rồi phần còn lại sau 40ms bằng node:http. Chạy `node scripts/test-buoi14.js TC-12`; raw trước sửa ghi cả inputName, response và stored.
5. **Nguyên nhân:** nối Buffer vào string giải mã UTF-8 riêng từng chunk; chuỗi byte chưa đủ bị thay bằng U+FFFD trước khi JSON.parse. HTTP chunk không bảo đảm trùng biên ký tự Unicode.
6. **Cách sửa:** giữ Buffer chunks, đếm byte thật với giới hạn 16384 byte như cũ, concat rồi giải mã UTF-8 một lần. Regression riêng: `tests/buoi14-bug02.test.js`, kiểm 201, response.name và SQLite name bằng chính chuỗi đầu vào.
7. **Commit + xác nhận:** [559437d](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/559437df380649e3f99ead6dc542b59aa335c45d) — đã push và xác minh công khai: HTTP 200, không đăng nhập. [Raw](evidence/test-cases/TC-12.txt), [ảnh TC-12](../screenshots/TC-12.png) chứng minh PASS; cây commit thực tế 32/32 PASS ([log](evidence/publish-20261106T182108181513Z/bug14-02.txt)). Commit chỉ chứa source của bug, regression và ảnh/raw tương ứng.

## BUG-14-03 · Major · FIXED, đã có commit riêng công khai — trùng tên theo SQLite trả 500 thay vì lỗi nghiệp vụ

1. **Mã + severity:** BUG-14-03 · **Major**: chức năng tạo mẫu thất bại với một lớp chuỗi đầu vào được validator hiện tại chấp nhận; API trả lỗi hệ thống thay vì xung đột nghiệp vụ. Có cách tránh là bỏ ký tự NUL hoặc dùng tiền tố khác. Không quan sát thấy mất/sai dữ liệu hoặc lộ thông tin để xếp Critical.
2. **Phát hiện bởi:** rà soát nhánh kiểm trùng tên chưa có test cho embedded NUL, đối chiếu SRS US1, API contract mục Template/lỗi 409 và migration `name TEXT COLLATE NOCASE UNIQUE`; tái lập HTTP 2/2 lần trên SQLite memory mới, kiểm tra ngày 07/11/2026. Không có bảng AC Given–When–Then gốc để gán mã AC.
3. **Triệu chứng:** POST `/api/survey-templates` với name=`Nul\u0000A` trả 201; POST tiếp name=`Nul\u0000B` trả **500 INTERNAL_ERROR**, fields={}. Cột name trong SQLite coi hai chuỗi trùng (`SELECT ? = ? COLLATE NOCASE` = 1); API contract có lỗi **409 TEMPLATE_NAME_EXISTS** cho trùng tên. Hai chuỗi đúng kiểu string, độ dài 5, JSON hợp lệ; validator hiện không cấm NUL. Số mẫu trước/sau lần thứ hai 2→2, các bảng còn lại 0→0, hex của tên đã lưu giữ nguyên `4E756C0041`.
4. **Tái lập:** chạy `node --test tests/buoi14-bug03.test.js`. Fixture dựng một mẫu nền và HTTP server thật, đăng nhập bằng mật khẩu sinh trong RAM; gửi hai payload `{name:"Nul\u0000A",type:"CSAT",question:"Bạn hài lòng thế nào?",allowComment:true}` rồi cùng payload với name=`Nul\u0000B`. `\u0000` là ký tự NUL được JSON escape, không phải sáu ký tự dấu gạch chéo/u/0. [Lần 1](evidence/bug14-03-before-20261106T173834968701Z/reproduce-1.txt), [lần 2](evidence/bug14-03-before-20261106T173834968701Z/reproduce-2.txt).
5. **Nguyên nhân:** service dùng JavaScript `toLowerCase()` để so cả chuỗi nên đánh giá hai tên khác nhau; ràng buộc UNIQUE dùng SQLite NOCASE lại coi chúng bằng nhau tại NUL. INSERT thứ hai vi phạm UNIQUE, lỗi SQLite chưa được đổi thành AppError nghiệp vụ nên HTTP boundary trả 500. Đây là khác biệt so sánh tên/service–database, độc lập với BUG-14-02 về giải mã UTF-8 theo chunk.
6. **Cách sửa đã thực hiện:** thêm `SurveyRepository.templateNameExists(name, excludeId)` truy vấn bằng `COLLATE NOCASE`, loại trừ chính ID khi cập nhật; `SurveyService.saveTemplate` kiểm kết quả này trước INSERT/UPDATE và trả AppError `TEMPLATE_NAME_EXISTS`. Giữ thêm phép so Unicode `toLowerCase()` cũ vì SQLite NOCASE chỉ xử lý hoa/thường ASCII; không làm mất quy tắc trùng tên Unicode đang có. Contract/validator không cấm NUL nên giữ expected **409**, không tự thêm quy tắc từ chối 400. Không đổi schema, CSAT/NPS, invitation hoặc token. Regression thêm trường hợp sửa chính ID, xung đột khi sửa ID khác, tên Unicode trùng và tên khác hợp lệ.
7. **Commit + xác nhận:** [4e95e3f](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/4e95e3f4ccbc2eb6f6ebf2acbd56c221d1d47d5d) — đã push và xác minh công khai: HTTP 200, không đăng nhập. [FAIL trước sửa](evidence/bug14-03-fix-20261106T175309250796Z/before.txt); [PASS sau sửa](evidence/bug14-03-fix-20261106T175309250796Z/after.txt) 3/3; [ảnh BUG-14-03-fixed](../screenshots/BUG-14-03-fixed.png) đã mở, đúng 3/3 PASS. Cây commit thực tế 35/35 PASS ([log](evidence/publish-20261106T182108181513Z/bug14-03.txt)); full working tree 40/40 PASS, build exit 0.

## Kiểm tra bổ sung được giữ lại

[Kiểm tra chuyên sâu](evidence/deep-review-20261106T174341298331Z/deep-cases-public.txt) gồm quyền truy cập, điều kiện mời, biên thời hạn, gửi đồng thời, CSAT/NPS và rollback. Các probe ngoài suite được giữ kèm source/raw tại [supplemental](evidence/supplemental/): extra-exceptions (3/3 PASS), nps-expiry (2/2 PASS). Đây là kết quả trước sửa BUG-14-03, không cộng vào 40 test của npm test. Chỉ giữ raw có giá trị riêng và bỏ các vòng chạy lặp/metadata thừa; không sửa nội dung log còn giữ.

## Commit đã thực hiện và kiểm chứng

| Thứ tự | Commit thật | Nội dung riêng | Cây commit đã test |
|---|---|---|---|
| Hạ tầng | [fc83221](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/fc8322178e532e8f9e6362ae9dad5181c98fcc0c) | Helper, 10 test nền, baseline/FAIL-before chung | 30/30 PASS |
| BUG-14-01 | [29b5658](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/29b56582cf6facb06a706c1ab34cfdf6a4a512df) | Chỉ hunk ID=0 trong service; regression và ảnh/raw TC-11 | 31/31 PASS |
| BUG-14-02 | [559437d](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/559437df380649e3f99ead6dc542b59aa335c45d) | Server gom Buffer/decode UTF-8; regression và ảnh/raw TC-12 | 32/32 PASS |
| BUG-14-03 | [4e95e3f](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/4e95e3f4ccbc2eb6f6ebf2acbd56c221d1d47d5d) | Repository, hunk kiểm tên trùng còn lại trong service, regression, ảnh/raw trước/sau; .gitattributes bảo toàn raw log | 35/35 PASS |

Hunk ID=0 được stage riêng bằng patch vào index từ blob HEAD; cached diff đã chứng minh không chứa kiểm tên trùng. Khi commit BUG-14-03, hunk ID=0 đã nằm trong BUG-14-01 nên diff chỉ còn kiểm tên trùng. Không reset/stash, không mất thay đổi/evidence. Test chạy từ git archive của đúng từng hash trong bản sao tạm; [log và danh sách file](evidence/publish-20261106T182108181513Z/). Phần HTTP/exploration và tài liệu/CI/minh chứng được commit tiếp sau; full working tree đã chạy 40/40. Cả ba link commit ở trên đã được kiểm qua API và trang GitHub không đăng nhập, HTTP 200; danh sách file khớp từng bug. [Lịch sử main](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commits/main) sẽ hiển thị commit mới nhất; Actions đã success: [run 42271266689](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/actions/runs/42271266689).

## Xác nhận GitHub sau push

Repo PUBLIC; ba commit bug độc lập đều đã push và kiểm HTTP 200 không đăng nhập. Commit tài liệu [8626c93](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/commit/8626c9310240d79d968916f4670ba3bcb8350cec) có [Actions success](https://github.com/VONGTHIRATHSITHIPHAKVLU/cdtn1-vongthirathsithiphak-l8/actions/runs/42271266689), job check và npm ci/test/build đều success. [84 kiểm tra URL](evidence/publish-20261106T182108181513Z/public-links.json), [API jobs](evidence/publish-20261106T182108181513Z/actions-verified.json). Ảnh BUG-14-03-fixed đã có. Còn thiếu phản hồi BT2/AC gốc, không còn thiếu bug thứ ba hoặc link commit bug.
