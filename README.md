# Hệ thống Khảo sát Hài lòng CSAT / NPS cho Dịch vụ Bảo hành

> Đồ án môn học – Track **SE (Software Engineering)**
> Sinh viên thực hiện: **VONGTHIRATH SITHIPHAK** – MSSV: `<điền MSSV>`

---

## 1. Giới thiệu

Dự án xây dựng module **khảo sát mức độ hài lòng khách hàng (CSAT / NPS)** cho trung tâm dịch vụ bảo hành. Sau khi một Ticket bảo hành được **ĐÃ ĐÓNG**, hệ thống tự động gửi khảo sát cho khách hàng, thu thập điểm đánh giá và nhận xét, lưu phản hồi gắn với Ticket, rồi tổng hợp kết quả để các bộ phận quản lý theo dõi chất lượng dịch vụ.

**Luồng nghiệp vụ tổng quát:**

```
Ticket ĐÃ ĐÓNG → Hệ thống gửi khảo sát → Khách hàng chấm điểm / nhận xét
              → Hệ thống lưu phản hồi → Tổng hợp kết quả
```

## 2. Actor

| Actor | Vai trò |
|---|---|
| Khách hàng | Nhận khảo sát, chấm điểm 1–5 và nhập nhận xét |
| Nhân viên Marketing | Theo dõi tình hình gửi/nhận khảo sát, xem kết quả tổng hợp |
| Quản lý trung tâm dịch vụ | Xem điểm hài lòng theo trung tâm và kỹ thuật viên |
| Ban giám đốc | Xem báo cáo tổng quan theo thời gian |

## 3. Chức năng chính

1. **Gửi khảo sát** cho khách hàng khi Ticket chuyển sang trạng thái `ĐÃ ĐÓNG`.
2. **Chấm điểm và nhận xét**: khách hàng chọn mức hài lòng từ 1–5 và nhập nhận xét.
3. **Kiểm tra điều kiện khảo sát**: chỉ Ticket `ĐÃ ĐÓNG` và mỗi Ticket chỉ được khảo sát 1 lần.
4. **Lưu phản hồi** và liên kết với Ticket tương ứng.
5. **Tổng hợp điểm hài lòng** theo trung tâm dịch vụ, kỹ thuật viên và khoảng thời gian.

## 4. Quy tắc nghiệp vụ

| Mã | Quy tắc |
|---|---|
| BR-01 | Chỉ gửi / cho phép khảo sát khi Ticket có trạng thái `ĐÃ ĐÓNG`. |
| BR-02 | Mỗi Ticket chỉ được ghi nhận **tối đa 1 phản hồi**. |
| BR-03 | Điểm khảo sát là **bắt buộc** và nằm trong khoảng **1–5**. |
| BR-04 | Lưu **thời điểm** khách hàng gửi phản hồi (`submitted_at`). |

## 5. Phạm vi

**Trong phạm vi:** các chức năng ở mục 3 và các quy tắc ở mục 4.

**Ngoài phạm vi (không thực hiện):**

- Không xây dựng toàn bộ hệ thống CRM.
- Không xây dựng quy trình tiếp nhận / sửa chữa / bảo hành Ticket.
- Không phân tích cảm xúc (sentiment analysis) từ nội dung nhận xét.

## 6. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js |
| Frontend | React |
| Cơ sở dữ liệu | MySQL |

## 7. Dữ liệu

| Tệp | Quy mô | Mô tả |
|---|---|---|
| `survey_responses.csv` | ~2.600 dòng | Phản hồi khảo sát của khách hàng |
| `tickets_history.csv` | ~7.800 dòng | Lịch sử Ticket bảo hành, dùng để liên kết và phân tích |
| `ticket_status_log.csv` | ~31.000 dòng | Lịch sử thay đổi trạng thái Ticket |

Dữ liệu được nạp vào MySQL bằng script import trong thư mục `database/seed/`.

### Mô hình dữ liệu (dự kiến)

```
tickets (ticket_id PK, customer_id, service_center_id, technician_id, status, created_at, closed_at)
ticket_status_log (log_id PK, ticket_id FK, old_status, new_status, changed_at)
survey_responses (response_id PK, ticket_id FK UNIQUE, score TINYINT CHECK 1..5, comment TEXT, submitted_at)
```

> Ràng buộc `UNIQUE(ticket_id)` trên `survey_responses` đảm bảo quy tắc BR-02 ở tầng cơ sở dữ liệu.

## 8. Cấu trúc thư mục (dự kiến)

```
.
├── backend/              # Node.js (REST API)
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/     # logic kiểm tra điều kiện khảo sát, tổng hợp
│   │   └── models/
│   └── package.json
├── frontend/             # React
│   ├── src/
│   │   ├── pages/        # Form khảo sát, Dashboard
│   │   └── components/
│   └── package.json
├── database/
│   ├── schema.sql
│   └── seed/             # CSV + script import
└── README.md
```

## 9. API (dự kiến)

| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/surveys/send/:ticketId` | Gửi khảo sát cho Ticket đã đóng |
| `GET` | `/api/surveys/:token` | Lấy thông tin form khảo sát (kiểm tra điều kiện hợp lệ) |
| `POST` | `/api/surveys/:token/responses` | Khách hàng gửi điểm (1–5) và nhận xét |
| `GET` | `/api/reports/summary` | Tổng hợp điểm theo trung tâm / kỹ thuật viên / thời gian |

**Mã lỗi nghiệp vụ tiêu biểu:**

- `400` – điểm ngoài khoảng 1–5 hoặc thiếu điểm.
- `403` – Ticket chưa ở trạng thái `ĐÃ ĐÓNG`.
- `409` – Ticket đã có phản hồi (khảo sát trùng).

## 10. Hướng dẫn cài đặt và chạy

### Yêu cầu

- Node.js >= 18
- MySQL >= 8.0

### Các bước

```bash
# 1. Clone dự án
git clone <repo-url>
cd <project-folder>

# 2. Tạo cơ sở dữ liệu
mysql -u root -p -e "CREATE DATABASE csat_nps CHARACTER SET utf8mb4;"
mysql -u root -p csat_nps < database/schema.sql

# 3. Cấu hình và chạy backend
cd backend
cp .env.example .env        # chỉnh DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
npm install
npm run seed                # nạp dữ liệu CSV vào MySQL
npm run dev                 # chạy tại http://localhost:3000

# 4. Chạy frontend (terminal khác)
cd frontend
npm install
npm start                   # chạy tại http://localhost:5173
```

### Biến môi trường (`backend/.env`)

```
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=csat_nps
```

## 11. Chỉ số tổng hợp

- **CSAT** = (số phản hồi điểm 4–5 / tổng số phản hồi) × 100%
- **Điểm trung bình** theo trung tâm dịch vụ, kỹ thuật viên, tháng / quý / năm.
- **Tỷ lệ phản hồi** = số phản hồi / số khảo sát đã gửi.

## 12. Kiểm thử

```bash
cd backend && npm test
```

Các ca kiểm thử trọng tâm:

- Gửi khảo sát cho Ticket chưa đóng → bị từ chối.
- Gửi phản hồi lần 2 cho cùng Ticket → bị từ chối.
- Điểm = 0, 6 hoặc rỗng → bị từ chối.
- Phản hồi hợp lệ → lưu thành công kèm `submitted_at`.

## 13. Tác giả

**VONGTHIRATH SITHIPHAK** – Track SE

## Design change log (sau phản hồi BT1)

Cập nhật ngày 19/10/2026. Mỗi điểm góp ý của GV đều được quyết định SỬA hoặc GIỮ; phần "Điểm tốt" (NFR có điều kiện đo, đặc tả UC3, lập luận kiến trúc, thuật ngữ thống nhất) giữ nguyên. Chi tiết (phản hồi, quyết định, lý do, ảnh hưởng): [`docs/thay-doi-thiet-ke.md`](docs/thay-doi-thiet-ke.md).

| Mã | Góp ý của GV | Quyết định | Thay đổi | Trạng thái |
|---|---|---|---|---|
| TD-01 | 8 User Story, đề yêu cầu 5–7 | SỬA | Gộp US7 (xuất CSV) vào US4 (xem điểm); US8 cũ thành US7. Cập nhật bảng truy vết, danh sách UC, API contract | Xong |
| TD-02 | ERD 7 bảng, đề yêu cầu 4–6 | SỬA | Bỏ bảng `service_center` (thuộc luồng khác, L8 chỉ đọc); giữ cột `support_request.center_id`, không có khóa ngoại. Migration chỉ tạo 6 bảng | Xong |
| TD-03 | Sơ đồ kiến trúc thiếu chú thích ký hiệu | SỬA | Thêm khung chú thích màu khối và chiều mũi tên (`docs/export/architecture.png`) | Hình xong; còn cập nhật `.drawio` gốc |
| TD-04 | MSSV trên bìa sai | SỬA | Sửa thành 237480201IS04 ở trang bìa và dòng ký tên | Xong |
| TD-05 | Link GitHub cần đặt ở bìa | SỬA | Thêm link repo vào trang bìa | Xong; cập nhật link sau khi đổi tên repo |
| TD-06 | Phụ lục AI còn dòng mẫu | SỬA | Tự ghi cách đã kiểm chứng kết quả AI | Chưa xong |
| TD-07 | Repo thiếu `.drawio`, commit mơ hồ, tên repo sai luồng | SỬA | Đổi tên repo thành `smartcrm-l8-csat-nps`; commit theo Conventional Commits; thêm `.drawio` gốc | Commit xong; còn đổi tên repo và thêm `.drawio` |

**Ảnh hưởng tới mã nguồn:** migration `001` không tạo `service_center` và seed không có dữ liệu `service_centers` (TD-02). Các thay đổi còn lại chỉ nằm ở tài liệu.