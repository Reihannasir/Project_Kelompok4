export function collectDom() {
  return {
    // nav/view
    navItems: Array.from(document.querySelectorAll(".nav__item")),
    views: Array.from(document.querySelectorAll(".view")),
    appNav: document.getElementById("appNav"),
    pageTitle: document.getElementById("pageTitle"),
    pageSubtitle: document.getElementById("pageSubtitle"),

    quickViews: Array.from(document.querySelectorAll("[data-quick-view]")),

    // top
    clock: document.getElementById("clock"),
    btnExport: document.getElementById("btnExport"),
    btnLogout: document.getElementById("btnLogout"),
    btnThemeToggle: document.getElementById("btnThemeToggle"),

    // sidebar status
    connBadge: document.getElementById("connBadge"),
    lastUpdate: document.getElementById("lastUpdate"),

    // KPI
    kpiTotalKg: document.getElementById("kpiTotalKg"),
    kpiTotalEvents: document.getElementById("kpiTotalEvents"),
    kpiBinsAttention: document.getElementById("kpiBinsAttention"),
    kpiAlerts: document.getElementById("kpiAlerts"),

    // dashboard widgets
    binsContainer: document.getElementById("binsContainer"),
    alertsContainer: document.getElementById("alertsContainer"),
    alertsEmpty: document.getElementById("alertsEmpty"),
    eventsTbody: document.getElementById("eventsTbody"),
    btnResetBins: document.getElementById("btnResetBins"),
    btnAckAll: document.getElementById("btnAckAll"),
    btnPause: document.getElementById("btnPause"),

    // history
    historyForm: document.getElementById("historyForm"),
    historyRange: document.getElementById("historyRange"),
    historyCategory: document.getElementById("historyCategory"),
    histTotalKg: document.getElementById("histTotalKg"),
    histTotalEvents: document.getElementById("histTotalEvents"),
    historyTbody: document.getElementById("historyTbody"),

    // KPI meta
    dailyTargetLabel: document.getElementById("dailyTargetLabel"),

    // settings
    settingsForm: document.getElementById("settingsForm"),
    themeDay: document.getElementById("themeDay"),
    themeNight: document.getElementById("themeNight"),
    capAlmost: document.getElementById("capAlmost"),
    capFull: document.getElementById("capFull"),
    gasEnabled: document.getElementById("gasEnabled"),
    gasThreshold: document.getElementById("gasThreshold"),
    dailyTarget: document.getElementById("dailyTarget"),
    maxEventsTable: document.getElementById("maxEventsTable"),
    btnSettingsReset: document.getElementById("btnSettingsReset"),
    settingsStatus: document.getElementById("settingsStatus"),

    // account
    accountForm: document.getElementById("accountForm"),
    accountCurrentUser: document.getElementById("accountCurrentUser"),
    accountUsernameNew: document.getElementById("accountUsernameNew"),
    accountPasswordCurrent: document.getElementById("accountPasswordCurrent"),
    accountPasswordNew: document.getElementById("accountPasswordNew"),
    accountPasswordConfirm: document.getElementById("accountPasswordConfirm"),
    btnAccountReset: document.getElementById("btnAccountReset"),
    accountStatus: document.getElementById("accountStatus"),

    // auth view (gabungan)
    loginView: document.getElementById("loginView"),
    dashboardView: document.getElementById("dashboardView"),
    loginForm: document.getElementById("loginForm"),
    loginUsername: document.getElementById("username"),
    loginPassword: document.getElementById("password"),
    errBox: document.getElementById("errBox"),
    btnThemeToggleLogin: document.getElementById("btnThemeToggleLogin"),
  };
}
