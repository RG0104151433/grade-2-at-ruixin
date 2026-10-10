/* ============================================================
   成就数据接口
   type: "story" 剧情成就（由后续关卡通过 GameAPI 解锁）
         "system" 系统成就（注册/设置等自动解锁）
   解锁方式（留给后续开发的接口）：
     window.App.unlockAchievement("lost-one")
   ============================================================ */
window.ACHIEVEMENTS = [
  /* ---- 系统成就 ---- */
  {
    id: "first-light", type: "system", icon: "✦",
    name: "初次苏醒", en: "AWAKENING",
    desc: "建立玩家档案，第一次踏入这个世界。",
    desc_en: "Create a player profile and step into this world for the first time.",
  },
  {
    id: "settings-master", type: "system", icon: "⚙",
    name: "设置达人", en: "TWEAKER",
    desc: "在设置界面调整任意一项参数。",
    desc_en: "Adjust any parameter in the settings screen.",
  },

  /* ---- 剧情成就 ---- */
  { id: "three-keys", type: "story", icon: "🗝", name: "集齐三钥", en: "THREE KEYS", hint: "让三把钥匙在同一段旅程中亮起。", hint_en: "Bring all three keys to light in one journey.", desc: "集齐智慧、过程、勇气三把钥匙，打开终焉之门。", desc_en: "Gather the keys of Wisdom, Process, and Courage to open the Gate of Finale." },
  { id: "ending-e1", type: "story", icon: "☀", name: "共同持有", en: "HELD IN COMMON", hint: "在终焉处签署一份关于共同责任的协议。", hint_en: "At the finale, sign an agreement built on shared responsibility.", desc: "签署玩家公约，让规则、审计与维护权由玩家共同持有。", desc_en: "Sign the Player Charter so players hold rules, audits, and maintenance in common." },
  { id: "ending-e2", type: "story", icon: "◇", name: "穹顶托管", en: "DOME CUSTODIANSHIP", hint: "回应穹顶提出的最终托管方案。", hint_en: "Answer the Dome's final custodianship proposal.", desc: "把绿洲根权限与玩家数据交由穹顶集团托管。", desc_en: "Place OASIS root access and player data under Dome Corporation custodianship." },
  { id: "ending-e3", type: "story", icon: "⌁", name: "公共能源", en: "PUBLIC ENERGY", hint: "在终焉处重新思考能源应当照亮哪里。", hint_en: "At the finale, reconsider where the system's energy should shine.", desc: "关闭绿洲根权限，把服务器能源转入现实公共供能。", desc_en: "Close OASIS root access and redirect its server power to public utilities in reality." },
  { id: "ending-e4", type: "story", icon: "♛", name: "个人继承", en: "PERSONAL INHERITANCE", hint: "独自接下根权限与随之而来的责任。", hint_en: "Accept root access and its consequences alone.", desc: "独自继承财富与绿洲控制权，并承担唯一持有人的全部责任。", desc_en: "Inherit the fortune and control of OASIS alone, carrying every responsibility of its sole holder." },
  { id: "runner-flawless", type: "story", icon: "➤", name: "无伤通行", en: "FLAWLESS RUN", hint: "保持连接稳定，抵达终焉。", hint_en: "Keep your connection stable all the way to the finale.", desc: "全程零死亡，顺利通过所有关卡与挑战。", desc_en: "Clear the entire journey and every challenge without dying once." },
  { id: "lost-one", type: "story", icon: "○", name: "迷失者", en: "THE LOST", hint: "在绿洲入口经历反复中断。", hint_en: "Experience repeated interruptions at the OASIS entrance.", desc: "在绿洲入口连续坠亡三次。", desc_en: "Fall three times in a row at the OASIS entrance." },
  { id: "data-restored", type: "story", icon: "⚡", name: "闪电般归来", en: "LIGHTNING RETURN", hint: "在数据恢复流程中找回全部信息包。", hint_en: "Recover every packet during the data restoration sequence.", desc: "在数据洪流中找回属于自己的那一部分，闪电般归来。", desc_en: "Find your own fragment in the data flood and return like lightning." },
  { id: "learner", type: "story", icon: "🎓", name: "学习者", en: "THE LEARNER", hint: "找齐三种能保护自己的旅途技能。", hint_en: "Find all three journey skills that can keep you safe.", desc: "学习三个技能，在绿洲世界中保全自己。", desc_en: "Learn all three skills to keep yourself safe in OASIS." },
  { id: "hunter", type: "story", icon: "⌖", name: "狩猎者", en: "HUNTER", hint: "观察怪兽与场景陷阱之间的关系。", hint_en: "Observe how monsters and environmental traps interact.", desc: "将所有怪兽引入陷阱逐一消灭。", desc_en: "Lure all the monsters into traps and eliminate them one by one." },
  { id: "block-master", type: "story", icon: "▦", name: "方块大师", en: "BLOCK MASTER", hint: "在限时校验结束前把恢复的记录推到 10 行。", hint_en: "Push the restored record to 10 lines before the timed verification ends.", desc: "在 120 秒结束时消除 10 行，完整恢复共同署名。", desc_en: "Clear 10 lines by the end of the 120-second verification." },
  { id: "magic-potion", type: "story", icon: "◈", name: "数据护盾", en: "DATA SHIELD", hint: "在数据保险库完成安全格校验。", hint_en: "Complete the safe-cell verification in the data vault.", desc: "通过扫雷挑战，获得三层数据护盾。", desc_en: "Win the Minesweeper challenge to obtain a three-charge Data Shield." },
  { id: "deal-reject", type: "story", icon: "⊘", name: "拒绝契约", en: "REJECTED THE DEAL", hint: "面对穹顶报价时，保留自己的授权。", hint_en: "Keep your authorization when the Dome makes an offer.", desc: "拒绝穹顶集团的交易，守住自己的线索。", desc_en: "Refuse the Dome Corporation's deal and keep your own clues." },
  { id: "almanac-full", type: "story", icon: "▤", name: "年鉴全收集", en: "ALMANAC COMPLETE", hint: "保存三段被系统遗漏的创始人记录。", hint_en: "Preserve three founder records the system left behind.", desc: "集齐《阿诺拉克年鉴》三张残页，拼出完整的往事。", desc_en: "Collect all three fragments of Anorak's Almanac and piece the past together." },
];
