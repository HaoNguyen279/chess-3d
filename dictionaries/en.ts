export const en = {
  // ── Lobby / Layout ──
  lobby: {
    brand: "Chess3D ♕",
    nav_play: "Play",
    nav_play_ai: "Play with AI",
    nav_leaderboard: "Leaderboard",
    nav_learn: "Learn",
    nav_watch: "Watch",
    nav_news: "News",
    nav_social: "Social",
    nav_settings: "Settings",
    donate: "Donate us",
    donate_heart: "❤️",
    // User
    user_elo: "ELO {elo}",
    // Welcome
    welcome_title: "Welcome Back, Grandmaster",
    welcome_subtitle: "The arena awaits your next masterstroke.",
    // Mode selection
    select_mode: "Select mode",
    bullet: "BULLET",
    blitz: "BLITZ",
    rapid: "RAPID",
    time_1min: "1 min",
    time_1_1: "1 | 1",
    time_2_1: "2 | 1",
    time_3min: "3 min",
    time_3_2: "3 | 2",
    time_5min: "5 min",
    time_5_5: "5 | 5",
    time_10min: "10 min",
    time_15_10: "15 | 10",
    // Action buttons
    create_room: "Create Room",
    find_room: "Find Room",
    play_ai: "Play with AI",
    offline_2p: "1 Device 2 Players",
    random_puzzle: "Random Puzzle",
    play_now: "PLAY NOW (Matchmaking)",
    mode_label: "Mode: {mode}",
    // Sidebar promo
    grand_prix: "Grand Prix Blitz",
    arena_starts: "Arena starts in 45m. Top ELO competitors only.",
    register_now: "Register Now",
    // Footer
    copyright: "© 2026 Chess3D",
    footer_language: "Language",
    footer_help: "Help",
    footer_about: "About",
    // Create Room modal
    create_room_title: "Create New Room",
    room_name_label: "Room Name",
    room_name_placeholder: "Enter room name...",
    password_label: "Password",
    password_placeholder: "Leave empty for public room...",
    cancel: "Cancel",
    create: "Create",
    // Search / Join modals
    room_list_title: "Available Rooms",
    join_by_code: "Join by Room Code",
    room_code_placeholder: "Enter room code (e.g. -Ny...)",
    join_now: "Join",
    no_rooms: "No rooms waiting yet.",
    create_one: "Create a new room!",
    players_count: "Players: {count}/2",
    enter_room: "Enter",
    // Join room modal
    join_room_title: "Join Room",
    joining_room: "You are joining room:",
    room_password: "Room Password",
    password_input_placeholder: "Enter password...",
    join_play: "Play",
    // No room found modal
    no_room_title: "No room found",
    no_room_desc: "No room found with selected game mode {mode}. Create a new one with this mode?",
    // Donate modal
    donate_title: "Donate Us",
    donate_qr_alt: "Donate QR Code",
    donate_message: "Buy me a coffee ☕",
    // Toast / Alerts (EN versions)
    alert_enter_room_name: "Please enter a room name",
    alert_enter_password: "Please enter a password",
    alert_room_not_found: "Room does not exist",
    alert_wrong_password: "Incorrect password",
    alert_room_full: "Room is already full",
    alert_join_error: "An error occurred while joining the room.",
    alert_create_error: "Unable to create room.",
    // Feature coming soon
    coming_soon_tutorials: "Tutorials coming soon!",
    coming_soon_news: "News coming soon!",
    coming_soon_social: "Social hub coming soon!",
    coming_soon_settings: "Settings coming soon!",
    // Misc
    popular_opponent: "Popular Opponent",
    quick_match: "Quick Match",
  },

  // ── Game / In-game ──
  game: {
    move_history: "Move History",
    no_moves_yet: "No moves yet",
    captured_pieces: "Captured Pieces",
    white_captured: "White captured",
    black_captured: "Black captured",
    none: "None",
    white: "White",
    black: "Black",
    check_label: "CHECK",
  },

  // ── Game Header ──
  game_header: {
    self_label: "You ({color})",
    opponent_label: "Opponent ({color})",
    ai_bot_label: "AI Bot ({elo} ELO)",
    offline_self: "White (You)",
    offline_opponent: "Black (Opponent)",
  },

  // ── Game Controls ──
  game_controls: {
    back_hub: "← Hub",
    default_view: "Default View",
    undo: "Undo",
    reset: "Reset",
    quit: "Quit",
    leave_match: "Leave Match",
  },

  // ── Game Over ──
  game_over: {
    title_default: "Game Over",
    title_victory: "Victory!",
    title_defeat: "Defeat!",
    title_draw: "Draw!",
    title_white_wins: "White Wins!",
    title_black_wins: "Black Wins!",
    reasons: {
      checkmate: "Checkmate",
      stalemate: "Stalemate",
      draw: "Draw",
      timeout: "Timeout",
      opponent_resigned: "Opponent resigned",
    },
    vs_bot_win: "You defeated {botName}",
    vs_bot_lose: "{botName} defeated you",
    vs_bot_draw: "Draw with {botName}",
    vs_online_win: "You defeated your opponent",
    vs_online_lose: "Your opponent defeated you",
    vs_online_draw: "The game ended in a draw",
    offline_white_wins: "White wins!",
    offline_black_wins: "Black wins!",
    offline_draw: "Draw!",
    back_to_lobby: "Back to Lobby",
  },

  // ── Puzzle ──
  puzzle: {
    mode: "PUZZLE MODE",
    loading: "Loading...",
    fetching: "FETCHING PUZZLE...",
    wrong_title: "Wrong Move!",
    wrong_desc: "That is not the correct solution.",
    wrong_try: "Please try again.",
    try_again: "Try Again",
    solved_title: "Puzzle Solved!",
    solved_desc: "Excellent calculation.",
    next_puzzle: "Next Puzzle",
    quit_lobby: "Quit to Lobby",
    quit: "Quit",
    skip: "Skip Puzzle",
  },

  // ── Play with AI ──
  play_ai: {
    title: "Choose Your Opponent",
    subtitle: "Select an AI bot to challenge. Difficulty ranges from absolute beginner to super-grandmaster engine levels. Prepare for combat.",
    filter_all: "All",
    filter_beginner: "Beginner",
    filter_intermediate: "Intermediate",
    filter_master: "Master",
    play: "Play",
    locked: "Locked",
    elo_label: "{elo} Elo",
    popular: "Popular Opponent",
    bot_descriptions: {
      bot_1: "Still learning the rules. Makes random moves and often misses simple tactics.",
      bot_2: "Knows how the pieces move but rarely spots threats.",
      bot_3: "Enjoys quick attacks but leaves many pieces undefended.",
      bot_4: "A casual player who occasionally finds clever moves.",
      bot_5: "Understands basic openings and simple checkmate patterns.",
      bot_6: "A solid club beginner who avoids obvious mistakes.",
      bot_7: "Looks for tactical opportunities and values active pieces.",
      bot_8: "A disciplined player with balanced attacking and defensive play.",
      bot_9: "Strong positional understanding with accurate calculations.",
      bot_10: "Patient and precise. Punishes careless mistakes consistently.",
      bot_11: "Expert-level play with excellent endgame technique.",
      bot_12: "Master-strength player who rarely misses tactical resources.",
      bot_13: "Elite-level precision. Every move is calculated with ruthless efficiency.",
    },
  },

  // ── Leaderboard ──
  leaderboard: {
    loading: "LOADING LEADERBOARD...",
    title: "GLOBAL RANKINGS",
    subtitle: "Top players from around the world in Daily Chess",
    rank: "Rank",
    player: "Player",
    country: "Country",
    rating: "Rating",
    title_col: "Title",
    unknown: "Unknown",
  },

  // ── Live Streamers ──
  live: {
    title: "Live Arena",
    live_now: "LIVE NOW",
    subtitle: "Watch top Grandmasters and the Chess community play right now.",
    streamers: "Streamers",
    loading_broadcasts: "Locating active broadcasts...",
    no_streamers: "No streamers are live right now. Check back later!",
    loading_stream: "Loading Stream...",
    queued: "Queued",
    unavailable: "Preview Unavailable",
    live: "LIVE",
    unknown_platform: "Unknown Platform",
    view_profile: "View Profile",
  },

  // ── Loading Asset ──
  loading_asset: {
    loading: "Loading assets... {progress}%",
  },

  // ── Online / Room ──
  online: {
    waiting: "Waiting for opponent...",
    copy: "Copy",
    opponent_connected: "🎉 Opponent connected! Game starts now.",
    opponent_disconnected: "Opponent Disconnected",
    quit_lobby: "Quit to Lobby",
    // Room code
    room_code_title: "Room Code",
    room_code_hint: "Share this code with your friend:",
  },

  // ── Common ──
  common: {
    yes: "Yes",
    no: "No",
    close: "Close",
    confirm: "Confirm",
  },
};
