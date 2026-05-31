import type { AgentRole, AgentTaskType, AIAgent, AgentPriority } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { socialPlatformLabels } from "@/lib/content-library";
import { demoPlaceholder } from "@/lib/demo-placeholder";
import { runTextWorkflow } from "@/lib/text-ai-service";
import type { AgentRecommendationDto, AgentTaskDto, AIAgentDto, AutomationPlanDto } from "@/lib/types";

const agentSeeds: Array<Pick<AIAgent, "name" | "role" | "description" | "successRate">> = [
  { name: "CEO Agent", role: "CEO", description: "Menentukan prioritas project, keputusan lanjut/revisi/tahan, dan membaca ringkasan semua agent.", successRate: 97 },
  { name: "Research Agent", role: "RESEARCH", description: "Menganalisa trending niche, keyword potensial, dan rekomendasi topik.", successRate: 94 },
  { name: "Script Agent", role: "SCRIPT", description: "Membuat hook, caption, CTA, dan script pendek untuk content pipeline.", successRate: 96 },
  { name: "Clipper Agent", role: "CLIPPER", description: "Merekomendasikan bagian video untuk clip, durasi terbaik, dan viral score.", successRate: 93 },
  { name: "Creative Agent", role: "CREATIVE", description: "Membuat ide image, motion image, dan prompt video generator.", successRate: 95 },
  { name: "Scheduler Agent", role: "SCHEDULER", description: "Merekomendasikan jadwal posting, akun sosial, dan platform target.", successRate: 92 },
  { name: "Analyst Agent", role: "ANALYST", description: "Membaca performa posting dan memberi rekomendasi konten berikutnya.", successRate: 98 }
];

export const roleLabels: Record<AgentRole, string> = {
  CEO: "CEO Agent",
  RESEARCH: "Research Agent",
  SCRIPT: "Script Agent",
  CLIPPER: "Clipper Agent",
  CREATIVE: "Creative Agent",
  SCHEDULER: "Scheduler Agent",
  ANALYST: "Analyst Agent"
};

export const taskTypeLabels: Record<AgentTaskType, string> = {
  RESEARCH_TREND: "Research trend",
  GENERATE_CONTENT_IDEA: "Generate content idea",
  REVIEW_CONTENT: "Review content",
  RECOMMEND_SCHEDULE: "Recommend schedule",
  ANALYZE_PERFORMANCE: "Analyze performance"
};

export async function ensureAgentsSeeded() {
  const count = await prisma.aIAgent.count();
  if (count > 0) return;
  await prisma.aIAgent.createMany({ data: agentSeeds });
}

export function mapAgent(agent: AIAgent): AIAgentDto {
  return {
    id: agent.id,
    name: agent.name,
    role: agent.role,
    roleLabel: roleLabels[agent.role],
    description: agent.description,
    status: agent.status,
    statusLabel: agent.status === "ACTIVE" ? "Active" : agent.status === "PAUSED" ? "Paused" : "Disabled",
    lastRunAt: agent.lastRunAt?.toISOString(),
    totalTasks: agent.totalTasks,
    successRate: agent.successRate,
    createdAt: agent.createdAt.toISOString()
  };
}

export function mapTask(task: {
  id: string;
  agentId: string;
  agent?: { name: string } | null;
  projectId: string | null;
  project?: { name: string } | null;
  contentItemId: string | null;
  contentItem?: { title: string } | null;
  taskType: AgentTaskType;
  title: string;
  description: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";
  priority: AgentPriority;
  result: string;
  createdAt: Date;
  completedAt: Date | null;
}): AgentTaskDto {
  return {
    id: task.id,
    agentId: task.agentId,
    agentName: task.agent?.name,
    projectId: task.projectId ?? undefined,
    project: task.project?.name,
    contentItemId: task.contentItemId ?? undefined,
    contentTitle: task.contentItem?.title,
    taskType: task.taskType,
    taskTypeLabel: taskTypeLabels[task.taskType],
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    result: task.result,
    createdAt: task.createdAt.toISOString(),
    completedAt: task.completedAt?.toISOString()
  };
}

export function mapRecommendation(recommendation: {
  id: string;
  agentId: string;
  agent?: { name: string } | null;
  projectId: string | null;
  project?: { name: string } | null;
  contentItemId: string | null;
  contentItem?: { title: string } | null;
  title: string;
  description: string;
  recommendationType: string;
  priority: AgentPriority;
  score: number;
  status: string;
  createdAt: Date;
}): AgentRecommendationDto {
  return {
    id: recommendation.id,
    agentId: recommendation.agentId,
    agentName: recommendation.agent?.name,
    projectId: recommendation.projectId ?? undefined,
    project: recommendation.project?.name,
    contentItemId: recommendation.contentItemId ?? undefined,
    contentTitle: recommendation.contentItem?.title,
    title: recommendation.title,
    description: recommendation.description,
    recommendationType: recommendation.recommendationType,
    priority: recommendation.priority,
    score: recommendation.score,
    status: recommendation.status,
    createdAt: recommendation.createdAt.toISOString()
  };
}

export function mapAutomationPlan(plan: {
  id: string;
  projectId: string | null;
  project?: { name: string } | null;
  socialAccountId: string | null;
  socialAccount?: { name: string } | null;
  title: string;
  description: string;
  suggestedPlatform: "TIKTOK" | "YOUTUBE_SHORTS" | "INSTAGRAM_REELS" | "FACEBOOK_REELS" | null;
  suggestedPostingTime: string;
  reason: string;
  priority: AgentPriority;
  status: "DRAFT" | "WAITING_APPROVAL" | "APPROVED" | "REJECTED" | "EXECUTED";
  createdByAgentId: string | null;
  createdByAgent?: { name: string } | null;
  createdAt: Date;
  updatedAt: Date;
}): AutomationPlanDto {
  return {
    id: plan.id,
    projectId: plan.projectId ?? undefined,
    project: plan.project?.name,
    socialAccountId: plan.socialAccountId ?? undefined,
    socialAccount: plan.socialAccount?.name,
    title: plan.title,
    description: plan.description,
    suggestedPlatform: plan.suggestedPlatform ?? undefined,
    suggestedPlatformLabel: plan.suggestedPlatform ? socialPlatformLabels[plan.suggestedPlatform] : "Unassigned",
    suggestedPostingTime: plan.suggestedPostingTime,
    reason: plan.reason,
    priority: plan.priority,
    status: plan.status,
    statusLabel: plan.status.replaceAll("_", " "),
    createdByAgentId: plan.createdByAgentId ?? undefined,
    createdByAgent: plan.createdByAgent?.name,
    createdAt: plan.createdAt.toISOString(),
    updatedAt: plan.updatedAt.toISOString()
  };
}

type AgentRunTemplate = { taskType: AgentTaskType; title: string; description: string; result: string; priority: AgentPriority; recommendationType: string; recommendation: string; score: number };

function taskForRole(role: AgentRole): AgentRunTemplate {
  const map: Record<AgentRole, AgentRunTemplate> = {
    CEO: {
      taskType: "REVIEW_CONTENT",
      title: "Review project priority queue",
      description: "CEO Agent compares active projects, content pipeline, and pending approvals.",
      result: "Decision: lanjut untuk project dengan content Approved dan tahan content yang belum punya analytics.",
      priority: "HIGH",
      recommendationType: "EXECUTIVE_DECISION",
      recommendation: "Prioritaskan project dengan schedule aktif dan performa manual terbaru.",
      score: 91
    },
    RESEARCH: {
      taskType: "RESEARCH_TREND",
      title: "Research trend: AI automation and creator workflow",
      description: "Research Agent scans dummy trend signals, niche velocity, and keyword potential.",
      result: "Keyword potensial: AI workflow, faceless automation, content ops dashboard.",
      priority: "HIGH",
      recommendationType: "TREND_RESEARCH",
      recommendation: "Buat 3 content angle tentang AI workflow untuk creator solo.",
      score: 88
    },
    SCRIPT: {
      taskType: "GENERATE_CONTENT_IDEA",
      title: "Generate hook, caption, CTA, and short script",
      description: "Script Agent builds a short-form script package from current pipeline signals.",
      result: "Hook: Stop posting randomly. CTA: Save this workflow before your next batch.",
      priority: "MEDIUM",
      recommendationType: "SCRIPT_PACKAGE",
      recommendation: "Gunakan hook problem-first dalam 3 detik pertama dan CTA save/share.",
      score: 86
    },
    CLIPPER: {
      taskType: "REVIEW_CONTENT",
      title: "Review best clip window and duration",
      description: "Clipper Agent scores content duration, pacing, and viral clip fit.",
      result: "Durasi terbaik: 30-45 detik dengan punchline sebelum detik ke-8.",
      priority: "MEDIUM",
      recommendationType: "CLIP_RECOMMENDATION",
      recommendation: "Ambil segmen dengan problem, proof, dan payoff dalam satu loop pendek.",
      score: 84
    },
    CREATIVE: {
      taskType: "GENERATE_CONTENT_IDEA",
      title: "Generate creative prompt set",
      description: "Creative Agent proposes image, motion image, and AI video prompt direction.",
      result: "Prompt: premium SaaS control room, creator workflow cards, subtle motion zoom.",
      priority: "MEDIUM",
      recommendationType: "CREATIVE_PROMPT",
      recommendation: "Buat asset 9:16 dengan visual dashboard nyata dan motion zoom ringan.",
      score: 87
    },
    SCHEDULER: {
      taskType: "RECOMMEND_SCHEDULE",
      title: "Recommend posting schedule and platform mix",
      description: "Scheduler Agent checks platform queue, account status, and evening posting window.",
      result: "Posting window: 19:00-21:00 Asia/Jakarta. Target: TikTok and YouTube Shorts.",
      priority: "HIGH",
      recommendationType: "SCHEDULE_RECOMMENDATION",
      recommendation: "Jadwalkan Approved content ke akun aktif/manual, hindari disabled account.",
      score: 89
    },
    ANALYST: {
      taskType: "ANALYZE_PERFORMANCE",
      title: "Analyze manual performance and next content pattern",
      description: "Analyst Agent reads PostAnalytics and flags high-retention patterns.",
      result: "Konten dengan saves/shares tinggi cocok dibuat versi serupa minggu ini.",
      priority: "HIGH",
      recommendationType: "PERFORMANCE_INSIGHT",
      recommendation: "Create similar content dari konten dengan engagement rate di atas 8%.",
      score: 93
    }
  };
  return map[role];
}

export async function runAgent(agentId: string) {
  await ensureAgentsSeeded();
  const agent = await prisma.aIAgent.findUnique({ where: { id: agentId } });
  if (!agent) throw new Error("Agent not found.");
  if (agent.status === "DISABLED") throw new Error("Disabled agent cannot be run.");

  const project = await prisma.project.findFirst({ orderBy: { updatedAt: "desc" } });
  const contentItem = await prisma.contentItem.findFirst({ orderBy: { updatedAt: "desc" } });
  const template = taskForRole(agent.role);
  const now = new Date();
  const provider = await runTextWorkflow({
    operation: "AGENT",
    topic: JSON.stringify({
      agent: roleLabels[agent.role],
      task: template.title,
      description: template.description,
      ruleBasedResult: template.result,
      project: project?.name,
      content: contentItem?.title
    }),
    platform: contentItem?.platform ?? undefined,
    projectId: project?.id
  });
  const providerText = provider.result.script ?? provider.result.analysis ?? provider.result.caption ?? provider.result.description;
  const result = provider.mode === "REAL" ? providerText : template.result;
  const recommendationDescription = provider.warning ? `${result}\n\nProvider note: ${provider.warning}` : result;

  const [task, recommendation] = await prisma.$transaction([
    prisma.agentTask.create({
      data: {
        agentId: agent.id,
        projectId: project?.id,
        contentItemId: contentItem?.id,
        taskType: template.taskType,
        title: template.title,
        description: template.description,
        status: "COMPLETED",
        result,
        priority: template.priority,
        completedAt: now
      },
      include: { agent: true, project: true, contentItem: true }
    }),
    prisma.agentRecommendation.create({
      data: {
        agentId: agent.id,
        projectId: project?.id,
        contentItemId: contentItem?.id,
        title: `${roleLabels[agent.role]}: ${template.recommendation}`,
        description: recommendationDescription,
        recommendationType: template.recommendationType,
        priority: template.priority,
        score: template.score,
        status: "OPEN"
      },
      include: { agent: true, project: true, contentItem: true }
    }),
    prisma.aIAgent.update({
      where: { id: agent.id },
      data: { lastRunAt: now, totalTasks: { increment: 1 }, status: agent.status === "PAUSED" ? "ACTIVE" : agent.status }
    })
  ]);
  await writeAuditLog({
    action: "AGENT_TASK_COMPLETED",
    entityType: "AIAgent",
    entityId: agent.id,
    message: `${agent.name} completed ${task.title}.`,
    metadata: { taskId: task.id, recommendationId: recommendation.id, role: agent.role, providerMode: provider.mode }
  });

  return { task: mapTask(task), recommendation: mapRecommendation(recommendation) };
}

export async function getAgents() {
  await ensureAgentsSeeded();
  const agents = await prisma.aIAgent.findMany({ orderBy: { role: "asc" } });
  return agents.map(mapAgent);
}

export async function createContentFromRecommendation(recommendationId: string) {
  const recommendation = await prisma.agentRecommendation.findUnique({
    where: { id: recommendationId },
    include: { agent: true, project: true }
  });
  if (!recommendation) throw new Error("Agent recommendation not found.");

  const content = await prisma.contentItem.create({
    data: {
      projectId: recommendation.projectId,
      type: "IDEA",
      title: recommendation.title.replace(/^.*?:\s*/, ""),
      description: recommendation.description,
      caption: recommendation.description,
      thumbnail: demoPlaceholder("Agent Recommendation"),
      status: "DRAFT",
      workflowStatus: "DRAFT",
      sourceType: "AGENT_RECOMMENDATION",
      contentAngle: recommendation.recommendationType,
      notes: `Created from ${recommendation.agent.name}. Priority: ${recommendation.priority}. Score: ${recommendation.score}.`,
      platform: recommendation.project?.targetAccounts?.[0]?.toUpperCase().includes("YOUTUBE") ? "YOUTUBE_SHORTS" : "TIKTOK",
      tags: ["ai-agent", recommendation.recommendationType.toLowerCase().replaceAll("_", "-")]
    }
  });

  const updatedRecommendation = await prisma.agentRecommendation.update({
    where: { id: recommendation.id },
    data: { contentItemId: content.id, status: "CONVERTED" },
    include: { agent: true, project: true, contentItem: true }
  });

  await prisma.agentTask.create({
    data: {
      agentId: recommendation.agentId,
      projectId: recommendation.projectId,
      contentItemId: content.id,
      taskType: "GENERATE_CONTENT_IDEA",
      title: "Convert recommendation to ContentItem Draft",
      description: `Converted recommendation ${recommendation.title} into Content Library Draft.`,
      status: "COMPLETED",
      result: `ContentItem ${content.title} created as Draft and waiting admin review.`,
      priority: recommendation.priority,
      completedAt: new Date()
    }
  });

  return { content, recommendation: mapRecommendation(updatedRecommendation) };
}

export async function runCeoAgentPlan() {
  await ensureAgentsSeeded();
  const ceo = await prisma.aIAgent.findFirst({ where: { role: "CEO" } });
  if (!ceo) throw new Error("CEO Agent not found.");

  const [project, socialAccount, approvedCount, reviewCount, postedCount] = await Promise.all([
    prisma.project.findFirst({ orderBy: { updatedAt: "desc" } }),
    prisma.socialAccount.findFirst({ where: { isActive: true, status: { in: ["CONNECTED", "MANUAL"] } }, orderBy: { updatedAt: "desc" } }),
    prisma.contentItem.count({ where: { workflowStatus: "APPROVED" } }),
    prisma.contentItem.count({ where: { workflowStatus: "REVIEW" } }),
    prisma.contentItem.count({ where: { workflowStatus: "POSTED" } })
  ]);

  const plan = await prisma.automationPlan.create({
    data: {
      projectId: project?.id,
      socialAccountId: socialAccount?.id,
      title: `CEO Plan: ${project?.niche ?? "AI content"} priority push`,
      description: `Create a proof-first short content plan based on ${approvedCount} approved, ${reviewCount} review, and ${postedCount} posted content signals.`,
      suggestedPlatform: socialAccount?.socialPlatform ?? "TIKTOK",
      suggestedPostingTime: "19:00-21:00 Asia/Jakarta",
      reason: "Rule-based CEO Agent detected active project momentum and recommends a review-first content workflow before scheduling.",
      priority: reviewCount > 5 || approvedCount > 3 ? "HIGH" : "MEDIUM",
      status: "WAITING_APPROVAL",
      createdByAgentId: ceo.id
    },
    include: { project: true, socialAccount: true, createdByAgent: true }
  });

  await prisma.agentTask.create({
    data: {
      agentId: ceo.id,
      projectId: project?.id,
      taskType: "REVIEW_CONTENT",
      title: "CEO Agent created Automation Plan",
      description: "CEO Agent read projects, library, analytics, social accounts, and scheduler queue.",
      status: "COMPLETED",
      result: `Automation Plan created: ${plan.title}`,
      priority: plan.priority,
      completedAt: new Date()
    }
  });

  await prisma.agentRecommendation.create({
    data: {
      agentId: ceo.id,
      projectId: project?.id,
      title: `CEO Recommendation: ${plan.title}`,
      description: plan.reason,
      recommendationType: "AUTOMATION_PLAN",
      priority: plan.priority,
      score: plan.priority === "HIGH" ? 92 : 84,
      status: "OPEN"
    }
  });

  await prisma.aIAgent.update({
    where: { id: ceo.id },
    data: { lastRunAt: new Date(), totalTasks: { increment: 1 } }
  });
  await writeAuditLog({
    action: "CEO_AUTOMATION_PLAN_CREATED",
    entityType: "AutomationPlan",
    entityId: plan.id,
    message: `CEO Agent created automation plan: ${plan.title}.`,
    metadata: { projectId: project?.id, socialAccountId: socialAccount?.id, priority: plan.priority }
  });

  return mapAutomationPlan(plan);
}

export async function getAutomationPlans() {
  const plans = await prisma.automationPlan.findMany({
    orderBy: { createdAt: "desc" },
    include: { project: true, socialAccount: true, createdByAgent: true },
    take: 50
  });
  return plans.map(mapAutomationPlan);
}

export async function convertPlanToContent(planId: string) {
  const plan = await prisma.automationPlan.findUnique({ where: { id: planId }, include: { project: true, socialAccount: true, createdByAgent: true } });
  if (!plan) throw new Error("Automation plan not found.");
  if (plan.status === "REJECTED") throw new Error("Rejected plan cannot be converted.");

  const content = await prisma.contentItem.create({
    data: {
      projectId: plan.projectId,
      socialAccountId: plan.socialAccountId,
      type: "IDEA",
      title: plan.title.replace("CEO Plan: ", ""),
      description: plan.description,
      caption: `${plan.description}\n\nCTA: Save this workflow and test it tonight.`,
      thumbnail: demoPlaceholder("Automation Plan"),
      status: "DRAFT",
      workflowStatus: "DRAFT",
      sourceType: "CEO_AUTOMATION_PLAN",
      contentAngle: plan.reason,
      notes: `Suggested posting time: ${plan.suggestedPostingTime}`,
      platform: plan.suggestedPlatform,
      tags: ["ceo-agent", "automation-plan"]
    }
  });

  const updated = await prisma.automationPlan.update({
    where: { id: plan.id },
    data: { status: "EXECUTED" },
    include: { project: true, socialAccount: true, createdByAgent: true }
  });

  return { content, plan: mapAutomationPlan(updated) };
}
