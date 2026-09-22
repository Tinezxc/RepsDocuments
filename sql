-- ============================================================
-- EarlyWatch — Full Reset (schema + users + demo data)
-- ============================================================

DROP DATABASE IF EXISTS earlywatch;
CREATE DATABASE earlywatch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE earlywatch;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ---------- TABLES ----------
CREATE TABLE id_sequence (
  id INT AUTO_INCREMENT PRIMARY KEY,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4;

CREATE TABLE users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  role         ENUM('adviser','instructor','student') NOT NULL,
  title        VARCHAR(40)  NOT NULL,
  name         VARCHAR(120) NOT NULL,
  initials     VARCHAR(4)   NOT NULL,
  email        VARCHAR(160) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  student_id   VARCHAR(30)  DEFAULT NULL,
  created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE password_resets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NOT NULL,
  token      VARCHAR(128) NOT NULL UNIQUE,
  expires_at DATETIME     NOT NULL,
  created_at DATETIME     DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pr_user  (user_id),
  INDEX idx_pr_token (token),
  CONSTRAINT fk_pr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE students (
  id               VARCHAR(30)  PRIMARY KEY,
  seq_no           INT          NOT NULL AUTO_INCREMENT,
  name             VARCHAR(120) NOT NULL,
  initials         VARCHAR(4)   NOT NULL,
  course           VARCHAR(120) DEFAULT NULL,
  section          VARCHAR(30)  DEFAULT NULL,
  adviser          VARCHAR(80)  DEFAULT NULL,
  gpa              DECIMAL(3,2) NOT NULL DEFAULT 0,
  attendance       INT          NOT NULL DEFAULT 0,
  missed           INT          NOT NULL DEFAULT 0,
  failed_subjects  INT          NOT NULL DEFAULT 0,
  case_status      ENUM('Open','In-Progress','Monitoring','Resolved') NOT NULL DEFAULT 'Monitoring',
  created_at       DATETIME     DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_students_seq (seq_no),
  INDEX idx_students_name (name),
  INDEX idx_students_section (section),
  INDEX idx_students_status (case_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE subjects (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  student_id   VARCHAR(30)  NOT NULL,
  code         VARCHAR(20)  NOT NULL,
  name         VARCHAR(160) NOT NULL,
  instructor   VARCHAR(120) DEFAULT NULL,
  grade        INT DEFAULT NULL,
  prelim       INT DEFAULT NULL,
  midterm      INT DEFAULT NULL,
  attendance   INT DEFAULT 0,
  UNIQUE KEY uq_subject_per_student (student_id, code),
  CONSTRAINT fk_subject_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE risk_history (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  VARCHAR(30) NOT NULL,
  term        VARCHAR(40) NOT NULL,
  risk        INT NOT NULL,
  INDEX idx_history_student (student_id),
  CONSTRAINT fk_history_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  VARCHAR(30)  NOT NULL,
  date        DATE         NOT NULL,
  author      VARCHAR(120) NOT NULL,
  text        TEXT         NOT NULL,
  INDEX idx_notes_student (student_id),
  CONSTRAINT fk_notes_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE alerts (
  id            VARCHAR(30) PRIMARY KEY,
  student_id    VARCHAR(30) NOT NULL,
  severity      ENUM('critical','high','medium','low') NOT NULL,
  kind          VARCHAR(40) NOT NULL,
  message       VARCHAR(255) NOT NULL,
  date          DATE NOT NULL,
  acknowledged  TINYINT(1) NOT NULL DEFAULT 0,
  INDEX idx_alerts_student (student_id),
  INDEX idx_alerts_unread  (acknowledged),
  CONSTRAINT fk_alert_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE interventions (
  id          VARCHAR(30) PRIMARY KEY,
  student_id  VARCHAR(30) NOT NULL,
  type        VARCHAR(60) NOT NULL,
  status      ENUM('pending','effective','no-response') NOT NULL DEFAULT 'pending',
  assigned    VARCHAR(120) DEFAULT NULL,
  action      TEXT NOT NULL,
  date        DATE NOT NULL,
  deadline    DATE DEFAULT NULL,
  INDEX idx_iv_student (student_id),
  INDEX idx_iv_status  (status),
  CONSTRAINT fk_iv_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ---------- USERS ----------
INSERT INTO users (role, title, name, initials, email, password, student_id) VALUES
('adviser',    'Adviser',    'Dr. Carl Domenic Reyes', 'DM', 'carl.reyes@cmdi.edu.ph',    'adviser123',    NULL),
('instructor', 'Instructor', 'Prof. Jovic Lanao',       'PJ', 'jovic.lanao@cmdi.edu.ph',   'instructor123', NULL),
('student',    'Student',    'Jomar Pantas',             'AR', 'jomar.pantas@cmdi.edu.ph',  'student123',    NULL)
ON DUPLICATE KEY UPDATE
  role = VALUES(role), title = VALUES(title), name = VALUES(name),
  initials = VALUES(initials), password = VALUES(password), student_id = VALUES(student_id);

-- ---------- STUDENTS ----------
INSERT INTO students
  (id, seq_no, name, initials, course, section, adviser,
   gpa, attendance, missed, failed_subjects, case_status)
VALUES
  ('2026-00001', 1, 'Maria Santos',   'MS', 'BS Information Technology', 'BSIT-3A', 'Dr. Carl Domenic Reyes', 1.45, 52, 11, 3, 'Open'),
  ('2026-00002', 2, 'Juan Dela Cruz', 'JD', 'BS Computer Science',       'BSCS-2B', 'Dr. Carl Domenic Reyes', 1.85, 58,  8, 2, 'Open'),
  ('2026-00003', 3, 'Andrea Lopez',   'AL', 'BS Information Technology', 'BSIT-3A', 'Dr. Carl Domenic Reyes', 2.15, 68,  6, 1, 'In-Progress'),
  ('2026-00004', 4, 'Kevin Ramos',    'KR', 'BS Computer Science',       'BSCS-3A', 'Dr. Carl Domenic Reyes', 2.05, 71,  5, 2, 'In-Progress'),
  ('2026-00005', 5, 'Sofia Mendoza',  'SM', 'BS Information Systems',    'BSIS-2A', 'Dr. Carl Domenic Reyes', 2.45, 82,  3, 0, 'Monitoring'),
  ('2026-00006', 6, 'Rafael Torres',  'RT', 'BS Information Technology', 'BSIT-2B', 'Dr. Carl Domenic Reyes', 2.55, 84,  2, 0, 'Monitoring'),
  ('2026-00007', 7, 'Bea Villanueva', 'BV', 'BS Computer Science',       'BSCS-2B', 'Dr. Carl Domenic Reyes', 3.20, 94,  0, 0, 'Resolved'),
  ('2026-00008', 8, 'Nathan Aquino',  'NA', 'BS Information Systems',    'BSIS-3A', 'Dr. Carl Domenic Reyes', 3.65, 98,  0, 0, 'Resolved');

-- Link demo student user to Maria Santos
UPDATE users SET student_id = '2026-00001' WHERE email = 'jomar.pantas@cmdi.edu.ph';

-- ---------- SUBJECTS ----------
INSERT INTO subjects (student_id, code, name, instructor, grade, prelim, midterm, attendance) VALUES
  ('2026-00001','IT301','Data Structures & Algorithms','Prof. Jovic Lanao',68,65,70,55),
  ('2026-00001','IT302','Database Management Systems','Prof. Liza Cruz',72,70,74,60),
  ('2026-00001','IT303','Web Systems & Technologies','Prof. Mark Uy',70,68,72,58),
  ('2026-00001','GE301','Technical Writing','Prof. Rita Gomez',75,74,76,70),
  ('2026-00002','CS201','Object-Oriented Programming','Prof. Jovic Lanao',71,68,74,60),
  ('2026-00002','CS202','Discrete Mathematics','Prof. Ben Lim',69,66,72,55),
  ('2026-00002','CS203','Computer Organization','Prof. Ella Tan',73,71,75,62),
  ('2026-00003','IT301','Data Structures & Algorithms','Prof. Jovic Lanao',74,72,76,70),
  ('2026-00003','IT304','Software Engineering','Prof. Mark Uy',76,74,78,72),
  ('2026-00003','IT305','Networking Fundamentals','Prof. Liza Cruz',73,71,75,68),
  ('2026-00004','CS201','Object-Oriented Programming','Prof. Jovic Lanao',72,70,74,72),
  ('2026-00004','CS204','Operating Systems','Prof. Ben Lim',70,68,72,68),
  ('2026-00004','CS205','Algorithms & Complexity','Prof. Ella Tan',74,72,76,75),
  ('2026-00005','IS201','Systems Analysis & Design','Prof. Rita Gomez',80,78,82,85),
  ('2026-00005','IS202','Information Management','Prof. Mark Uy',78,76,80,82),
  ('2026-00005','IS203','Business Process Modeling','Prof. Liza Cruz',79,77,81,84),
  ('2026-00006','IT301','Data Structures & Algorithms','Prof. Jovic Lanao',79,77,81,86),
  ('2026-00006','IT302','Database Management Systems','Prof. Liza Cruz',81,79,83,88),
  ('2026-00006','IT303','Web Systems & Technologies','Prof. Mark Uy',80,78,82,87),
  ('2026-00007','CS201','Object-Oriented Programming','Prof. Jovic Lanao',88,86,90,94),
  ('2026-00007','CS202','Discrete Mathematics','Prof. Ben Lim',85,83,87,92),
  ('2026-00007','CS203','Computer Organization','Prof. Ella Tan',90,88,92,96),
  ('2026-00008','IS201','Systems Analysis & Design','Prof. Rita Gomez',92,90,94,98),
  ('2026-00008','IS202','Information Management','Prof. Mark Uy',95,93,97,99),
  ('2026-00008','IS203','Business Process Modeling','Prof. Liza Cruz',93,91,95,97),
  ('2026-00008','IS204','Enterprise Architecture','Prof. Ben Lim',94,92,96,98);

-- ---------- RISK HISTORY ----------
INSERT INTO risk_history (student_id, term, risk) VALUES
  ('2026-00001','1st Sem 2024',45),('2026-00001','2nd Sem 2024',58),('2026-00001','1st Sem 2025',70),('2026-00001','2nd Sem 2025',82),('2026-00001','1st Sem 2026',91),
  ('2026-00002','1st Sem 2024',38),('2026-00002','2nd Sem 2024',52),('2026-00002','1st Sem 2025',65),('2026-00002','2nd Sem 2025',78),('2026-00002','1st Sem 2026',85),
  ('2026-00003','1st Sem 2024',40),('2026-00003','2nd Sem 2024',48),('2026-00003','1st Sem 2025',55),('2026-00003','2nd Sem 2025',60),('2026-00003','1st Sem 2026',62),
  ('2026-00004','1st Sem 2024',30),('2026-00004','2nd Sem 2024',42),('2026-00004','1st Sem 2025',51),('2026-00004','2nd Sem 2025',58),('2026-00004','1st Sem 2026',64),
  ('2026-00005','1st Sem 2024',25),('2026-00005','2nd Sem 2024',28),('2026-00005','1st Sem 2025',32),('2026-00005','2nd Sem 2025',35),('2026-00005','1st Sem 2026',38),
  ('2026-00006','1st Sem 2024',20),('2026-00006','2nd Sem 2024',24),('2026-00006','1st Sem 2025',28),('2026-00006','2nd Sem 2025',30),('2026-00006','1st Sem 2026',33),
  ('2026-00007','1st Sem 2024',35),('2026-00007','2nd Sem 2024',28),('2026-00007','1st Sem 2025',20),('2026-00007','2nd Sem 2025',15),('2026-00007','1st Sem 2026',12),
  ('2026-00008','1st Sem 2024',15),('2026-00008','2nd Sem 2024',12),('2026-00008','1st Sem 2025',10),('2026-00008','2nd Sem 2025',8),('2026-00008','1st Sem 2026',5);

-- ---------- NOTES ----------
INSERT INTO notes (student_id, date, author, text) VALUES
  ('2026-00001','2026-08-20','Dr. Carl Domenic Reyes','Maria has missed three consecutive lab sessions. Recommended counseling.'),
  ('2026-00001','2026-09-05','Dr. Carl Domenic Reyes','Follow-up with parents scheduled. Weekly check-ins agreed.'),
  ('2026-00002','2026-08-25','Dr. Carl Domenic Reyes','Struggling with Discrete Math. Peer tutoring with Nathan suggested.'),
  ('2026-00003','2026-09-01','Dr. Carl Domenic Reyes','Improving in IT304 but attendance in IT305 slipping.'),
  ('2026-00004','2026-08-28','Dr. Carl Domenic Reyes','Failed two subjects. Enrolled in academic recovery program.'),
  ('2026-00005','2026-09-10','Dr. Carl Domenic Reyes','On track. Continue regular monitoring.'),
  ('2026-00007','2026-09-12','Dr. Carl Domenic Reyes','Consistent improvement. Case resolved.'),
  ('2026-00008','2026-09-12','Dr. Carl Domenic Reyes','Top performer and peer tutor. Case closed.');

-- ---------- ALERTS ----------
INSERT INTO alerts (id, student_id, severity, kind, message, date, acknowledged) VALUES
  ('a_0001','2026-00001','critical','Attendance','Attendance dropped to 52% — below the 60% threshold.','2026-09-15',0),
  ('a_0002','2026-00001','critical','GPA','GPA is 1.45, below the 1.75 critical threshold.','2026-09-14',0),
  ('a_0003','2026-00001','critical','Failed Subjects','3 failed subjects detected this term.','2026-09-13',0),
  ('a_0004','2026-00002','critical','Attendance','Attendance dropped to 58% — below the 60% threshold.','2026-09-15',0),
  ('a_0005','2026-00002','high','Failed Subjects','2 failed subjects detected this term.','2026-09-12',0),
  ('a_0006','2026-00003','high','Attendance','Attendance in IT305 is below 75%.','2026-09-11',0),
  ('a_0007','2026-00004','high','Failed Subjects','2 failed subjects from previous term carry over.','2026-09-10',1),
  ('a_0008','2026-00005','medium','Attendance','Attendance trending below 85% in the last two weeks.','2026-09-08',0),
  ('a_0009','2026-00006','medium','Grade','Midterm grade in IT301 declined by 6 points.','2026-09-07',1),
  ('a_0010','2026-00003','medium','Grade','IT301 grade dropped from 76 to 74.','2026-09-06',1),
  ('a_0011','2026-00007','low','Note','Bea: 4 consecutive weeks of excellent attendance.','2026-09-05',1),
  ('a_0012','2026-00008','low','Note','Nathan nominated for peer tutor program.','2026-09-04',1);

-- ---------- INTERVENTIONS ----------
INSERT INTO interventions (id, student_id, type, status, assigned, action, date, deadline) VALUES
  ('i_0001','2026-00001','Counseling','pending','Dr. Carl Domenic Reyes','Weekly one-on-one counseling sessions.','2026-09-10','2026-10-15'),
  ('i_0002','2026-00001','Parent Meeting','pending','Dr. Carl Domenic Reyes','Meeting with Maria''s parents about recovery plan.','2026-09-12','2026-09-25'),
  ('i_0003','2026-00002','Peer Tutoring','effective','Nathan Aquino','Nathan tutoring Juan in Discrete Math twice a week.','2026-09-01','2026-11-30'),
  ('i_0004','2026-00002','Makeup Classes','pending','Prof. Ben Lim','Juan enrolled in makeup sessions for CS202.','2026-09-08','2026-10-20'),
  ('i_0005','2026-00003','Academic Advising','effective','Dr. Carl Domenic Reyes','Weekly check-ins for IT305 recovery.','2026-09-02','2026-10-30'),
  ('i_0006','2026-00004','Recovery Program','pending','Prof. Jovic Lanao','Kevin enrolled in 8-week academic recovery program.','2026-08-28','2026-10-25'),
  ('i_0007','2026-00005','Monitoring','effective','Dr. Carl Domenic Reyes','Bi-weekly monitoring. On track.','2026-09-10','2026-10-10'),
  ('i_0008','2026-00007','Resolved','effective','Dr. Carl Domenic Reyes','Case resolved. No further action.','2026-09-12',NULL),
  ('i_0009','2026-00008','Resolved','effective','Dr. Carl Domenic Reyes','Top performer. Case closed.','2026-09-12',NULL);
