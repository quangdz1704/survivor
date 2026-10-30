# Survivor Mini — thiết kế trò chơi

Kang, người giữ rừng với áo xanh ngọc/khăn cam, và Dun, pháp sư tóc bạc với áo tím/khăn xanh băng, bảo vệ Rừng thì thầm khỏi các cư dân bị phép thuật quấy nhiễu. Đồ họa cartoon HD, giao diện tiếng Việt, màn hình dọc; không cần tài khoản hay mạng sau lần cache đầu tiên.

## Vòng chơi

Vào rừng → né quái bằng joystick nổi hoặc bàn phím → vũ khí tự tìm mục tiêu → nhặt XP và hồi máu → tạm dừng để chọn một trong tối đa ba kỹ năng → tăng sức mạnh qua năm đợt quái → cảnh báo Golem ở 5:00 → hạ boss để thắng. Đồng hồ tiếp tục sau 5:00 cho đến khi boss hoặc người chơi bị hạ.

Chọn nhân vật tại trại: Kang cân bằng (100 HP, 180 tốc độ, 60 hút XP) bắt đầu bằng Kiếm phép; Dun ít máu nhưng linh hoạt (85 HP, 189 tốc độ, 75 hút XP) bắt đầu bằng Băng tinh. Lên cấp có thể mở cả năm vũ khí gồm Kiếm phép, Hỏa cầu, Thiên lôi, Băng tinh và Lá xoáy, nâng vũ khí tối đa cấp 6 hoặc chọn sáu nội tại: sát thương, tốc đánh, tốc chạy, hút XP, chí mạng, HP. Luôn có một vũ khí chưa sở hữu trong lựa chọn nếu còn. Không lặp thẻ hoặc đưa thẻ đã đạt giới hạn. XP dư được giữ lại; mỗi cấp cần một lần chọn. Khi mọi nâng cấp đã tối đa, lên cấp hồi máu thay cho lựa chọn rỗng.

Quái gồm Slime nhảy chậm, Dơi bay nhanh, Bộ xương cân bằng, Orc chậm nhưng bền, và Golem. Va chạm gây sát thương với khoảng miễn thương 0,8 giây. Golem báo vùng nện đất trước khoảng một giây; vùng cố định để người chơi né được. Khi còn dưới 35% HP, boss di chuyển nhanh hơn.

## Tiến trình ngoài trận

Kết quả trả vàng theo thời gian, số quái hạ và thắng boss. Vàng mua HP, sát thương cơ bản và tốc chạy, tối đa 10 cấp mỗi loại. Thưởng một kết quả được ghi một lần bằng mã lượt chơi. Cửa hàng chờ lưu xong trước khi cho đóng để lượt kế tiếp nhận đúng nâng cấp.

IndexedDB lưu vàng, nâng cấp, cài đặt, thời gian tốt nhất, số quái hạ tốt nhất, tổng lượt và số chiến thắng. Không tiếp tục trận đang dở sau khi tải lại. Trở về trại từ màn pause bỏ lượt hiện tại và không nhận thưởng. Lưu cục bộ không chống chỉnh sửa và không đồng bộ giữa thiết bị.

## Trình bày và điều khiển

Rừng 2400×2400 theo seed với đường đất, hoa, đá, bụi, cây và phế tích. Đồ trang trí không chặn đường. Quái sinh ngoài camera. Cây che gần Kang sẽ mờ; bóng, thứ tự chiều sâu và camera bám giúp đọc vị trí. Joystick hiện ngay điểm chạm, ẩn khi thả/cancel/blur. HUD hiển thị HP, XP, cấp, giờ, số hạ, đợt, vũ khí và boss.

Menu, pause, cài đặt, cửa hàng, thành tích, lên cấp và kết quả là React. Chuyển tab/ẩn trình duyệt tự pause; người chơi chủ động tiếp tục. Âm thanh khởi tạo sau thao tác người dùng, nhạc và SFX có mức âm riêng; rung phụ thuộc khả năng trình duyệt.

## Băng tinh và Lá xoáy

Băng tinh bắn thẳng, làm chậm có thời hạn và hiện màu xanh băng trên quái; nhiều lần trúng chỉ làm mới hiệu ứng, không nhân chồng. Boss chỉ nhận nửa cường độ chậm và 70% thời gian. Lá xoáy bay ra 0,48 giây rồi tìm về người chơi đang di chuyển. Mỗi mục tiêu chỉ nhận sát thương một lần trong một chuyến bay; khi hết ngân sách xuyên, lá vẫn bay về nhưng không gây thêm sát thương. Cả hai dùng pool đạn chung và dừng theo pause/chọn cấp.


## Tiến hóa vũ khí / 1.2

Kiếm phép6 + Nhịp chiến đấu2 mở Kiếm trận; Băng tinh6 + Lời gọi tinh tú2 mở Bão tuyết; Lá xoáy6 + Bước chân gió2 mở Lốc lá. Đủ nguyên liệu sẽ có ít nhất một thẻ tiến hóa trong lần lên cấp kế tiếp; người chơi phải chọn thẻ. Vũ khí và kỹ năng không bị tiêu hao, vũ khí cơ bản vẫn giữ cấp6; dạng tiến hóa thay cách tấn công. Mỗi dạng chỉ chọn một lần mỗi lượt và được xóa khi bắt đầu lượt mới, không ghi vào hồ sơ vĩnh viễn.

Ba lựa chọn ưu tiên một tiến hóa hợp lệ, một vũ khí chưa có nếu còn, và một hướng build: nâng vũ khí vừa được chọn gần nhất hoặc kỹ năng còn thiếu khi vũ khí đã cấp6. Những ô còn lại bốc từ các nâng cấp hợp lệ. Người chơi chỉ tập trung vào vũ khí khởi đầu có thể tiến hóa sau8 lần chọn. Với Lá xoáy, mở vũ khí mới cho đến khi thấy Lá rồi tập trung nâng Lá sẽ đạt tiến hóa trong tối đa12 lần chọn. Công thức/tiến độ nằm trong phần mở rộng ở màn lên cấp; cẩm nang tại trại có công thức tĩnh. HUD đổi biểu tượng và gắn dấu✦ khi tiến hóa.
