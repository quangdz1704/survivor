# Survivor Mini

Game sinh tồn cartoon tiếng Việt, ưu tiên màn hình dọc. Phaser 3 + React + TypeScript + Vite + Tailwind + Zustand, chạy hoàn toàn ở frontend.

## Chạy tại máy

```sh
npm ci
npm run dev
```

Mở http://127.0.0.1:5173. Dùng Node.js 22.14+.

Chạm bất kỳ đâu trong vùng chơi rồi kéo để điều khiển joystick nổi; thả tay để dừng. Máy tính dùng WASD/phím mũi tên, ESC tạm dừng. Vũ khí tự đánh. Nhặt tinh thể XP, chọn kỹ năng khi lên cấp, sống sót đến phút thứ 5 và hạ Golem để chiến thắng.

## Đã triển khai

- Rừng 2400×2400 theo seed, cây mờ khi che nhân vật, camera mượt và artwork cartoon nguyên bản.
- Chọn Kang hoặc Dun ở menu; lưu lựa chọn, chỉ số và vũ khí khởi đầu riêng. Kang dùng rig 8 lớp; Dun dùng các khung hình nguyên người để giữ tỷ lệ và tránh lộ khớp; Slime nhảy, Dơi vỗ cánh riêng, Bộ xương/Orc/Golem có rig chân tay, phản ứng trúng đòn và chết.
- Ba tiến hóa: Kiếm trận (Kiếm phép 6 + Nhịp chiến đấu 2), Bão tuyết (Băng tinh 6 + Lời gọi tinh tú 2), Lốc lá (Lá xoáy 6 + Bước chân gió 2). Có thẻ chọn, công thức/tiến độ và huy hiệu HUD riêng; tiến hóa chỉ giữ trong lượt hiện tại.
- Năm vũ khí: Kiếm phép, Hỏa cầu, Thiên lôi, Băng tinh làm chậm và Lá xoáy bay trở về; mỗi vũ khí 6 cấp. Sáu kỹ năng thụ động, ba lựa chọn ngẫu nhiên hợp lệ mỗi lần lên cấp.
- Hai mini-boss ở phút 1/3: Slime vương nổ vòng có cảnh báo và Đội trưởng Orc lao theo hướng cố định. Mỗi con rơi rương chọn 1 trong 3 bảo vật, không trùng món đã có; 6 bảo vật tạo cách phối riêng với vũ khí/tiến hóa. Xem lại bảo vật trong màn tạm dừng.
- Năm đợt quái tăng dần, Golem 1500 HP với vùng cảnh báo và đòn nổ gồm chớp lửa, sóng ép, bụi, đá văng cùng âm trầm; kết quả thắng/thua, chơi lại và về trại.
- Vàng, cửa hàng nâng cấp vĩnh viễn, thành tích và cài đặt lưu bằng IndexedDB. Có chế độ lưu tạm nếu trình duyệt chặn storage.
- Nhạc menu/game và SFX tổng hợp tại máy sau thao tác người chơi; chỉnh âm lượng, hiệu ứng, độ nhạy và rung.
- PWA với icon, service worker, cache offline và đề nghị cập nhật ở menu; không tự tải lại giữa trận.
- Pool quái/đạn/XP/hiệu ứng, lưới không gian, HUD cập nhật 10Hz, tối đa 150 quái.

```sh
npm test
npm run lint
npm run typecheck
npm run build
npm run preview
```

PWA chỉ bật trong bản production/preview. Cần tải online lần đầu và chờ cache hoàn tất trước khi dùng offline. Save theo origin của trình duyệt; đổi hostname/cổng sẽ có hồ sơ riêng.

## Trang QA khi chạy dev

- `/dev/animation-preview.html`: đứng/đi/chạy của nhân vật.
- `/dev/enemy-animation.html`: chuyển động của cả năm loại quái.
- `/dev/run-verification.html`: bot chạy engine thật qua thắng/thua, kiểm tra pause và thưởng/lưu. Dùng IndexedDB QA riêng.
- `/dev/treasure.html`: cảnh QA thủ lĩnh, thẻ bảo vật và 22 kiểm tra tích hợp; có đặt sẵn thời gian/chỉ số.
- `/dev/load-verification.html`: cảnh nhân tạo đo tải 150 quái; không phải lượt chơi cân bằng.

Các trang QA không nằm trong bản production. Xem [clip quái](docs/screenshots/07-enemy-animation.webp), [kiểm thử và giới hạn](docs/TESTING.md), [asset](docs/ASSET_MANIFEST.md) và [triển khai Vercel](docs/DEPLOYMENT.md). Người dùng đã triển khai bản main lên Vercel và phản hồi chơi trên điện thoại ổn. Bản mini-boss và bảo vật 1.3 đã hoàn thành và commit tại local trên nhánh `feature/elites-and-relics`, chưa push hay cập nhật production. Chưa đo FPS trên thiết bị iOS/Android thật; nhân vật vẫn dùng hình ba phần tư phía trước và lật ngang, chưa có artwork nhìn từ lưng.

Bấm tên nhân vật ở menu để đổi Kang/Dun. Kang có 100 HP và Kiếm phép; Dun có 85 HP, chạy nhanh hơn 5%, hút XP xa hơn 25% và khởi đầu với Băng tinh. Tất cả nhân vật/vũ khí đều mở sẵn; vàng và nâng cấp ở trại được dùng chung. Chi tiết phiên bản mới: [nội dung và kiểm thử](docs/CONTENT_EXPANSION_PLAN.md).
