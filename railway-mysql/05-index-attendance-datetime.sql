-- Run once on Railway MySQL after 01-attendance.sql (Data tab / mysql CLI).
-- Speeds up ORDER BY authDateTime DESC, id DESC and date-range filters for the GraphQL API.

USE railway;

CREATE INDEX idx_attendance_authdatetime_id ON attendance (authDateTime, id);
