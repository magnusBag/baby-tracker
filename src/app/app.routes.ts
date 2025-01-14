import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "home",
    loadComponent: () => import("./home/home.page").then((m) => m.HomePage),
  },
  {
    path: "",
    redirectTo: "home",
    pathMatch: "full",
  },
  {
    path: "calendar",
    loadComponent: () =>
      import("./calendar/calendar.page").then((m) => m.CalendarPage),
  },
  {
    path: "settings",
    loadComponent: () =>
      import("./settings/settings.page").then((m) => m.SettingsPage),
  },
  {
    path: "history",
    loadComponent: () =>
      import("./history/history.page").then((m) => m.HistoryPage),
  },
  {
    path: "timer",
    loadComponent: () => import("./timer/timer.page").then((m) => m.TimerPage),
  },
  {
    path: "weekly-report",
    loadComponent: () =>
      import("./weekly-report/weekly-report.page").then((m) =>
        m.WeeklyReportPage
      ),
  },
];
