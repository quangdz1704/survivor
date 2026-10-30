# Survivor Mini — thiết kế trò chơi

An, người giữ rừng với áo xanh ngọc và khăn cam, bảo vệ Rừng thì thầm khỏi các cư dân bị phép thuật quấy nhiễu. Đồ họa cartoon HD, giao diện tiếng Việt, màn hình dọc; không cần tài khoản hay mạng sau lần cache đầu tiên.

## Vòng chơi

Vào rừng → né quái bằng joystick nổi hoặc bàn phím → vũ khí tự tìm mục tiêu → nhặt XP và hồi máu → tạm dừng để chọn một trong tối đa ba kỹ năng → tăng sức mạnh qua năm đợt quái → cảnh báo Golem ở 5:00 → hạ boss để thắng. Đồng hồ tiếp tục sau 5:00 cho đến khi boss hoặc người chơi bị hạ.

Kiếm phép có sẵn. Lên cấp có thể mở Hỏa cầu và Thiên lôi, nâng vũ khí tối đa cấp 6 hoặc chọn sáu nội tại: sát thương, tốc đánh, tốc chạy, hút XP, chí mạng, HP. Luôn có một vũ khí chưa sở hữu trong lựa chọn nếu còn. Không lặp thẻ hoặc đưa thẻ đã đạt giới hạn. XP dư được giữ lại; mỗi cấp cần một lần chọn. Khi mọi nâng cấp đã tối đa, lên cấp hồi máu thay cho lựa chọn rỗng.

Quái gồm Slime nhảy chậm, Dơi bay nhanh, Bộ xương cân bằng, Orc chậm nhưng bền, và Golem. Va chạm gây sát thương với khoảng miễn thương 0,8 giây. Golem báo vùng nện đất trước khoảng một giây; vùng cố định để người chơi né được. Khi còn dưới 35% HP, boss di chuyển nhanh hơn.

## Tiến trình ngoài trận

Kết quả trả vàng theo thời gian, số quái hạ và thắng boss. Vàng mua HP, sát thương cơ bản và tốc chạy, tối đa 10 cấp mỗi loại. Thưởng một kết quả được ghi một lần bằng mã lượt chơi. Cửa hàng chờ lưu xong trước khi cho đóng để lượt kế tiếp nhận đúng nâng cấp.

IndexedDB lưu vàng, nâng cấp, cài đặt, thời gian tốt nhất, số quái hạ tốt nhất, tổng lượt và số chiến thắng. Không tiếp tục trận đang dở sau khi tải lại. Trở về trại từ màn pause bỏ lượt hiện tại và không nhận thưởng. Lưu cục bộ không chống chỉnh sửa và không đồng bộ giữa thiết bị.

## Trình bày và điều khiển

Rừng 2400×2400 theo seed với đường đất, hoa, đá, bụi, cây và phế tích. Đồ trang trí không chặn đường. Quái sinh ngoài camera. Cây che gần An sẽ mờ; bóng, thứ tự chiều sâu và camera bám giúp đọc vị trí. Joystick hiện ngay điểm chạm, ẩn khi thả/cancel/blur. HUD hiển thị HP, XP, cấp, giờ, số hạ, đợt, vũ khí và boss.

Menu, pause, cài đặt, cửa hàng, thành tích, lên cấp và kết quả là React. Chuyển tab/ẩn trình duyệt tự pause; người chơi chủ động tiếp tục. Âm thanh khởi tạo sau thao tác người dùng, nhạc và SFX có mức âm riêng; rung phụ thuộc khả năng trình duyệt.
