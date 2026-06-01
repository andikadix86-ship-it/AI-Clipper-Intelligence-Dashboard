export type DashboardSummary = {
  reviewQueue: number;
  approvalQueue: number;
  scheduledToday: number;
  failedPosting: number;
  publishedContent: number;
  scheduledContent: number;
  aiTeam: Array<{ name: string; status: string }>;
  recentActivities: string[];
  unreadNotifications: number;
  providerWarnings: number;
  recommendationsReady: number;
};
