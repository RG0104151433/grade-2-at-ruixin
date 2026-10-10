/* ============================================================
   成员数据接口（关于我们）
   —— 上传相关信息和图片后，直接在数组里追加/修改即可，
      页面会自动以统一卡片形式渲染，无需改动任何 HTML/逻辑代码。
   字段说明：
     name  姓名/代号
     role  职务（英文小字，金色光效）
     bio   一句话介绍
     avatar 头像路径（把图片放进 image/ 后写文件名即可；留空显示占位剪影）
   预留了 5 个成员槽位；新成员在数组末尾继续追加即可自动流出。
   ============================================================ */
window.TEAM_MEMBERS = [
  {
    name: "李佳泽",
    name_en: "Li Jiaze",
    role: "DIRECTOR · 策划 & Writer · 剧本 & Tester · 测试",
    role_en: "DIRECTOR · Game Design & Writer · Script & Tester",
    bio: "北京理工大学大数据全英文班在读。\n兴趣爱好：平时喜欢看书，看动漫，打游戏（王者荣耀），喜欢观察植物，认识许多花草。王者荣耀主打一个大司命玩家，有想一起玩的可以找我。体育方面，会点乒乓球、羽毛球，不过可能比较菜。\n学习经历：高中喜欢理科，尤其喜欢物理和数学，参加了湖南省四大学科竞赛（主要是可以去长沙玩，还可以过夜），混了个物理省二。高中升大学的暑假接触了计算机，感觉也挺有意思的。\n至今没有什么项目经验，在游戏设计方面也是第一次尝试，感觉对我是很有挑战，也希望在这次项目中收获一段独特回忆。",
    bio_en: "Sophomore at Beijing Institute of Technology, Data Science & Big Data (English-taught program).\nInterests: I enjoy reading, watching anime, and gaming (Honor of Kings). I also like observing plants and can name quite a few flowers and herbs. In Honor of Kings I mainly play Da Siming; hit me up if you want to team up. For sports, I can do a bit of table tennis and badminton, though I'm probably not very good.\nAcademic background: In high school I loved science, especially physics and math. I took part in Hunan Province's four major subject competitions (mainly because it meant a trip to Changsha with an overnight stay) and managed to get a provincial second prize in physics. During the summer between high school and college I got into computers and found it pretty fascinating.\nI have no prior project experience to speak of, and game design is a first for me too. It feels like a real challenge, but I hope to come away from this project with a unique memory.",
    avatar: "成员3.jpg",
  },
  {
    name: "陈正林",
    name_en: "Chen Zhenglin",
    role: "Audio/Music · 视频剪辑",
    role_en: "Audio/Music",
    bio: "北京理工大学数据科学与大数据技术全英班大二在读。\n我的爱好比较丰富，闲暇时间我喜欢弹吉他，沉浸在旋律里放松自己，也常常听歌，不同风格的音乐总能给我带来很多情绪共鸣。运动方面，我热爱乒乓球与篮球，打球不仅可以锻炼身体，也能在对抗协作中收获快乐。空余的时候，我也会约上同学一起玩和平精英，在游戏里互相配合，享受组队游玩的乐趣。",
    bio_en: "Sophomore at Beijing Institute of Technology, majoring in Data Science & Big Data (English-taught program).\nI have a wide range of hobbies. In my free time I love playing guitar; losing myself in melodies is how I unwind. I also listen to a lot of music, and different genres always resonate with me emotionally. On the sports side, I'm into table tennis and basketball. Playing keeps me fit, and the teamwork brings its own kind of joy. When I have downtime, I'll team up with classmates for a round of Game for Peace, coordinating in-game and just enjoying the fun of playing together.",
    avatar: "成员2.jpg",
  },
  {
    name: "董雯涵",
    name_en: "Dong Wenhan",
    role: "UI Design/Art · 美术",
    role_en: "UI Design/Art",
    bio: "Hi！本人是 OASIS 的 UI 设计师兼美术，游戏整套视觉相关内容基本都由我独立完成：敲定整体画风，制作界面、按钮图标、弹窗，产出各类美术素材。\n负责的工作简单来说就是思考画面好不好看，和考虑界面布局能不能让玩家看得明白、操作顺手，调整画风和排版。\n算是第一次体验游戏视觉创作方面的内容，希望能用画面把故事里的 OASIS 世界带给大家，让大家拥有舒服又有沉浸感的游玩体验。",
    bio_en: "Hi! I'm the UI designer and artist for OASIS. Pretty much everything visual in this game is done by me: setting the overall art style, building the interface, buttons, icons, and pop-ups, and producing all kinds of art assets.\nMy job, put simply, is making things look good and making sure the layout is clear and intuitive for players, then fine-tuning the art direction and typography accordingly.\nThis is my first time working on game visuals. I hope to bring the OASIS world from the story to life through art, and give everyone a comfortable, immersive experience.",
    avatar: "成员1.png",
  },
  {
    name: "高睿懿",
    name_en: "Gao Ruiyi",
    role: "PROGRAMMER · 程序",
    role_en: "PROGRAMMER",
    bio: "一个普通的北理工学生，对编程保有热情，但对系统的程序开发缺乏经验；学习工科，但也喜欢历史哲学。喜欢看足球，是个多年的利物浦球迷（YNWA！）；也时不时去游泳，但是各种体育都比较平庸。不管是音乐还是文学都有比较广的兴趣，但都是随缘看感觉。\n编程确实是一个很有意思的事情，写代码、开发、将思路一点点变为现实是一个很吸引人的过程，很愿意和大家一起交流！",
    bio_en: "Just an ordinary BIT student who's passionate about programming but lacks experience in full-scale software development. I study engineering, but I also love history and philosophy. I enjoy watching football and have been a Liverpool fan for years (YNWA!). I go swimming from time to time, though I'm pretty average at every sport. My interests in music and literature are broad, but I mostly go with the flow.\nProgramming is genuinely fascinating. Writing code, building things, and turning ideas into reality bit by bit is a captivating process. Always happy to chat and exchange ideas with everyone!",
    avatar: "成员4.png",
  },
  {
    name: "江汶谕",
    name_en: "Jiang Wenyu",
    role: "WRITER · 文案 & CIO · 提交作业",
    role_en: "WRITER & CIO",
    bio: "我是本组游戏的 Writer，负责《绿洲 OASIS》的剧情架构与叙事文本。从世界观搭建到三关哲学内核，再到最终结局的情感落点，以及完整故事脉络。选取2135年为背景，塑造了绿洲创始人这一核心角色，通过\"三把钥匙、三重考验\"的递进结构，完成了\"智慧—过程—勇气\"的哲学叙事链条。我撰写了全部通关对话、两段跑动过渡剧情及四协议终局，并将\"后退一步才是前进\"等哲学内核融入玩法，使故事与机制紧密咬合。我希望玩家通关后记住的不只是操作，而是那句——\"绿洲只是地图，你才是脚步。\"",
    bio_en: "I'm the Writer for this game, responsible for the narrative architecture and story text of OASIS LEGACY. My work spans worldbuilding, the philosophical core of each of the three stages, the emotional landing of the final endings, and the complete story arc. I chose 2135 as the setting and shaped the founder of OASIS as the central character, building a progressive structure of \"three keys, three trials\" that completes a philosophical narrative chain of \"Wisdom, Process, Courage.\" I wrote all the level-clear dialogue, two running transition sequences, and the four-protocol finale, weaving philosophical cores like \"stepping back is moving forward\" into the gameplay so that story and mechanics interlock tightly. What I hope players remember after finishing isn't just the controls, but this line: \"OASIS is only the map; you are the footsteps.\"",
    avatar: "成员5.jpg",
  },
  // 后续加入的成员在下方追加，例如：
  // { name: "新成员", role: "QA · 测试", role_en: "QA · Testing", bio: "……", bio_en: "……", avatar: "xin.png" },
];
