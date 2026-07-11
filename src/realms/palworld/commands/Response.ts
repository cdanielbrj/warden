export function formatResponse(response: string, fallback: string): string {
  const content = response.trim() || fallback;
  const safeContent = content.replace(/```/g, "`\u200b``").slice(0, 1_800);

  return `\`\`\`\n${safeContent}\n\`\`\``;
}
