/* ============================================================
   i18n.js —— 极简双语机制（zh / en）
   · 字典在文件内，无依赖；t(key, vars) 取当前语言文案
   · applyStatic(root) 扫描 DOM：data-i18n→textContent，
     data-i18n-html→innerHTML，data-i18n-ph→placeholder，
     data-i18n-title→title/aria-label
   · 语言来自 Store 存档 settings.lang（默认 zh）；缺失回退 zh
   · 必须在 store.js / app.js 之前加载；t() 内部延迟读 Store/App
   · 语言缓存在内存（C1）：t() / lang 不再每次读档；Store 的存档变更通知
     会让缓存自动失效，另有 refresh() / setLang() 两个显式入口
    · 规模（G2/S5/S6 · 2026-09-17，见《修改记录》[046]/[055]/[056]）：
      zh / en 各 **309 键**；累计删除 189 条零引用残影（含本轮移除的 `hub_*` 24 条）。
      （2026-09-23 死亡流程改版新增 3 键：`death_msg_snake` / `death_reason_snake` /
      `respawn_quote_snake`，由 game-minigames.js 的数据蛇终局失败分支引用。）
      本轮新增：V4 §8.4 三中继掩护 5 键（`death_msg_relay` + `mg_relay_title/help/time/field`）；
      V4 §11.2 穹顶托管两来源 2 键（`dome_source_honor` / `dome_source_new`）。
      AI-06 翻转跑酷（road 镜像段）新增 3 键：`hud_fall`（下落）/`hud_kbd_jump_flip`（空格/S）/
      `hud_kbd_down_flip`（W/↑），由 `game-gate-mirror.js` 的 HUD 同步取词。
      阶段5（访客索引册 → 原地二段跳）新增 4 键：`visitor_move_protocol`（技能提示第二行）、
      `dj_confirm_text` / `dj_try_hint` / `dj_assist_hint`（原地确认 / 操作提示 / 辅助提示），
      全部由 `game-index-book.js` 以 `I18N.t('键名')` 字面量取词（可被 verify-config ⑩ 统计）。
      阶段6（主档案门 → 记忆档案井）新增 1 键：`libgate_door_goal`（开门后的「走到门前」
      指引）；门口交互标签与三句对白都在 story_config（label / label_en / text / text_en）。
      （本注释与 tests/s5-content-cleanup.test.js 的字面量同源：改键数必须两处一起改。）
      `archive_transition_line`（赛道尽头 → 年鉴馆转场）由 `game-archive-transition.js` 引用。
     序章动态目标 `obj_home_investigate/find_evidence/check_wiring/read_log/enter_vr`(5) 取代 `obj_home`/`obj_short_home`，由 `objectiveTable()` 动态引用。
     E3·S1 逆流维护点 UI（`maint_*` 14 键）由 `game-oasis-maintenance.js` 引用。
     `recap_*`(19) 归 V21 待接入。`level_keys` 虽渲染路径零引用，但被
     `验证文件/verify-lint.js` 当作 KEYBINDS 文案真值，勿删。
   · 新增词条前请先确认「有引用点」——`verify-i18n` 只查「被引用的键存在」，
     查不出「键存在但无人用」。判定引用要走字面量 + 动态前缀双向扫描。
   ============================================================ */
window.I18N = (function () {
  const DICT = {
    /* ---------- 通用 / 导航 ---------- */
    zh: {
      "back": "← BACK",
      "logout": "登出",
      "toast_welcome_register": "档案建立完毕 · 欢迎你，{name}",
      "toast_welcome_login": "「{name}」，欢迎回到现实 —— 以及绿洲",
      "toast_logout": "已登出。绿洲的门随时为你敞开。",
      "toast_intro_done": "通往绿洲的门已打开 —— 三把钥匙散落其中",
      "toast_reset_settings": "设置已恢复默认",
      "toast_ach_unlock": "◈ 成就点亮 ·「{name}」",
      "toast_ending_written": "结局已写入旅程图鉴。",
      "toast_save_failed": "无法保存进度：本机存储不可用（可能是隐私模式或空间已满）。",
      "toast_clue_recorded": "已记录线索：{title}",
      "toast_clue_already_recorded": "线索已记录：{title}",
      "clue_recorded_short": "已记录",
      "save_failed_banner": "进度未能保存到本机。",
      "save_retry": "重新保存",
      "toast_save_retry_ok": "已重新保存进度。",
      "toast_save_still_failed": "仍无法保存：请检查浏览器存储权限或空间，或关闭隐私模式后重试。",
      "chapter_saved": "检查点已保存",
      "chapter_save_failed": "检查点未能保存",
      "toast_key_gained": "已获得钥匙 · {name}",

      /* ---------- 序章回响 ---------- */

      /* ---------- 登录 ---------- */
      "login_username": "玩家代号",
      "login_password": "通行密语",
      "login_username_ph": "输入你的代号",
      "login_password_ph": "输入通行密语",
      "login_remember": "记住我的登录状态",
      "login_submit": "离开现实 · 进入绿洲",
      "login_no_account": "还没有账号？",
      "login_register": "注册新玩家",
      "login_caption": "2135 年 · 叠楼区 · 断电倒计时仍在继续",
      "err_username_required": "请输入玩家代号",
      "err_password_required": "请输入通行密语",
      "err_name_taken": "该代号已被占用，换一个吧",
      "err_user_not_found": "查无此玩家，请先注册",
      "err_wrong_password": "通行密语不正确",
      "err_storage": "无法保存到本机存储（可能是隐私模式或空间已满）。",

      /* ---------- 注册 ---------- */
      "reg_heading_cn": "建立玩家档案",
      "reg_username_ph": "给自己起个代号（必填）",
      "reg_password_ph": "至少 4 位",
      "reg_password2_ph": "再输入一次",
      "reg_confirm_label": "确认密语",
      "reg_submit": "建立档案",
      "reg_to_login": "已有账号？",
      "reg_back_login": "返回登录",
      "privacy_note": "* 所有账号信息仅保存在本机浏览器（localStorage），不会上传任何服务器。",
      "err_name_required": "请填写玩家代号（我们不设默认名）",
      "err_name_short": "代号至少 2 个字符",
      "err_name_long": "代号最长 16 个字符",
      "err_pass_short": "通行密语至少 4 位",
      "err_pass_mismatch": "两次输入的密语不一致",

      /* ---------- 主菜单 ---------- */
      "menu_new": "新游戏",
      "menu_new_sub": "NEW GAME · 从头开始",
      "menu_continue": "继续旅程",
      "menu_continue_sub": "CONTINUE · 读取最近记录",
      "menu_records": "旅程图鉴",
      "menu_records_sub": "RECORDS · ENDINGS",
      "menu_settings": "设置",
      "menu_settings_sub": "SETTINGS",
      "menu_about": "制作档案",
      "menu_about_sub": "THE CREW",
  "menu_footer": "键盘操作：←→/AD 移动 · W/↑/空格 跳跃（二段跳同键）· Shift 冲刺 · E 交互 · S 下梯 · J 任务日志",
      "new_game_confirm": "确定要开始新游戏吗？当前旅程进度会被重置，已获得的成就与个人设置将保留。",

      /* ---------- 设置 ---------- */
      "set_heading_cn": "游戏设置",
      "set_master_volume": "主音量",
      "set_bgm": "背景音乐",
      "set_sfx": "音效",
      "set_text_speed": "文字显示速度",
      "set_typewriter": "打字机效果",
      "set_motion": "画面动效",
      "set_scanlines": "扫描线滤镜",
      "set_shake": "屏幕震动",
      "set_high_contrast": "高对比度文字",
      "set_skip_intro": "跳过已读背景",
      "set_fullscreen": "全屏模式",
      "set_toggle_fullscreen": "切换全屏",
      "set_reset": "恢复默认设置",
      "set_lang": "语言",
      "set_lang_zh": "中文",
      "set_lang_en": "English",
      "set_speed_slow": "慢",
      "set_speed_normal": "中",
      "set_speed_fast": "快",
      "set_confirm_reset": "确定恢复全部默认设置吗？（不影响账号与成就）",

      /* ---------- 关于 ---------- */
      "about_heading_cn": "关于我们",
      "about_intro": "我们是《绿洲遗产》开发小组。这个世界由这几个人一砖一瓦搭建。( 游戏制作不易，如有问题，还请大家多多体谅包容 )",
      "about_api": "* 新成员接入接口：编辑 <code>js/data/team.js</code> 追加一条成员数据，将头像放入 <code>assets/team/</code> 即可，无需改动页面代码。",

      /* ---------- 帮助 ---------- */
      "help_heading_cn": "行动指引",
      "help_title": "先观察，再选择；每一条路都会留下回响。",
      "help_q_continue": "如何继续？",
      "help_a_continue": "主菜单选择「继续旅程」会直接回到你上次离开的房间；新玩家从断电小屋开始，探索中自然进入绿洲。",
      "help_q_controls": "基础操作？",
  "help_a_controls": "←→/AD 移动，W/↑/空格 跳跃（二段跳同键），Shift 冲刺，E 交互，S/↓ 下梯，J 任务日志，Esc 暂停。",
      "help_q_save": "存档在哪里？",
      "help_a_save": "关键节点会自动存档；全部资料仅保存在当前浏览器。",
      "help_q_endings": "结局会被锁死吗？",
      "help_a_endings": "结局与关键终局会写入「旅程图鉴」，可随时查看；之后能重新开始旅程去体验其他结局，不会锁死。",
      "help_tip": "TIP：不要急着追终点。路标、回声和身后的人，都会说话。",

      /* ---------- 帮助角标 ---------- */
      "help_corner_aria": "打开帮助",

      /* ---------- 成就 ---------- */
      "ach_heading_cn": "旅程图鉴",
      "ach_lit": "LIT · 已点亮",
      "ach_locked": "LOCKED",
      "ach_locked_story": "LOCKED · 尚未开启",
      "ach_hint_locked": "尚未达成",
      "ach_hint_story": "在旅途中观察、选择并完成挑战。",
      "archive_heading": "发现档案",
      "archive_intro": "旅途中保存的年鉴残页、现实锚点与选择记录会出现在这里。",
      "ending_replay_heading": "结局回放",
      "dome_source_honor": "控制权来源：此前签署的第二合同优先受让权；本次为执行既有义务，而非终局自愿授权。",
      "dome_source_new": "控制权来源：终局新授权；你此前未接受任何穹顶合同。",
      "chapter_replay_heading": "章节重玩",
      "chapter_replay_hint": "以该章出生点重新进入；旅程进度与图鉴记录保留。",
      "chapter_replay_confirm": "以「{name}」的出生点重新进入？旅程进度与图鉴记录会保留。",
      "replay_close": "关闭",
      "replay_locked": "未解锁",
      "recap_heading": "旅程复盘",
      "recap_intro": "这里只汇总当前存档中实际保存的发现与选择，不补写没有发生过的经历。",
      "recap_found_title": "发现了什么",
      "recap_found_count": "已保存 {found} / {total} 项发现",
      "recap_found_almanac": "《阿诺拉克年鉴》残页 {found} / 3",
      "recap_found_reality": "现实锚点 {found} / 3",
      "recap_found_none": "这段旅程尚未保存可复盘的发现。",
      "recap_helped_title": "帮助了谁",
      "recap_helped_both": "你在翻转道路共享了回程路线，又在城堡外围留下掩护，两次都让阿尔忒弥斯保持在线。",
      "recap_helped_road": "你在翻转道路共享了回程路线，替阿尔忒弥斯引开了穹顶的遥测探针。",
      "recap_helped_maze": "你在城堡外围留下掩护，让阿尔忒弥斯保持在线。",
      "recap_helped_none": "没有保存同伴在线的记录；这只描述当前路线，不评价你的选择。",
      "recap_missed_title": "还遗漏了什么",
      "recap_missed_almanac": "仍有 {count} 张年鉴残页未记录。",
      "recap_missed_reality": "仍有 {count} 个现实锚点未查看。",
      "recap_missed_ally": "没有保留阿尔忒弥斯在线的记录；部分协议会因此缺少共同持有的证据。",
      "recap_missed_none": "关键记录已经完整；仍可重玩章节，查看其他选择造成的不同后果。",
      "recap_route_note": "共享与独占、救援与前进、接受与拒绝是互斥路线；查看另一结果需要开启新旅程。",
      "recap_scope_note": "复盘基于当前存档。结局回放展示协议正文，不会改写当时的选择。",
      "archive_recorded": "RECORDED · 已保存",
      "archive_locked_title": "未发现的档案",
      "archive_locked_text": "观察现实中的物件，并留意挑战后出现的异常记录。",
      "archive_missing": "MISSING",
      "credits_source_heading": "作品来源与改编说明",
      "credits_source_adaptation": "本作是用于课程学习与展示的非商业互动改编，不是官方授权作品。",
      "credits_source_inspiration": "世界观、绿洲、三钥竞逐及部分人物名称受《头号玩家》（Ready Player One）小说与电影启发。",
      "credits_source_original": "本项目的关卡结构、交互规则、分支对白、四协议终局与界面实现由项目组重新设计和编写。",
      "credits_source_visuals": "场景与人物图像以原创重绘或生成素材为目标；公开展示前应在素材台账中逐项标注作者、工具与来源。",
      "credits_source_unknown": "仓库中无法确认来源的素材不得标记为原创，也不得在未核实授权的情况下用于商业发布。",
      "credits_source_rights": "原作名称、角色与相关识别性概念的权利归各自权利人所有；本项目不代表其官方立场。",
      "credits_source_scope": "本说明不替代素材授权核验；发布者仍需确认所用字体、图片、音频与第三方代码的许可范围。",

      /* ---------- 章节地图 ---------- */

      /* ---------- intro ---------- */
      "intro_hint": "点击 或 按 空格/→ 继续",
      "intro_skip": "跳过背景 ✕",

      /* ---------- 任务中枢 hub ---------- */

      /* ---------- 结算 ---------- */

      /* ---------- 结算统计标签 ---------- */

      /* ---------- 暂停 ---------- */

      /* ---------- 开场宣传段（§6.1） ---------- */

      /* ---------- 隐藏死亡结局（ending-death） ---------- */

      /* ---------- 鼠标手模式 / 长街 ---------- */

      /* ---------- 关卡 footer ---------- */
  "level_keys": "←→/AD 移动 · W/↑/空格 跳跃（二段跳同键）· Shift 冲刺 · E 交互/消融 · S/↓ 下梯 · J 任务日志 · Esc 暂停",

      /* ---------- 关卡 HUD stat 键 ---------- */

      /* ---------- key1 关卡短句 ---------- */

      /* ---------- key2 关卡短句 ---------- */

      /* ---------- key3 关卡短句 ---------- */

      /* ---------- 选项按钮（关卡内） ---------- */

      /* ---------- 终局选择缺口（中文补齐） ---------- */

      /* ---------- 游戏内界面（由中英对照表生成，见 验证文件/i18n-table.js）---------- */
      "hud_key_wisdom": "智慧（铜）",
      "hud_key_process": "过程（玉）",
      "hud_key_courage": "勇气（水晶）",
      "hud_objective_prefix": "目标 · ",
      "obj_home_investigate": "调查屋内留下的线索",
      "obj_home_find_evidence": "找到另一条VR诊断依据",
      "obj_home_check_wiring": "检查旧VR的供电线路",
      "obj_home_read_log": "读取恢复的日志",
      "obj_home_enter_vr": "戴上VR，进入绿洲",
      "obj_balcony": "看看阳台上的菜园，然后回到小屋",
      "obj_library": "登顶图书馆，完成俄罗斯方块挑战；挑战后别急着走，还要解读一份记录",
      "obj_library_gate": "沿走廊前往接待台，验证邀请",
      "obj_road": "调查路牌、脚印与踏板的异常，验证你的推断",
      "obj_treasure": "在遗失索引场启动区域扫描，连通一条可通行的安全记录",
      "obj_maze": "在迷雾迷宫中找到出口",
      "obj_palace": "做出最终抉择",
      "obj_keys_all": "前往宫殿，做出最终抉择",
      "obj_default": "探索这片区域",
      "canvas_label": "绿洲游戏画面",
      /* ---------- B2：常驻短目标 + 任务日志（与上方 obj_* 长文本一一对应） ---------- */
      "obj_short_balcony": "查看阳台的菜园",
      "obj_short_library": "登顶图书馆 · 挑战 · 解读记录",
      "obj_short_library_gate": "前往接待台",
      "obj_short_road": "穿越翻转道路",
      "obj_short_treasure": "E 启动区域扫描",
      "obj_short_maze": "找到迷雾迷宫的出口",
      "obj_short_palace": "做出最终抉择",
      "obj_short_keys_all": "前往宫殿",
      "obj_short_default": "探索这片区域",
      "log_title": "任务日志",
      "log_now": "当前目标",
      "log_keys_title": "三钥进度",
      "log_clues_title": "已发现的线索",
      "log_clues_empty": "尚未记录任何线索",
      "log_hint": "按 J 或点击目标条展开 / 收起",
      "log_close": "关闭日志",
      "ctx_interact": "交互",
      "ctx_trap": "陷阱",
      "ctx_dissolve": "消融数据残骸",
      "ctx_leave": "离开",
      "ctx_magic_potion": "数据护盾",
      /* ---------- 逆流档案调查点（oasis 可选支线，改造自 E3·S1 维护点）---------- */
      "maint_optional_hint": "可选 · 身后有三处档案信号，回头逐一查看",
      "maint_scan_hold": "查看档案",
      "maint_scan_mouse": "查看",
      "maint_progress": "已查看档案 {n}/3",
      "maint_need_prev": "先查看前一处档案。",
      "maint_archived": "已查看",
      "maint_lift_use": "使用传送机",
      "maint_lift_locked": "传送机未启动",
      "maint_revisit": "三处档案已查看，传送机仍可使用。",
      "maint_point_1": "【埃尔】这些门按不同年代排列。每一扇门后，似乎都是同一个人的一段生活。",
      "maint_point_2": "【埃尔】这里曾经刻着不止一个名字。第二个位置被人磨掉了。",
      "maint_point_3": "【系统记录】校正请求：已拒绝。理由：与唯一作者记录冲突。",
      /* ---------- 发车演出（Home 戴 VR → OASIS 前）---------- */
      "race_start_line1": "神经连接完成。",
      "race_start_line2": "OASIS 接入赛道已锁定。",
      "race_start_line3": "等待发车……",
      "race_start_go": "红灯熄灭——比赛开始。",
      /* ---------- 赛道尽头 → 年鉴馆接待前厅转场 ---------- */
      "archive_transition_line": "【埃尔】赛道尽头没有奖杯……只有一扇档案门。",
      /* ---------- 阶段4·莫罗接待台 · 邀请验证（game-invite-verify.js） ---------- */
      "invite_scan_idle": "待机",
      "invite_scan_run": "扫描中…",
      "invite_scan_ok": "验证通过",
      "invite_result_continue": "继续",
      "skill_hint_shift": "恭喜你，学会了新技能：shift键加速移动",
      "skill_hint_dissolve": "恭喜你，学会了新技能：E键消融方块",
      "skill_hint_doubleJump": "恭喜你，学会了新技能：二段跳",
      /* ---------- 阶段5·访客索引册 → 原地二段跳（game-index-book.js） ---------- */
      "visitor_move_protocol": "访客移动协议已更新：跳起后，在空中再次按下跳跃键。",
      "dj_confirm_text": "二次跃迁确认",
      "dj_try_hint": "原地试试：跳起后，在空中再次按下跳跃键。",
      "dj_assist_hint": "再按一次跳跃键",
      /* ---------- 阶段6·主档案门 → 进入记忆档案井（game-archive-door.js） ---------- */
      "libgate_door_goal": "档案门已开启 —— 走到门前，按 E 进入记忆档案井。",
      /* ---------- AI-06 镜像谜题（game-gate-mirror.js） ---------- */
      "gate_mirror_checking": "前方路线仍在校验中。",
      "gate_mirror_prompt": "按 E 翻转跑道",
      "hud_jump_hint": "空格 跳跃",
      "respawn_title": "连接已暂停",
      "respawn_reason_default": "数据连接中断",
      "respawn_quote": "记录已保留，回到这关开头继续。",
      "respawn_again": "回到这关开头",
      "respawn_back_menu": "返回主菜单",
      "death_reason_debris": "被数据残骸侵蚀",
      "death_reason_ladder": "从梯子上坠落",
      "death_reason_abyss": "坠入了数据深渊",
      "death_reason_monster": "被黑暗中的怪兽抓住",
      "death_reason_blocks": "方块堆到了顶端",
      "death_reason_time": "时间耗尽",
      "death_reason_mine": "被数据地雷炸毁了连接",
      "death_reason_maze": "在迷宫中迷失了方向",
      "death_reason_crush": "被两块数据方块挤压",
      "death_msg_failed": "本次挑战未完成",
      "death_msg_minesweeper": "本次扫雷未完成，挑战进度未提交",
      "death_msg_consciousness": "数据同步已中断",
      "death_msg_relay": "三处中继全部失效，掩护失败",
      "parkour_death_default": "连接连续中断。路线记录仍在，系统将启动数据恢复流程，完成后即可继续旅程。",
      "parkour_death_continue": "进入数据恢复区",
      "parkour_death_back": "回到本关开头",
      "death_msg_snake": "本次数据重组未完成，意识未能重聚",
      "death_reason_snake": "在数据流中迷失了方向",
      "respawn_quote_snake": "意识未能重聚，返回菜单重新开始旅程。",
      "pause_title": "已暂停",
      "pause_resume": "继续游戏",
      "pause_restart": "重新开始本关",
      "pause_settings": "设置",
      "pause_quit": "返回主菜单",
      "ending_stat_keys": "钥匙 KEYS",
      "ending_stat_ach": "成就 ACHIEVEMENTS",
      "ending_stat_ending": "结局 ENDING",
      "ending_back_menu": "回到主菜单",
      "ending_default_title": "结局",
      "mg_tetris_title": "档案校验 · 第二署名",
      "mg_tetris_next": "待接入数据块",
      "mg_tetris_op_a": "A 向左移动",
      "mg_tetris_op_d": "D 向右移动",
      "mg_tetris_op_s": "S 加速向下",
      "mg_tetris_op_space": "空格 直接落地",
      "mg_tetris_op_w": "W 旋转 · R 重来",
      "mg_ms_title": "遗失索引扫描",
      "mg_ms_help": "标记删除节点，确认可通行记录 · 左键翻开 · 右键标记异常节点 · 空格翻开 · F 标记",
      "mg_ms_goal": "确认全部可通行记录后，安全记录即连通",
      "mg_relay_title": "三中继掩护",
      "mg_relay_help": "A/D 或 ←/→ 移动 · 在目标中继旁拦截脉冲 · 按住 E 修复",
      "mg_relay_time": "剩余 {n} 秒",
      "mg_relay_field": "已关闭力场 {n}/3",
      "mg_snake_title": "化身重组 · 数据索引",
      "mg_snake_desc": "引导核心索引，回收10个身份数据包。",
      "mg_snake_dead": "重组路径发生冲突。",
      "mg_snake_fail_note": "重组路径冲突。本次排列已清空，主线进度不受影响。",
      "mg_snake_retry": "R · 重新排列本次碎片",
      "mg_snake_help": "方向键 / WASD 移动 · 收集 10 个身份数据包",
      "toast_debris_dissolved": "数据残骸消融了",
      "toast_image_failed": "部分图片载入失败，已使用占位画面。",
      "menu_continue_no_save": "暂无存档，将开始新旅程",
      "back_menu_title": "回到主菜单",
      "hud_hunt": "狩猎 {n} / {total}",
      "hud_deaths": "连接中断 {n} / 3",
      "hud_shield": "数据护盾 ×{n}",
      "toast_shield_used": "数据护盾抵挡了一次攻击 · 剩余 {n}",
      "mg_tetris_lines": "已消除 {n} / {total} 行",
      "mg_tetris_body_progress": "正文恢复 {n} / {total}",
      "mg_tetris_credit_progress": "署名恢复 {n} / {total}",
      "mg_tetris_time": "校验稳定时间 {n} 秒",
      "mg_tetris_goal": "{t} 秒内恢复 {n} 行 · 第 5 行恢复正文 · 第 10 行恢复署名",
      "mg_tetris_goal_reached": "校验完成 · Enter 写回年鉴",
      "mg_tetris_milestone_title": "档案恢复 50%",
      "mg_tetris_milestone_body": "原型完成记录 · 主设计：詹姆斯·哈里迪",
      "mg_tetris_milestone_credit": "协作署名：[校验损坏]",
      "mg_tetris_milestone_continue": "正文已恢复 · 正在继续校验署名",
      "mg_ms_mines": "删除节点 {n} · 已标记 {f}",
      "mg_snake_progress": "身份数据 {n}/{total} · 重组链 {len}",
      "about_join_soon": "MORE TO JOIN",

      /* ---------- HUD 底部操作键位表 ---------- */
      "hud_move": "移动",
      "hud_jump": "跳跃",
      "hud_dash": "冲刺",
      "hud_climb": "下梯",
      "hud_fall": "下落",
      "hud_kbd_jump_flip": "空格/S",
      "hud_kbd_down_flip": "W/↑",
      "hud_interact": "交互",
      "hud_pause": "暂停",
      "hud_log": "日志",

      /* ---------- 隐藏旧标题界面（附录 A，引擎 boot 引用、正常流程不可见） ---------- */
      "legacy_start": "开始游戏",
      "legacy_continue": "继续游戏",
      "legacy_controls": "A / D 移动 · 空格 跳跃 · Shift 冲刺 · S 向下 · E 交互",
      "legacy_sub": "— 绿 洲 —",
      "legacy_quote": "\"你不是来赢的。你是来理解的。\"",
    },

    /* ============================================================
       ENGLISH
       ============================================================ */
    en: {
      "back": "← BACK",
      "logout": "Sign out",
      "toast_welcome_register": "Profile created · Welcome, {name}",
      "toast_welcome_login": "\"{name},\" welcome back to reality, and to OASIS",
      "toast_logout": "Signed out. The door of OASIS stays open for you.",
      "toast_intro_done": "The door to OASIS has opened. Three keys are scattered within.",
      "toast_reset_settings": "Settings restored to defaults.",
      "toast_ach_unlock": "◈ Achievement unlocked · \"{name}\"",
      "toast_ending_written": "Ending written to the journey records.",
      "toast_save_failed": "Could not save progress: local storage is unavailable (private mode or quota full).",
      "toast_clue_recorded": "Clue recorded: {title}",
      "toast_clue_already_recorded": "Clue already recorded: {title}",
      "clue_recorded_short": "Recorded",
      "save_failed_banner": "Progress could not be saved to this device.",
      "save_retry": "Retry save",
      "toast_save_retry_ok": "Progress saved.",
      "toast_save_still_failed": "Still unable to save: check the browser's storage permission or free space, or leave private mode and retry.",
      "chapter_saved": "Checkpoint saved",
      "chapter_save_failed": "Checkpoint not saved",
      "toast_key_gained": "KEY acquired · {name}",

      /* ---------- 序章回响 ---------- */

      /* ---------- 登录 ---------- */
      "login_username": "Player ID",
      "login_password": "Passphrase",
      "login_username_ph": "Enter your ID",
      "login_password_ph": "Enter your passphrase",
      "login_remember": "Remember my sign-in",
      "login_submit": "Leave reality · Enter OASIS",
      "login_no_account": "No account yet?",
      "login_register": "Register a new player",
      "login_caption": "2135 · Stack District · The blackout countdown continues",
      "err_username_required": "Please enter your player ID",
      "err_password_required": "Please enter your passphrase",
      "err_name_taken": "That ID is taken. Try another.",
      "err_user_not_found": "Player not found. Please register first.",
      "err_wrong_password": "Passphrase is incorrect.",
      "err_storage": "Could not save to this device's storage (private mode or storage full).",

      /* ---------- 注册 ---------- */
      "reg_heading_cn": "Create player profile",
      "reg_username_ph": "Pick an ID (required)",
      "reg_password_ph": "At least 4 characters",
      "reg_password2_ph": "Re-enter passphrase",
      "reg_confirm_label": "Confirm passphrase",
      "reg_submit": "Create profile",
      "reg_to_login": "Already have an account?",
      "reg_back_login": "Back to login",
      "privacy_note": "* All account info is stored locally in your browser (localStorage) only. Nothing is uploaded to any server.",
      "err_name_required": "Please enter a player ID (there's no default)",
      "err_name_short": "ID must be at least 2 characters",
      "err_name_long": "ID must be at most 16 characters",
      "err_pass_short": "Passphrase must be at least 4 characters",
      "err_pass_mismatch": "The two passphrases don't match",

      /* ---------- 主菜单 ---------- */
      "menu_new": "New game",
      "menu_new_sub": "NEW GAME · FRESH START",
      "menu_continue": "Continue journey",
      "menu_continue_sub": "CONTINUE · LOAD LATEST RECORD",
      "menu_records": "Journey records",
      "menu_records_sub": "RECORDS · ENDINGS",
      "menu_settings": "Settings",
      "menu_settings_sub": "SETTINGS",
      "menu_about": "The crew",
      "menu_about_sub": "THE CREW",
  "menu_footer": "Keyboard: ←→/AD Move · W/↑/Space Jump (same keys for double jump) · Shift Dash · E Interact · S Climb down · J Log",
      "new_game_confirm": "Start a new game? Your current journey progress will be reset. Unlocked achievements and personal settings are kept.",

      /* ---------- 设置 ---------- */
      "set_heading_cn": "Settings",
      "set_master_volume": "Master volume",
      "set_bgm": "Background music",
      "set_sfx": "Sound effects",
      "set_text_speed": "Text speed",
      "set_typewriter": "Typewriter effect",
      "set_motion": "Motion FX",
      "set_scanlines": "Scanlines",
      "set_shake": "Screen shake",
      "set_high_contrast": "High contrast",
      "set_skip_intro": "Skip previously read intro",
      "set_fullscreen": "Fullscreen",
      "set_toggle_fullscreen": "Toggle fullscreen",
      "set_reset": "Reset to defaults",
      "set_lang": "Language",
      "set_lang_zh": "中文",
      "set_lang_en": "English",
      "set_speed_slow": "Slow",
      "set_speed_normal": "Normal",
      "set_speed_fast": "Fast",
      "set_confirm_reset": "Reset all settings to defaults? (Accounts and achievements are not affected.)",

      /* ---------- 关于 ---------- */
      "about_heading_cn": "About us",
      "about_intro": "We are the team behind \"OASIS LEGACY\". This world was built brick by brick by these people. Later members will light up on the same \"wall\" automatically.",
      "about_api": "* To add a new member: append a row in <code>js/data/team.js</code> and drop an avatar into <code>assets/team/</code>. No page code changes needed.",
      "about_join_soon": "MORE TO JOIN",

      /* ---------- 帮助 ---------- */
      "help_heading_cn": "Field guide",
      "help_title": "Observe first, then choose. Every path leaves an echo.",
      "help_q_continue": "How do I continue?",
      "help_a_continue": "From the main menu, pick \"Continue Journey\" to return to the room you last left; new players begin in the blacked-out flat and enter OASIS naturally through exploration.",
      "help_q_controls": "Basic controls?",
  "help_a_controls": "←→/AD move, W/↑/Space jump (same keys for double jump), Shift dash, E interact, S/↓ climb down, J log, Esc pause.",
      "help_q_save": "Where are saves stored?",
      "help_a_save": "Auto-saved at key checkpoints. All data is stored in this browser only.",
      "help_q_endings": "Are endings locked?",
      "help_a_endings": "Endings and key finales are written to the Journey Records and can be reviewed anytime. You can start a new journey afterward to experience other endings; nothing is locked.",
      "help_tip": "TIP: Don't chase the finish line. Signs, echoes, and the people behind you all speak.",

      /* ---------- 帮助角标 ---------- */
      "help_corner_aria": "Open help",

      /* ---------- 成就 ---------- */
      "ach_heading_cn": "Journey records",
      "ach_lit": "LIT",
      "ach_locked": "LOCKED",
      "ach_locked_story": "LOCKED · Not yet opened",
      "ach_hint_locked": "Not yet achieved",
      "ach_hint_story": "Observe, choose, and complete challenges during the journey.",
      "archive_heading": "Discovered archive",
      "archive_intro": "Almanac fragments, reality anchors, and recorded choices from your journey appear here.",
      "ending_replay_heading": "Ending Replay",
      "dome_source_honor": "Source of control: the previously signed second-contract first-purchase rights; this ending executes an existing obligation, not a voluntary final authorization.",
      "dome_source_new": "Source of control: a new final authorization; you never accepted any Dome contract before this.",
      "chapter_replay_heading": "Chapter Replay",
      "chapter_replay_hint": "Re-enter from that chapter's starting point; journey progress and records are kept.",
      "chapter_replay_confirm": "Re-enter from the start of \"{name}\"? Progress and records are kept.",
      "replay_close": "Close",
      "replay_locked": "Locked",
      "recap_heading": "Journey Recap",
      "recap_intro": "This recap uses only discoveries and choices actually saved in the current journey. It does not invent events that never occurred.",
      "recap_found_title": "What You Found",
      "recap_found_count": "Discoveries saved: {found} / {total}",
      "recap_found_almanac": "Anorak's Almanac fragments: {found} / 3",
      "recap_found_reality": "Reality anchors: {found} / 3",
      "recap_found_none": "No recap-ready discoveries have been saved in this journey yet.",
      "recap_helped_title": "Who You Helped",
      "recap_helped_both": "You shared your return route on the Antipath route and stayed to cover her at the castle perimeter, keeping Art3mis online both times.",
      "recap_helped_road": "You shared your return route on the Antipath route and drew the Dome's telemetry probes away from Art3mis.",
      "recap_helped_maze": "You stayed to cover her at the castle perimeter, keeping Art3mis online.",
      "recap_helped_none": "No record of an online ally was saved. This describes the current route; it does not judge your choice.",
      "recap_missed_title": "What You Missed",
      "recap_missed_almanac": "{count} Almanac fragment(s) remain unrecorded.",
      "recap_missed_reality": "{count} reality anchor(s) remain unexamined.",
      "recap_missed_ally": "No record of an online ally remains; some protocols will therefore lack evidence for shared ownership.",
      "recap_missed_none": "The key records are complete. You can still replay chapters to see how other choices change their consequences.",
      "recap_route_note": "Sharing or keeping, rescuing or advancing, and accepting or refusing are mutually exclusive routes. Start a new journey to see the other outcome.",
      "recap_scope_note": "The recap reflects the current save. Ending Replay shows protocol text and does not rewrite the choice you made.",
      "archive_recorded": "RECORDED",
      "archive_locked_title": "Undiscovered record",
      "archive_locked_text": "Inspect objects in reality and watch for anomalous records after each challenge.",
      "archive_missing": "MISSING",
      "credits_source_heading": "Sources and Adaptation Notice",
      "credits_source_adaptation": "This is a non-commercial interactive adaptation made for coursework and educational presentation. It is not an officially licensed production.",
      "credits_source_inspiration": "Its world, OASIS, the three-key contest, and certain character names are inspired by the novel and film Ready Player One.",
      "credits_source_original": "The project team redesigned and wrote the level structure, interaction rules, branching dialogue, four-protocol finale, and interface implementation.",
      "credits_source_visuals": "Scene and character art is intended to use original redraws or generated assets. Before public presentation, an asset ledger should identify the creator, tool, and source for each item.",
      "credits_source_unknown": "Assets whose provenance cannot be verified must not be labeled original or used commercially without confirmed permission.",
      "credits_source_rights": "Original titles, characters, and other recognizable concepts remain the property of their respective rightsholders. This project does not represent their official position.",
      "credits_source_scope": "This notice does not replace license review. Publishers must still verify permissions for fonts, images, audio, and third-party code.",

      /* ---------- 章节地图 ---------- */

      /* ---------- intro ---------- */
      "intro_hint": "Click or press Space / → to continue",
      "intro_skip": "Skip intro ✕",

      /* ---------- 任务中枢 hub ---------- */

      /* ---------- 结算 ---------- */

      /* ---------- 暂停 ---------- */

      /* ---------- 开场宣传段（§6.1） ---------- */

      /* ---------- 隐藏死亡结局（ending-death） ---------- */

      /* ---------- 鼠标手模式 / 长街 ---------- */

      /* ---------- 关卡 footer ---------- */
  "level_keys": "←→/AD Move · W/↑/Space Jump (same keys for double jump) · Shift Dash · E Interact/Dissolve · S/↓ Climb down · J Log · Esc Pause",

      /* ---------- 关卡 HUD stat 键 ---------- */

      /* ---------- 关卡结果统计标签 & 提示 ---------- */

      /* ---------- key1 关卡短句 ---------- */

      /* ---------- key2 关卡短句 ---------- */

      /* ---------- key3 关卡短句 ---------- */

      /* ---------- 选项按钮（关卡内） ---------- */

      /* ---------- 结局缺口提示 ---------- */
/* ---------- 游戏内界面（同上）---------- */
      "hud_key_wisdom": "Wisdom (Copper)",
      "hud_key_process": "Process (Jade)",
      "hud_key_courage": "Courage (Crystal)",
      "hud_objective_prefix": "Objective · ",
      "obj_home_investigate": "Investigate the clues left in the room",
      "obj_home_find_evidence": "Find the other piece of VR diagnostic evidence",
      "obj_home_check_wiring": "Check the old VR's power circuit",
      "obj_home_read_log": "Read the recovered log",
      "obj_home_enter_vr": "Put on the VR and enter OASIS",
      "obj_balcony": "Check the garden on the balcony, then head back to the flat",
      "obj_library": "Reach the top of the library and clear the Tetris challenge. Then don't rush off: read the record it unlocks",
      "obj_library_gate": "Follow the corridor to the reception desk and verify the invitation",
      "obj_road": "Investigate the signs, footprints and treads; test your hypothesis",
      "obj_treasure": "Start an area scan in the Lost Index Field and connect one traversable safe route",
      "obj_maze": "Find the exit in the fog-shrouded maze",
      "obj_palace": "Make the final choice",
      "obj_keys_all": "Head to the palace and make the final choice",
      "obj_default": "Explore this area",
      "canvas_label": "OASIS game screen",
      /* ---------- B2：常驻短目标 + 任务日志 ---------- */
      "obj_short_balcony": "Check the balcony garden",
      "obj_short_library": "Reach the top · clear Tetris · read the record",
      "obj_short_library_gate": "Reach the reception desk",
      "obj_short_road": "Cross Antipath",
      "obj_short_treasure": "E · Start Area Scan",
      "obj_short_maze": "Find the exit of the fog maze",
      "obj_short_palace": "Make the final choice",
      "obj_short_keys_all": "Head to the palace",
      "obj_short_default": "Explore this area",
      "log_title": "Objective Log",
      "log_now": "Current objective",
      "log_keys_title": "Key progress",
      "log_clues_title": "Clues found",
      "log_clues_empty": "No clues recorded yet",
      "log_hint": "Press J or click the objective bar to open / close",
      "log_close": "Close log",
      "ctx_interact": "Interact",
      "ctx_trap": "Trap",
      "ctx_dissolve": "Dissolve data debris",
      "ctx_leave": "Leave",
      "ctx_magic_potion": "DATA SHIELD",
      /* ---------- Reverse archive notes (optional oasis branch) ---------- */
      "maint_optional_hint": "Optional · Three archive signals are behind you. Turn back and inspect each one",
      "maint_scan_hold": "Inspect the record",
      "maint_scan_mouse": "Inspect",
      "maint_progress": "Archive records {n}/3",
      "maint_need_prev": "Inspect the previous record first.",
      "maint_archived": "Inspected",
      "maint_lift_use": "Use the teleporter",
      "maint_lift_locked": "Teleporter offline",
      "maint_revisit": "All three records inspected. The teleporter remains available.",
      "maint_point_1": "[El] These doors are arranged by year. Behind each one seems to be a piece of the same life.",
      "maint_point_2": "[El] More than one name was engraved here. Someone removed the second.",
      "maint_point_3": "[System Log] Correction request rejected. Reason: conflicts with the sole-author record.",
      /* ---------- Race-start cutscene (Home VR to OASIS) ---------- */
      "race_start_line1": "Neural link established.",
      "race_start_line2": "OASIS access track locked.",
      "race_start_line3": "Stand by...",
      "race_start_go": "Lights out. The race begins.",
      "archive_transition_line": "[El] No trophy at the end of the track... only an archive door.",
      /* Stage 4 · Morrow reception desk invitation verification (game-invite-verify.js) */
      "invite_scan_idle": "Standby",
      "invite_scan_run": "Scanning…",
      "invite_scan_ok": "Verified",
      "invite_result_continue": "Continue",
      "skill_hint_shift": "New skill unlocked: Shift to dash!",
      "skill_hint_dissolve": "New skill unlocked: E to dissolve blocks!",
      "skill_hint_doubleJump": "New skill unlocked: Double Jump!",
      /* ---------- 阶段5·访客索引册 → 原地二段跳（game-index-book.js） ---------- */
      "visitor_move_protocol": "Visitor Movement Protocol updated: jump, then press Jump again while airborne.",
      "dj_confirm_text": "Second jump confirmed",
      "dj_try_hint": "Try it here: jump, then press Jump again while airborne.",
      "dj_assist_hint": "Press Jump again",
      /* ---------- 阶段6·主档案门 → 进入记忆档案井（game-archive-door.js） ---------- */
      "libgate_door_goal": "The archive door is open. Walk up to it and press E to enter the Memory Archive.",
      /* ---------- AI-06 镜像谜题（game-gate-mirror.js） ---------- */
      "gate_mirror_checking": "The route ahead is still calibrating.",
      "gate_mirror_prompt": "Press E to flip the runway",
      "hud_jump_hint": "Space to Jump",
      "respawn_title": "Connection paused",
      "respawn_reason_default": "Data connection lost",
      "respawn_quote": "Your record is preserved. Restart this level.",
      "respawn_again": "Restart this level",
      "respawn_back_menu": "Back to main menu",
      "death_reason_debris": "Eroded by data debris",
      "death_reason_ladder": "Fell from the ladder",
      "death_reason_abyss": "Plunged into the data abyss",
      "death_reason_monster": "Caught by a monster in the dark",
      "death_reason_blocks": "Blocks stacked to the top",
      "death_reason_time": "Time ran out",
      "death_reason_mine": "Connection destroyed by a data mine",
      "death_reason_maze": "Lost your way in the maze",
      "death_reason_crush": "Crushed between two blocks",
      "death_msg_failed": "Challenge not completed",
      "death_msg_minesweeper": "Minesweeper not completed; challenge progress was not submitted",
      "death_msg_consciousness": "Data synchronization interrupted",
      "death_msg_relay": "All three relays failed; the cover broke",
      "parkour_death_default": "The connection was interrupted repeatedly. Your route record remains; the system will start data recovery so the journey can continue.",
      "parkour_death_continue": "Continue · Start recovery",
      "parkour_death_back": "Restart this level",
      "death_msg_snake": "Data reassembly not completed; consciousness failed to reform",
      "death_reason_snake": "Lost your way in the data stream",
      "respawn_quote_snake": "Consciousness failed to reform. Return to the menu to begin again.",
      "pause_title": "Paused",
      "pause_resume": "Resume",
      "pause_restart": "Restart level",
      "pause_settings": "Settings",
      "pause_quit": "Back to main menu",
      "ending_stat_keys": "Keys KEYS",
      "ending_stat_ach": "Achievements ACHIEVEMENTS",
      "ending_stat_ending": "Ending ENDING",
      "ending_back_menu": "Back to main menu",
      "ending_default_title": "Ending",
      "mg_tetris_title": "ARCHIVE VERIFICATION · SECOND CREDIT",
      "mg_tetris_next": "Incoming data block",
      "mg_tetris_op_a": "A Move left",
      "mg_tetris_op_d": "D Move right",
      "mg_tetris_op_s": "S Drop faster",
      "mg_tetris_op_space": "Space Hard drop",
      "mg_tetris_op_w": "W Rotate · R Restart",
      "mg_ms_title": "LOST INDEX SCAN",
      "mg_ms_help": "Mark deletion nodes to confirm traversable records · Left-click reveal · Right-click mark · Space reveal · F mark",
      "mg_ms_goal": "Confirm every traversable record to connect the safe route",
      "mg_relay_title": "THREE-RELAY COVER",
      "mg_relay_help": "A/D or ←/→ to move · intercept the pulse beside the targeted relay · hold E to repair",
      "mg_relay_time": "{n}s left",
      "mg_relay_field": "Force fields closed {n}/3",
      "mg_snake_title": "AVATAR REASSEMBLY · DATA INDEX",
      "mg_snake_desc": "Guide the core index to recover 10 identity packets.",
      "mg_snake_dead": "Reassembly path conflict.",
      "mg_snake_fail_note": "Reassembly path conflict. This arrangement is cleared; story progress is unaffected.",
      "mg_snake_retry": "R · Rearrange this fragment set",
      "mg_snake_help": "Arrow keys / WASD to move · Collect 10 identity packets",
      "toast_debris_dissolved": "Data debris dissolved.",
      "toast_image_failed": "Some images failed to load; placeholder art is shown.",
      "menu_continue_no_save": "No save found; a new journey will begin",
      "back_menu_title": "Back to main menu",
      "hud_hunt": "Hunt {n} / {total}",
      "hud_deaths": "Interruptions {n} / 3",
      "hud_shield": "Data Shield ×{n}",
      "toast_shield_used": "Data Shield blocked a hit · {n} left",
      "mg_tetris_lines": "Lines cleared {n} / {total}",
      "mg_tetris_body_progress": "Body restored {n} / {total}",
      "mg_tetris_credit_progress": "Credit restored {n} / {total}",
      "mg_tetris_time": "Verification stable for {n}s",
      "mg_tetris_goal": "Restore {n} lines in {t}s · body at 5 · full credit at 10",
      "mg_tetris_goal_reached": "Verification complete · Enter to write back",
      "mg_tetris_milestone_title": "ARCHIVE 50% RESTORED",
      "mg_tetris_milestone_body": "Prototype completion record · Lead design: James Halliday",
      "mg_tetris_milestone_credit": "Co-credit: [CHECKSUM DAMAGED]",
      "mg_tetris_milestone_continue": "Body restored · continuing credit verification",
      "mg_ms_mines": "Deletion nodes {n} · Marked {f}",
      "mg_snake_progress": "Identity data {n}/{total} · Chain {len}",

      /* ---------- HUD 底部操作键位表 ---------- */
      "hud_move": "Move",
      "hud_jump": "Jump",
      "hud_dash": "Dash",
      "hud_climb": "Climb down",
      "hud_fall": "Fall",
      "hud_kbd_jump_flip": "Space/S",
      "hud_kbd_down_flip": "W/↑",
      "hud_interact": "Interact",
      "hud_pause": "Pause",
      "hud_log": "Log",

      /* ---------- 隐藏旧标题界面（附录 A） ---------- */
      "legacy_start": "Start Game",
      "legacy_continue": "Continue Game",
      "legacy_controls": "A / D Move · Space Jump · Shift Dash · S Down · E Interact",
      "legacy_sub": "· O A S I S ·",
      "legacy_quote": "\"You're not here to win. You're here to understand.\"",
    }
  };

  /* ---------- 语言缓存（C1） ----------
     t() 在渲染热路径上被高频调用（含 canvas 每帧绘制），而语言要读存档才能拿到。
     故缓存到内存，并订阅 Store 的「存档变更」通知自动失效：任何写入路径
     （设置页、恢复默认、引擎落盘、测试桩）都不需要记得手动刷新。 */
  let langCache = null;   // null = 尚未读档 / 已失效
  let hooked = false;

  function readLang() {
    try {
      const s = Store.getSave(App.user()).settings;
      return (s && s.lang) || "zh";
    } catch (e) { return "zh"; }
  }
  /* 懒订阅：本文件早于 store.js 加载，故不能在模块初始化时就去订阅 */
  function ensureHooked() {
    if (hooked) return;
    if (!window.Store || typeof Store.onSaveChanged !== "function") return;
    hooked = true;
    Store.onSaveChanged(() => { langCache = null; });
  }
  function lang() {
    ensureHooked();
    if (langCache == null) langCache = readLang();
    return langCache;
  }
  /* 显式重读：登录 / 登出 / 切屏等兜底点用（不改变取值口径） */
  function refresh() { langCache = readLang(); return langCache; }
  /* 调用方已知新语言（设置页刚写入）时直接落缓存，省一次读档 */
  function setLang(value) { langCache = value === "en" ? "en" : "zh"; return langCache; }

  function t(key, vars) {
    const l = lang();
    let s = (DICT[l] && DICT[l][key]) || (DICT.zh && DICT.zh[key]) || key;
    if (vars) {
      Object.keys(vars).forEach(k => {
        s = s.replace(new RegExp("\\{" + k + "\\}", "g"), vars[k]);
      });
    }
    return s;
  }

  function applyStatic(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-i18n]").forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    scope.querySelectorAll("[data-i18n-html]").forEach(el => {
      el.innerHTML = t(el.dataset.i18nHtml);
    });
    scope.querySelectorAll("[data-i18n-ph]").forEach(el => {
      el.placeholder = t(el.dataset.i18nPh);
    });
    scope.querySelectorAll("[data-i18n-title]").forEach(el => {
      const v = t(el.dataset.i18nTitle);
      el.title = v;
      if (el.hasAttribute("aria-label")) el.setAttribute("aria-label", v);
    });
    document.documentElement.lang = lang();
  }

  return { t, applyStatic, refresh, setLang, get lang() { return lang(); } };
})();
