export type UserRole = "Remus" | "Nicole";

export type User = {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
};

export type Priority = "high" | "medium" | "low";

export type AssignedTo = "me" | "gf" | "both";

export const hongKongDistricts = [
  "中西區",
  "東區",
  "南區",
  "灣仔區",
  "九龍城區",
  "觀塘區",
  "深水埗區",
  "黃大仙區",
  "油尖旺區",
  "離島區",
  "葵青區",
  "北區",
  "西貢區",
  "沙田區",
  "大埔區",
  "荃灣區",
  "屯門區",
  "元朗區",
] as const;

export type WishHistory = {
  id: string;
  completedAt: string; // ISO
  completedBy: string; // user id
  ratings: { me?: number; gf?: number };
  remarks: { me?: string; gf?: string };
  averageRating?: number;
  isLocked?: boolean;
};

export type Wish = {
  id: string;
  title: string;
  description?: string;
  region?: string;
  tags: string[];
  priority: Priority;
  proposedBy: "me" | "gf" | "both";
  assignedTo: AssignedTo;
  deadline?: string | null; // ISO
  status: "open" | "completed";
  createdAt: string;
  completedCount: number;
  history: WishHistory[];
};
