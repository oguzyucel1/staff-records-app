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
  is_created_by_admin?: boolean;
  start_time?: string;
  end_time?: string;
  replaced_lecturer?: string;
  created_by?: string;
  course_code?: string;
  profiles: {
    full_name: string;
    email: string;
    department: string;
  };
  replaced_lecturer_profile?: {
    full_name: string;
    email: string;
    department: string;
  };
};
