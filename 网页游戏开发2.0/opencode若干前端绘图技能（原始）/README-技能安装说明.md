# OpenCode 技能包安装说明

本目录已按 OpenCode 官方 SKILL.md 规范整理好三套开源技能包：

| 技能包 | 来源仓库 | 技能数 |
|---|---|---|
| GSAP Skills | https://github.com/greensock/gsap-skills | 8 |
| Remotion Skills | https://github.com/remotion-dev/skills | 12 |
| HyperFrames | https://github.com/heygen-com/hyperframes | 21 |

技能文件位于 `./.opencode/skills/<name>/SKILL.md`，frontmatter 仅含 OpenCode 识别的字段
（name/description/license/compatibility/metadata），name 与目录名一致且满足
`^[a-z0-9]+(-[a-z0-9]+)*$`，description 均在 1–1024 字符内。

## 让 OpenCode 加载这些技能

### 方式一：项目级（当前文件夹内直接生效）

在**本文件夹内**启动 OpenCode（cwd 位于本目录或子目录），OpenCode 会从当前目录向上
遍历并加载 `.opencode/skills/*/SKILL.md`，无需任何额外操作。

配合权限配置：已提供 `opencode.json`，将全部技能设置为 `allow`（立即加载）。

### 方式二：全局级（所有项目可用）

把技能目录复制到用户全局技能目录：

```bash
mkdir -p ~/.config/opencode/skills
cp -r ./.opencode/skills/* ~/.config/opencode/skills/
```

也可放到以下任一全局位置：`~/.claude/skills/`、`~/.agents/skills/`。

### 方式三：单项目手工放置

在目标的 git 仓库根目录（或 cwd 向上能到达的任意父目录）创建 `.opencode/skills/`，
把需要的技能文件夹拷进去即可，例如：

```bash
mkdir -p <项目>/.opencode/skills
cp -r ./.opencode/skills/gsap-core <项目>/.opencode/skills/
```

## 权限控制（可选）

默认技能立即加载。如果希望某些技能在加载前询问用户，在 `opencode.json` 的
`permission.skill` 中用 `ask`；不希望暴露给代理则用 `deny`。支持通配符：

```json
{
  "permission": {
    "skill": {
      "*": "allow",
      "experimental-*": "ask"
    }
  }
}
```

## 验证是否生效

1. 在 OpenCode 会话中查看可用技能清单，应能看到 `gsap-*`、`remotion-*`、`hyperframes*`
   等技能及其 description。
2. 直接说“用 GSAP 技能给这个页面加滚动动画”或“用 hyperframes 把这段 HTML 渲染成视频”，
   OpenCode 应能加载对应 SKILL.md。

## 常见问题

- **技能没出现**：确认 SKILL.md 文件名全部大写；frontmatter 包含 name 和 description；
  技能名称在所有扫描位置唯一；没有在权限里设为 `deny`。
- **本文件夹不是 git 仓库**：项目级扫描从当前工作目录开始向上遍历到 git 工作树根目录，
  本目录没有 git 根，因此只对“从本目录启动”的会话生效；要全局使用请用方式二。
- **更新技能**：重新从上方仓库拉取技能目录并覆盖即可，或直接用各仓库的
  `npx skills add <repo>` 安装最新版（本目录为手工打包版）。