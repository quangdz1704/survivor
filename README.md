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
- Nhân vật rig 8 lớp; Slime nhảy, Dơi vỗ cánh riêng, Bộ xương/Orc/Golem có rig chân tay, phản ứng trúng đòn và chết.
- Kiếm phép, Hỏa cầu, Thiên lôi: mỗi vũ khí 6 cấp. Sáu kỹ năng thụ động, ba lựa chọn ngẫu nhiên hợp lệ mỗi lần lên cấp.
- Năm đợt quái tăng dần, Golem 1500 HP với vùng cảnh báo nện đất; kết quả thắng/thua, chơi lại và về trại.
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
- `/dev/load-verification.html`: cảnh nhân tạo đo tải 150 quái; không phải lượt chơi cân bằng.

Các trang QA không nằm trong bản production. Xem [clip quái](docs/screenshots/07-enemy-animation.webp), [kiểm thử và giới hạn](docs/TESTING.md), [asset](docs/ASSET_MANIFEST.md) và [triển khai Vercel](docs/DEPLOYMENT.md). Chưa triển khai production. Chưa xác nhận FPS/touch trên thiết bị iOS/Android thật; nhân vật vẫn dùng hình ba phần tư phía trước và lật ngang, chưa có artwork nhìn từ lưng.
