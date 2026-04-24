export const AccessStatus = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
} as const;
export type AccessStatus = (typeof AccessStatus)[keyof typeof AccessStatus];

export const Environment = {
  development: "development",
  staging: "staging",
  production: "production",
} as const;
export type Environment = (typeof Environment)[keyof typeof Environment];

export const AccessLevel = {
  read: "read",
  write: "write",
  admin: "admin",
} as const;
export type AccessLevel = (typeof AccessLevel)[keyof typeof AccessLevel];

export type DecisionMetadata = {
  reviewedBy: string;
  reviewedAt: string; // ISO date string
};

export type AccessRequest = {
  id: string;
  requesterName: string;
  requesterEmail: string;
  team: string;
  apiName: string;
  environment: Environment;
  accessLevel: AccessLevel;
  status: AccessStatus;
  submittedAt: string; // ISO date string
  justification: string;
  reviewerNotes?: string;
  decision?: DecisionMetadata;
};
