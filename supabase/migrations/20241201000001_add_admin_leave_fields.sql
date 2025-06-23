-- Add new columns for admin-created leave requests
ALTER TABLE leave_requests 
ADD COLUMN is_created_by_admin BOOLEAN DEFAULT FALSE,
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME,
ADD COLUMN replaced_lecturer UUID REFERENCES profiles(id),
ADD COLUMN created_by UUID REFERENCES profiles(id);

-- Add comments for documentation
COMMENT ON COLUMN leave_requests.is_created_by_admin IS 'Indicates if the leave request was created by an admin';
COMMENT ON COLUMN leave_requests.start_time IS 'Start time for the leave period (nullable for user-created requests)';
COMMENT ON COLUMN leave_requests.end_time IS 'End time for the leave period (nullable for user-created requests)';
COMMENT ON COLUMN leave_requests.replaced_lecturer IS 'ID of the lecturer who will replace the requesting user (nullable for user-created requests)';
COMMENT ON COLUMN leave_requests.created_by IS 'ID of the admin who created this leave request (nullable for user-created requests)'; 