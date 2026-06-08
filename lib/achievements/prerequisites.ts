import type { AchievementTemplate } from "@prisma/client";

export function parseRequiresIds(requiresIds: string): string[] {
  try {
    const parsed = JSON.parse(requiresIds);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function canUnlock(
  templateId: string,
  templates: AchievementTemplate[],
  unlockedIds: string[],
): boolean {
  const template = templates.find((t) => t.id === templateId);
  if (!template) return false;

  const required = parseRequiresIds(template.requiresIds);
  return required.every((id) => unlockedIds.includes(id));
}

export function getBlockedBy(
  templateId: string,
  templates: AchievementTemplate[],
  unlockedIds: string[],
): AchievementTemplate[] {
  const template = templates.find((t) => t.id === templateId);
  if (!template) return [];

  const required = parseRequiresIds(template.requiresIds);
  const missingIds = required.filter((id) => !unlockedIds.includes(id));
  return templates.filter((t) => missingIds.includes(t.id));
}
