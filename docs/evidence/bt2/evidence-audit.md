# Kiểm kê minh chứng BT2 — 30/10/2026

## Bằng chứng tổng hợp mới nhất

[smartcrm-bt2-runtime-1793305395728/results.json](smartcrm-bt2-runtime-1793305395728/results.json) và [responsive.json](smartcrm-bt2-runtime-1793305395728/responsive.json) thay các giới hạn kỹ thuật cũ: Docker sau CSS, CRUD hai entity, 5 màn hình × 2 viewport, raw log không chứa token, restart/recreate đều PASS. Ảnh mobile của 5 màn hình đã được xem trực tiếp. Các phần “chưa retest Docker/mobile” bên dưới là lịch sử trước lượt mới, không còn là giới hạn hiện tại. Các FAIL cũ giữ nguyên, không sửa artifact. Nginx log cũ được redaction sau thu thập; chỉ lượt mới kiểm raw log trước redaction. Checklist đầy đủ: ../../bt2-checklist.md.

## Nguồn yêu cầu

- `CDTN1_Buoi11_Tich hop he thong va Xu ly loi.pdf`: phụ thuộc, debug bốn bước, logging/xử lý lỗi, Docker.
- `CDTN1_Buoi12_Workshop tich hop va Nop Bai tap 2.pdf`: trang 3 (5 thành phần và PDF 6–9 trang), trang 8 (C1/C2/C4/C5/C7), trang 9 (SE), trang 11 (checklist nộp).
- `CDTN1_Tai lieu tu hoc Buoi 11 - Dong goi va cau hinh theo stack.pdf`: A (SE), D1 (mẫu Bug Log 7 dòng), D4 (checklist). Điều kiện ≥3 bug kèm link commit thuộc BT3; chưa xác nhận điều kiện đó hoàn tất.

## Kết quả và phạm vi bằng chứng

| Artifact | Kiểm tra và cách sử dụng |
|---|---|
| `latest-test-output.txt`, `latest-tests.png` | Chạy mới `npm.cmd test`: 20 tests, 20 pass, 0 fail/skip; có 3 test mới trong errors.test.js. PNG trình bày stdout thật trong Chrome, không phải ảnh terminal hệ điều hành. |
| `test-output.txt`, `10-tests.png`, `capture.json` | Lịch sử 17 test và lần chụp local ban đầu; không dùng để chứng minh 20 test. Giữ nguyên, không sửa số trong artifact cũ. |
| `smartcrm-bt2-runtime-1793303571191/` | Lần đầu dừng sớm do mobile overflow; không dùng chứng minh persistence. |
| `smartcrm-bt2-runtime-1793303619791/results.json` | Lần đầy đủ: HTTP/status/requestId, lệnh Docker, restart/recreate persistence PASS; mobile Templates FAIL 453px. Không sửa kết quả lịch sử. |
| Runtime `containers.json`, `final-containers.json` | Output `docker compose ps --format json` thực chất NDJSON (mỗi container một dòng JSON). Đã parse từng dòng; API healthy, web running. Web không có healthcheck riêng. |
| Runtime `compose.log` và PNG 01–11 | Log có startup, HTTP thật; ảnh thể hiện luồng và lỗi sau stop API. Token test trong đường dẫn log đã được che. Runtime output JSON không lưu session token thật. Kiểm tra được định dạng/khả năng mở ảnh không tự chứng minh mọi hành vi; đối chiếu results/log và script. |
| Runtime `compose-up.txt` | Có thể không chứa toàn bộ build progress vì Docker ghi stderr; không dùng riêng file này để kết luận build/up PASS. Dùng trạng thái container, HTTP, log và results đi kèm. |
| `templates-responsive/before.json`, `before-375.png` | Seed local trước sửa: document 448px; khác dữ liệu Docker 453px. Không trộn hai phép đo. |
| `templates-responsive/after.json`, `after-375.png`, `after-1440.png` | Sau sửa local Vite/API thật: document 375px/1440px, tạo/sửa/xóa PASS. Trường overflow trong JSON liệt kê bounding box phần tử bảng rộng bên trong scroller, không có nghĩa document còn tràn. |
| `templates-responsive/desktop-controlled-before.png`, `desktop-controlled-after.png` | Cặp ảnh cùng trạng thái có/không CSS sửa lỗi giống byte, chứng minh desktop không đổi trong phép thử này. Các ảnh before-1440/after-1440 chụp khác trạng thái sau CRUD không phải cặp so sánh pixel. |
| `artifact-inventory.json` | Kiểm kê tự động 49 artifact image/JSON/NDJSON/log tại thời điểm chạy; PNG decode được, JSON/NDJSON parse được, log có kích thước. Hai preview báo cáo được tạo sau kiểm kê này. Không phải báo cáo PASS chức năng cho từng file. |
| `report-page7-preview.png`, `report-page8-preview.png` | Preview HTML ở print media. Đã kiểm 8 section: ảnh load được, không có phần tử con chồng footer trong phép đo Chrome. Không thay cho kiểm PDF gốc. |

Đã đối chiếu trực quan ảnh Templates mobile sau sửa và ảnh lỗi mobile trước sửa trong lượt responsive; rà soát thêm preview trang 7 khi hoàn thiện báo cáo. Không tuyên bố đã kiểm mọi pixel của mọi ảnh hoặc mọi trình duyệt.

## Báo cáo PDF

`docs/BT2_237480201IS04_VONGTHIRATH_SITHIPHAK.pdf` được xuất lại từ HTML đã đồng bộ. Kiểm bằng pypdf: **8 trang**, đúng VONGTHIRATH SITHIPHAK, MSSV **237480201IS04**. Có mục 1 tóm tắt, 2 kiến trúc, 3 module cốt lõi, 4 kiểm thử (20/20 PASS), 5 trạng thái, 6 dựng lại, 7 thay đổi BT1 và phụ lục AI. Mục 3/4/5 có ảnh thật được nhúng từ artifact tương ứng. Bìa có track SE, L8, URL remote và tên tag yêu cầu; lớp chính xác 261_71ITGR40203_03, không còn placeholder.

## Chưa được phép ghi hoàn thành

- Lớp học đã được người dùng xác nhận: **261_71ITGR40203_03**; HTML/PDF đã cập nhật.
- URL origin hiện tại: `https://github.com/VONGTHIRATHSITHIPHAKVLU/smartcrm-237480210is04-lead-management.git`. Bìa dùng URL tương ứng. Tên repo chứa `237480210is04`, khác MSSV đúng `237480201IS04`: cần sinh viên xác nhận URL nộp cuối; chưa đổi tên repo.
- `git tag --list` chưa có tag; truy vấn remote `refs/tags/v0.2` không có kết quả. Chưa có commit/link sửa lỗi, chưa clone-and-run từ tag. Không coi bản sao local sạch là đạt C1 theo tag.
- Chưa xác nhận repository public bằng truy cập ẩn danh, sinh viên tự hiểu/kiểm chứng khai báo AI BT1/BT2, peer review, sơ đồ drawio gốc và trạng thái nộp E-learning.
- Chưa có dữ liệu CSV chính thức; bằng chứng đang dùng demo/fixture.
- Chưa build và chạy lại Docker sau CSS responsive; mobile các màn hình còn lại và trình duyệt khác chưa xác minh.
- Chưa chạy lại toàn bộ script Docker sau đổi quy ước exit code; lượt đầy đủ cũ exit 0 dù bảng có FAIL mobile. Không suy PASS từ exit code cũ.

Không thay đổi nghiệp vụ, không xóa database/volume, không commit/push/tag trong lượt hoàn thiện tài liệu.
