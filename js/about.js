/* ============================================================
   about.js —— 「关于我们」五人卡片墙
   数据接口：js/data/team.js 的 window.TEAM_MEMBERS
   上传信息/图片后追加或修改数据，即自动以统一形式流出。
   ============================================================ */
window.AboutUI = (function () {
  const wall = () => document.getElementById("team-wall");

  function cardHTML(m) {
    const en = window.I18N && I18N.lang === "en";
    const name = en ? (m.name_en || m.name) : m.name;
    const role = en ? (m.role_en || m.role) : m.role;
    const bio = en ? (m.bio_en || m.bio) : (m.bio || "");
    const avatar = m.avatar
      ? `<div class="team-avatar"><img src="image/${Util.esc(m.avatar)}" alt="${Util.esc(m.name)}"></div>`
      : `<div class="team-avatar">◍</div>`;
    return `
      <div class="team-card">
        ${avatar}
        <div class="team-name">${Util.esc(name)}</div>
        <div class="team-role">${Util.esc(role)}</div>
        <div class="team-bio">${Util.esc(bio)}</div>
      </div>`;
  }

  function render() {
    const list = window.TEAM_MEMBERS || [];
    let html = list.map(cardHTML).join("");
    /* 统一样式的「虚位以待」接口槽位 */
    html += `
      <div class="team-card join-soon" title="Edit js/data/team.js to add a new member">
        <span class="plus">＋</span>
        <span style="font-size:11px;">${Util.esc(I18N.t('about_join_soon'))}</span>
      </div>`;
    wall().innerHTML = html;
  }

  function init() {
    App.onEnter("screen-about", render);
  }

  return { init, render };
})();
