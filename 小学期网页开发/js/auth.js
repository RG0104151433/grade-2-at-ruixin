/* ============================================================
   auth.js —— 注册 / 登录 / 登出（全部本地，无默认用户名）
   ============================================================ */
window.Auth = (function () {

  function setMsg(el, text, ok) {
    el.textContent = text || "";
    el.classList.toggle("ok", !!ok);
  }

  function normalizeName(v) {
    return (v || "").trim().replace(/\s+/g, "");
  }

  function init() {
    /* ---------- 注册 ---------- */
    const rForm = document.getElementById("form-register");
    const rMsg = document.getElementById("register-msg");
    rForm.addEventListener("submit", e => {
      e.preventDefault();
      const name = normalizeName(document.getElementById("reg-username").value);
      const p1 = document.getElementById("reg-password").value;
      const p2 = document.getElementById("reg-password2").value;

      if (!name) return setMsg(rMsg, I18N.t("err_name_required"));
      if (name.length < 2) return setMsg(rMsg, I18N.t("err_name_short"));
      if (name.length > 16) return setMsg(rMsg, I18N.t("err_name_long"));
      if (!p1 || p1.length < 4) return setMsg(rMsg, I18N.t("err_pass_short"));
      if (p1 !== p2) return setMsg(rMsg, I18N.t("err_pass_mismatch"));

      const r = Store.createUser(name, p1);
      if (!r.ok) { Audio2.error(); return setMsg(rMsg, I18N.t(r.error)); }

      /* 注册即自动登录，并点亮「初次苏醒」。会话写入失败同样要如实提示，
         否则会出现「注册成功但登录态没保存」的假成功。 */
      if (!Store.setSession(name, true)) {
        Audio2.error();
        return setMsg(rMsg, I18N.t("err_storage"));
      }
      document.getElementById("menu-username").textContent = name;
      rForm.reset();
      setMsg(rMsg, "");
      Audio2.success();
      App.go("screen-menu");
      App.unlockAchievement("first-light");
      App.toast(I18N.t("toast_welcome_register", { name }));
    });

    /* ---------- 登录 ---------- */
    const lForm = document.getElementById("form-login");
    const lMsg = document.getElementById("login-msg");
    lForm.addEventListener("submit", e => {
      e.preventDefault();
      const name = normalizeName(document.getElementById("login-username").value);
      const pw = document.getElementById("login-password").value;
      if (!name) return setMsg(lMsg, I18N.t("err_username_required"));
      if (!pw) return setMsg(lMsg, I18N.t("err_password_required"));

      const r = Store.verify(name, pw);
      if (!r.ok) { Audio2.error(); return setMsg(lMsg, I18N.t(r.error)); }

      if (!Store.setSession(name, document.getElementById("login-remember").checked)) {
        Audio2.error();
        return setMsg(lMsg, I18N.t("err_storage"));
      }
      document.getElementById("menu-username").textContent = name;
      setMsg(lMsg, "");
      lForm.reset();
      Audio2.success();
      App.go("screen-menu");
      App.toast(I18N.t("toast_welcome_login", { name }));
    });

    /* ---------- 登出 ---------- */
    document.getElementById("btn-logout").addEventListener("click", () => {
      // 先以【当前账号】落盘并清理运行态（终止小游戏/对白/事件链、停掉后台循环），
      // 再清会话。这样账号 A 的跑酷死亡计数等运行态不会被账号 B 继承；
      // 顺序不可颠倒——清会话后 currentUser() 变访客，persist() 会写进访客档。
      if (window.game && typeof window.game.leaveGame === "function") {
        window.game.leaveGame("screen-login");
      } else {
        App.go("screen-login");
      }
      Store.clearSession();
      App.toast(I18N.t("toast_logout"));
    });
  }

  return { init };
})();
