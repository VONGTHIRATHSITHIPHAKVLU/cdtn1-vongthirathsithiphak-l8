# C1 — Clone-and-run từ tag v0.2

Trạng thái: **CHƯA XÁC MINH**. Chỉ thực hiện sau khi chủ dự án đã duyệt và push commit/tag; tài liệu này không tạo tag hoặc xác nhận tag tồn tại.

Điều kiện: Node.js ≥24.15, npm, Git; tùy chọn Docker Desktop Linux containers. URL dưới đây lấy từ origin hiện tại; sinh viên cần xác nhận URL nộp cuối.

Chọn tên thư mục mới chưa tồn tại, ở ngoài working tree hiện tại:

```powershell
git ls-remote --tags https://github.com/VONGTHIRATHSITHIPHAKVLU/smartcrm-237480210is04-lead-management.git refs/tags/v0.2
git clone --branch v0.2 --single-branch https://github.com/VONGTHIRATHSITHIPHAKVLU/smartcrm-237480210is04-lead-management.git smartcrm-bt2-clone-check
Set-Location smartcrm-bt2-clone-check
git describe --tags --exact-match
git rev-parse HEAD
npm.cmd ci
Copy-Item .env.example .env
```

Điền DEMO_PASSWORD riêng trong .env, rồi làm từng bước README:

```powershell
npm.cmd run migrate
npm.cmd run seed
npm.cmd run migrate
npm.cmd run seed
npm.cmd test
npm.cmd run build
npm.cmd run server
```

Terminal thứ hai ở cùng thư mục clone: `npm.cmd run dev`. Kiểm tra Login → Templates → Invitations → Survey → Dashboard; tạo/sửa/xóa mẫu chưa dùng, gửi phản hồi, từ chối dữ liệu sai và phản hồi trùng. Kiểm số dòng trước/sau seed; chỉ dùng database trong bản clone mới.

Docker tùy chọn: dùng project name chưa có tài nguyên và cổng host còn trống. Trong terminal clone đặt `API_HOST_PORT`/`WEB_PORT` phù hợp và chạy:

```powershell
docker compose -p smartcrm-bt2-c1-check config --quiet
docker compose -p smartcrm-bt2-c1-check up --build -d --wait
docker compose -p smartcrm-bt2-c1-check ps
```

Không tái sử dụng project name nếu đã có volume cần giữ; không chạy down -v. Chụp/log lại hash commit, tag, runtime, từng lệnh/exit code, HTTP, số dòng seed lặp và luồng UI. Mở URL repo ẩn danh để kiểm public.

Chỉ chuyển C1 thành PASS khi clone đúng tag remote vào thư mục trống, làm đủ README và thực sự chạy được; lỗi/thiếu bước nào phải ghi nguyên trạng, sửa rồi kiểm lại từ bản clone mới. Không lấy kết quả working tree hoặc Docker project hiện tại thay cho C1.
