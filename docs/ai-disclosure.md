# Khai báo sử dụng công cụ AI — BT2

| Công cụ | Công việc | Tệp/hàm | Kiểm chứng thực tế và giới hạn |
|---|---|---|---|
| Claude (Anthropic), theo khai báo BT1 hiện có | Gợi ý phân tích yêu cầu, User Story, use case, SRS, kiến trúc, ERD | Các phần thiết kế BT1; xem `docs/AI.md` | Khai báo BT1 chưa có cách kiểm chứng do sinh viên tự ghi. Không xác nhận thay sinh viên. |
| OpenAI Codex, 30/10/2026 | Đọc tài liệu buổi 11–12, đối chiếu tiêu chí; bổ sung CRUD lời mời và bảo vệ dữ liệu đã trả lời | SurveyService.updateInvitation/deleteInvitation, repository, apiRouter | Unit và HTTP integration test; kiểm token cũ, dữ liệu sai, không xóa phản hồi. |
| OpenAI Codex, 30/10/2026 | Logging an toàn, healthcheck, đóng gói và cấu hình | logger.js, server.js, Dockerfile, compose.yaml, vite.config.js | Test allowlist log, seed hai lần, build; kết quả chạy Docker/bản sao sạch ghi riêng trong biên bản. |
| OpenAI Codex, 30/10/2026 | Soạn tài liệu và báo cáo, tự động chụp giao diện thực tế | README, Bug Log, biên bản, báo cáo BT2 | Ảnh từ trình duyệt chạy ứng dụng; không phải ảnh thiết kế hoặc dữ liệu chính thức của môn học. |

| OpenAI Codex, 30/10/2026 | Logging 500/requestId, Docker runtime/persistence, sửa responsive và đồng bộ gói BT2 | tests/errors.test.js, verify-docker-runtime.cjs, style.css, tài liệu HTML/PDF | 20/20 tests; runtime project riêng; responsive JSON/ảnh trước-sau. Lượt tổng hợp mới đã retest Docker sau CSS, 5 màn hình/2 viewport và log Nginx an toàn; xem bt2-checklist.md. Sinh viên chưa xác nhận tự kiểm. |

Đây là khai báo công việc AI đã thực hiện. Sinh viên cần đọc mã, tự kiểm lại và giải thích từng phần trước khi ký xác nhận/nộp. Không ghi rằng sinh viên đã kiểm chứng khi chưa có xác nhận đó.
