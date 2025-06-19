export type LeaveRequest = {
  id: string;
  user_id: string;
  leave_type: string;
  reason: string;
  start_date: string;
  end_date: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  updated_at: string;
  profiles: {
    full_name: string;
    email: string;
    department: string;
  };
};
