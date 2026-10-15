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

export type HouseRule = {
  id: string;
  ruleNumber: number;
  text: string;
  updatedBy?: UserRole;
  updatedAt?: string;
};

export type HouseRuleProposal = {
  id: string;
  ruleNumber: number;
  currentText: string;
  proposedText: string;
  proposedBy: UserRole;
  remusApproved: boolean;
  nicoleApproved: boolean;
  createdAt: string;
};

export type CrimeStatus = "未處理" | "已道歉" | "已補償" | "已處理";

export type CrimeRecord = {
  id: string;
  incidentDate: string;
  offender: UserRole;
  ruleNumber?: number;
  description: string;
  status: CrimeStatus;
  punishment: string;
  recordedBy: UserRole;
  confirmedBy: UserRole;
  createdAt: string;
  confirmedAt: string;
};

export type CrimeRecordProposal = {
  id: string;
  recordId?: string;
  incidentDate: string;
  offender: UserRole;
  ruleNumber?: number;
  description: string;
  status: CrimeStatus;
  punishment: string;
  proposedBy: UserRole;
  createdAt: string;
};
