import type { MapId } from "./campaign";

export const STORY_PAGES = [
  {
    chapter: "LỜI MỞ ĐẦU · ÁNH SÁNG CUỐI CÙNG",
    title: "Đêm khu rừng im tiếng",
    body: "Trái Tim Rừng từng giữ bình yên cho muôn loài. Một đêm, ánh sáng ấy vụt tắt. Sương đen tràn qua những lối mòn, biến các hộ vệ cổ xưa thành kẻ canh giữ bóng tối.",
    quote: "Vẫn còn một đốm sáng đang gọi tên bạn…",
  },
  {
    chapter: "HAI NGƯỜI BẠN · MỘT LỜI HỨA",
    title: "Người mang đốm sáng",
    body: "Kang, người giữ rừng, và Dun, pháp sư sương, tìm thấy một mầm sáng còn sót lại. Họ hứa sẽ đưa nó trở về Trái Tim Rừng. Mỗi tinh thể nhặt được sẽ giúp người mang mầm sáng mạnh hơn.",
    quote: "Chúng ta nhỏ bé, nhưng sẽ không để khu rừng chìm vào quên lãng.",
  },
  {
    chapter: "BA PHONG ẤN · HÀNH TRÌNH BẮT ĐẦU",
    title: "Đánh thức Trái Tim Rừng",
    body: "Vượt Rừng thì thầm, Vực tro tàn và Thành băng vĩnh cửu. Giải phóng ba phong ấn khỏi Golem, Hỏa long và Băng vệ để thắp lại Trái Tim Rừng. Trước hết, hãy học cách bảo vệ mầm sáng.",
    quote: "Hành trình lớn bắt đầu từ một bước chân nhỏ.",
  },
];
export const CHAPTER_ENDINGS: Record<MapId, string> = {
  forest:
    "Golem gục xuống, phong ấn Rễ Cây bừng sáng. Mầm sáng chỉ về Vực tro tàn: Hỏa long vẫn đang giữ ngọn lửa thứ hai.",
  ashlands:
    "Hỏa long hạ cánh giữa tro nguội. Phong ấn Ngọn Lửa trở về với mầm sáng. Chỉ còn tiếng gọi từ Thành băng vĩnh cửu.",
  glacier:
    "Băng vệ buông vũ khí, phong ấn Sương Giá tan băng. Ba ánh sáng hòa vào nhau, Trái Tim Rừng lại đập. Bình minh trở về; những thử thách khắc nghiệt hơn vẫn đợi người giữ rừng.",
};
