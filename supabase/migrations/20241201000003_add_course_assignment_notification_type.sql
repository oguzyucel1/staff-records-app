-- Add course_assignment notification type to existing notifications table
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN ('leave_approved', 'leave_rejected', 'attendance_reminder', 'system_notification', 'course_assignment')); 