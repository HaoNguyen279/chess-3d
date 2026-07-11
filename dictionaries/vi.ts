import { en } from './en';

export const vi: typeof en = {
  // ── Lobby / Layout ──
  lobby: {
    brand: "Chess3D ♕",
    nav_play: "Chơi",
    nav_play_ai: "Chơi với AI",
    nav_leaderboard: "Bảng xếp hạng",
    nav_learn: "Học",
    nav_watch: "Xem",
    nav_news: "Tin tức",
    nav_social: "Cộng đồng",
    nav_settings: "Cài đặt",
    donate: "Donate",
    donate_heart: "❤️",
    // User
    user_elo: "ELO {elo}",
    // Welcome
    welcome_title: "Chào mừng trở lại, Cao thủ",
    welcome_subtitle: "Đấu trường đang chờ đòn công phá tiếp theo của bạn.",
    // Mode selection
    select_mode: "Chọn chế độ",
    bullet: "CHỚP NHOÁNG",
    blitz: "CHỚP",
    rapid: "NHANH",
    time_1min: "1 ph",
    time_1_1: "1 | 1",
    time_2_1: "2 | 1",
    time_3min: "3 ph",
    time_3_2: "3 | 2",
    time_5min: "5 ph",
    time_5_5: "5 | 5",
    time_10min: "10 ph",
    time_15_10: "15 | 10",
    // Action buttons
    create_room: "Tạo phòng",
    find_room: "Tìm phòng",
    play_ai: "Chơi với AI",
    offline_2p: "2 người 1 máy",
    random_puzzle: "Câu đố ngẫu nhiên",
    play_now: "CHƠI NGAY (Matchmaking)",
    mode_label: "Chế độ: {mode}",
    // Sidebar promo
    grand_prix: "Grand Prix Chớp",
    arena_starts: "Đấu trường mở sau 45p. Chỉ dành cho cao thủ ELO.",
    register_now: "Đăng ký ngay",
    // Footer
    copyright: "© 2026 Chess3D",
    footer_language: "Ngôn ngữ",
    footer_help: "Trợ giúp",
    footer_about: "Giới thiệu",
    // Create Room modal
    create_room_title: "Tạo Phòng Mới",
    room_name_label: "Tên Phòng",
    room_name_placeholder: "Nhập tên phòng...",
    password_label: "Mật Khẩu",
    password_placeholder: "Để trống nếu muốn tạo phòng công cộng...",
    cancel: "Hủy",
    create: "Tạo phòng",
    // Search / Join modals
    room_list_title: "Danh sách phòng chờ",
    join_by_code: "Vào bằng mã phòng (Room Code)",
    room_code_placeholder: "Nhập mã phòng (vd: -Ny...)",
    join_now: "Vào nhanh",
    no_rooms: "Chưa có phòng nào đang chờ.",
    create_one: "Hãy tạo một phòng mới!",
    players_count: "Số người chơi: {count}/2",
    enter_room: "Vào phòng",
    // Join room modal
    join_room_title: "Vào Phòng",
    joining_room: "Bạn đang tham gia phòng:",
    room_password: "Mật Khẩu Phòng",
    password_input_placeholder: "Nhập mật khẩu...",
    join_play: "Vào chơi",
    // No room found modal
    no_room_title: "Không tìm thấy phòng",
    no_room_desc: "Không tìm thấy phòng với chế độ {mode}. Bạn có muốn tự tạo một phòng mới không?",
    // Donate modal
    donate_title: "Donate Us",
    donate_qr_alt: "Mã QR Donate",
    donate_message: "Xin 5k ăn mì ik",
    // Toast / Alerts (VI text)
    alert_enter_room_name: "Vui lòng nhập tên phòng",
    alert_enter_password: "Vui lòng nhập mật khẩu",
    alert_room_not_found: "Phòng không tồn tại",
    alert_wrong_password: "Mật khẩu không đúng",
    alert_room_full: "Phòng đã đủ người",
    alert_join_error: "Đã xảy ra lỗi khi vào phòng.",
    alert_create_error: "Không thể tạo phòng.",
    // Feature coming soon
    coming_soon_tutorials: "Tính năng hướng dẫn sắp ra mắt!",
    coming_soon_news: "Tin tức sắp ra mắt!",
    coming_soon_social: "Cộng đồng sắp ra mắt!",
    coming_soon_settings: "Cài đặt sắp ra mắt!",
    // Misc
    popular_opponent: "Đối thủ phổ biến",
    quick_match: "Ghép trận nhanh",
  },

  // ── Game / In-game ──
  game: {
    move_history: "Lịch sử nước đi",
    no_moves_yet: "Chưa có nước đi nào",
    captured_pieces: "Quân đã bị bắt",
    white_captured: "Trắng bị bắt",
    black_captured: "Đen bị bắt",
    none: "Không",
    white: "Trắng",
    black: "Đen",
    check_label: "CHIẾU",
  },

  // ── Game Header ──
  game_header: {
    self_label: "Bạn ({color})",
    opponent_label: "Đối thủ ({color})",
    ai_bot_label: "AI Bot ({elo} ELO)",
    offline_self: "Trắng (Bạn)",
    offline_opponent: "Đen (Đối thủ)",
  },

  // ── Game Controls ──
  game_controls: {
    back_hub: "← Sảnh",
    default_view: "Góc nhìn mặc định",
    undo: "Hoàn tác",
    reset: "Chơi lại",
    quit: "Thoát",
    leave_match: "Thoát trận",
  },

  // ── Game Over ──
  game_over: {
    title_default: "Kết thúc",
    title_victory: "Chiến thắng!",
    title_defeat: "Thất bại!",
    title_draw: "Hòa!",
    title_white_wins: "Trắng thắng!",
    title_black_wins: "Đen thắng!",
    reasons: {
      checkmate: "Chiếu hết",
      stalemate: "Hết nước đi (Stalemate)",
      draw: "Hòa",
      timeout: "Hết giờ",
      opponent_resigned: "Đối thủ rời phòng",
    },
    vs_bot_win: "Bạn đã đánh bại {botName}",
    vs_bot_lose: "{botName} đã đánh bại bạn",
    vs_bot_draw: "Ván cờ hòa với {botName}",
    vs_online_win: "Bạn đã đánh bại đối thủ",
    vs_online_lose: "Đối thủ đã đánh bại bạn",
    vs_online_draw: "Ván cờ kết thúc với tỷ số hòa",
    offline_white_wins: "Trắng giành chiến thắng!",
    offline_black_wins: "Đen giành chiến thắng!",
    offline_draw: "Ván cờ hòa!",
    back_to_lobby: "Thoát trận",
  },

  // ── Puzzle ──
  puzzle: {
    mode: "CHẾ ĐỘ CÂU ĐỐ",
    loading: "Đang tải...",
    fetching: "ĐANG TẢI CÂU ĐỐ...",
    wrong_title: "Sai rồi!",
    wrong_desc: "Đó không phải là nước đi chính xác.",
    wrong_try: "Hãy thử lại.",
    try_again: "Thử lại",
    solved_title: "Hoàn thành!",
    solved_desc: "Tính toán xuất sắc.",
    next_puzzle: "Câu đố tiếp",
    quit_lobby: "Về sảnh",
    quit: "Thoát",
    skip: "Bỏ qua",
  },

  // ── Play with AI ──
  play_ai: {
    title: "Chọn đối thủ của bạn",
    subtitle: "Chọn một bot AI để thách đấu. Độ khó từ cơ bản đến siêu đại kiện tướng. Chuẩn bị chiến đấu.",
    filter_all: "Tất cả",
    filter_beginner: "Cơ bản",
    filter_intermediate: "Trung cấp",
    filter_master: "Cao thủ",
    play: "Đấu",
    locked: "Khóa",
    elo_label: "{elo} Elo",
    popular: "Đối thủ phổ biến",
    bot_descriptions: {
      bot_1: "Vẫn đang học luật chơi. Đi các nước ngẫu nhiên và thường bỏ lỡ các đòn chiến thuật đơn giản.",
      bot_2: "Biết cách di chuyển quân nhưng hiếm khi phát hiện ra các mối đe dọa.",
      bot_3: "Thích tấn công nhanh nhưng để lại nhiều quân không được bảo vệ.",
      bot_4: "Một người chơi giải trí, thỉnh thoảng có những nước đi thông minh.",
      bot_5: "Hiểu các khai cuộc cơ bản và các mẫu chiếu hết đơn giản.",
      bot_6: "Một người mới chơi vững vàng, tránh được những sai lầm hiển nhiên.",
      bot_7: "Tìm kiếm cơ hội chiến thuật và coi trọng các quân linh hoạt.",
      bot_8: "Một người chơi kỷ luật với lối chơi tấn công và phòng thủ cân bằng.",
      bot_9: "Hiểu biết vị thế tốt với khả năng tính toán chính xác.",
      bot_10: "Kiên nhẫn và chính xác. Trừng phạt những sai lầm bất cẩn một cách nhất quán.",
      bot_11: "Trình độ chuyên gia với kỹ thuật tàn cuộc xuất sắc.",
      bot_12: "Kỳ thủ mạnh mẽ, hiếm khi bỏ lỡ các nguồn lực chiến thuật.",
      bot_13: "Chính xác đẳng cấp. Mỗi nước đi đều được tính toán với hiệu quả tàn nhẫn.",
    },
  },

  // ── Leaderboard ──
  leaderboard: {
    loading: "ĐANG TẢI BẢNG XẾP HẠNG...",
    title: "BẢNG XẾP HẠNG TOÀN CẦU",
    subtitle: "Những kỳ thủ hàng đầu từ khắp nơi trên thế giới",
    rank: "Hạng",
    player: "Kỳ thủ",
    country: "Quốc gia",
    rating: "ELO",
    title_col: "Danh hiệu",
    unknown: "Không xác định",
  },

  // ── Live Streamers ──
  live: {
    title: "Đấu trường Trực tiếp",
    live_now: "ĐANG TRỰC TIẾP",
    subtitle: "Xem các đại kiện tướng và cộng đồng Cờ đang chơi ngay bây giờ.",
    streamers: "Streamer",
    loading_broadcasts: "Đang tìm các buổi phát trực tiếp...",
    no_streamers: "Hiện không có streamer nào đang phát trực tiếp. Quay lại sau nhé!",
    loading_stream: "Đang tải Stream...",
    queued: "Đang chờ",
    unavailable: "Không khả dụng",
    live: "TRỰC TIẾP",
    unknown_platform: "Nền tảng không xác định",
    view_profile: "Xem hồ sơ",
  },

  // ── Loading Asset ──
  loading_asset: {
    loading: "Đang tải tài nguyên... {progress}%",
  },

  // ── Online / Room ──
  online: {
    waiting: "Đang chờ đối thủ...",
    copy: "Sao chép",
    opponent_connected: "🎉 Đối thủ đã kết nối! Trận đấu bắt đầu.",
    opponent_disconnected: "Đối thủ đã ngắt kết nối",
    quit_lobby: "Về sảnh",
    // Room code
    room_code_title: "Mã Phòng",
    room_code_hint: "Chia sẻ mã này với bạn của bạn:",
  },

  // ── Common ──
  common: {
    yes: "Có",
    no: "Không",
    close: "Đóng",
    confirm: "Xác nhận",
  },
};
