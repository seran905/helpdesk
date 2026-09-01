export const SenderType = {
  customer: "customer",
  agent: "agent",
} as const;

export type SenderType = (typeof SenderType)[keyof typeof SenderType];
