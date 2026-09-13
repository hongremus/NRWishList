export type UserRole = "Remus" | "Nicole";

export type User = {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
};

export type CalendarEvent = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  location?: string;
  createdBy?: UserRole;
  isRomantic?: boolean;
  recurring?: boolean;
};

export type Priority = "high" | "medium" | "low";

export type AssignedTo = "me" | "gf" | "both";

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
  address?: string;
  tags: string[];
  priority: Priority;
  proposedBy: "Remus" | "Nicole" | "both";
  assignedTo: AssignedTo;
  deadline?: string | null; // ISO
  status: "open" | "completed";
  createdAt: string;
  completedCount: number;
  history: WishHistory[];
};
