export const SenderType = {
  customer: "customer",
  agent: "agent",
  ai: "ai",
} as const;

export type SenderType = (typeof SenderType)[keyof typeof SenderType];
