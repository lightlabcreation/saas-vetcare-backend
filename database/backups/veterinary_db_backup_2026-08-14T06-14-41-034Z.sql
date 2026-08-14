-- VETERINARY DB BACKUP GENERATED AT 2026-08-14T06:14:41.099Z
SET FOREIGN_KEY_CHECKS=0;

-- Structure for table `appointments` --
DROP TABLE IF EXISTS `appointments`;
CREATE TABLE `appointments` (
  `id` varchar(36) NOT NULL,
  `pet_id` varchar(36) DEFAULT NULL,
  `doctor_id` varchar(36) DEFAULT NULL,
  `appointment_date` date NOT NULL,
  `appointment_time` time NOT NULL,
  `appointment_type` enum('Clinic Visit','Home Visit') NOT NULL,
  `status` enum('Pending','Confirmed','Completed','Cancelled') DEFAULT 'Pending',
  `notes` text DEFAULT NULL,
  `reminder_sent` tinyint(1) DEFAULT 0,
  `next_reminder_date` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  PRIMARY KEY (`id`),
  KEY `pet_id` (`pet_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `fk_appointments_clinic` (`clinic_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_appointments_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `appointments` --
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `reminder_sent`, `next_reminder_date`, `created_at`, `clinic_id`) VALUES ('APT-2026-45D01765', 'PET-2026-AF7721C3', 'u3-doctor1', '2026-08-12 18:30:00', '11:00:00', 'Home Visit', 'Completed', NULL, 0, NULL, '2026-08-12 10:27:36', 'clinic-1');
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `reminder_sent`, `next_reminder_date`, `created_at`, `clinic_id`) VALUES ('APT-2026-5DC22C3E', 'PET-2026-AF7721C3', 'usr-65987e84', '2026-08-12 18:30:00', '21:00:00', 'Clinic Visit', 'Pending', NULL, 0, NULL, '2026-08-13 13:31:34', 'clinic-1');
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `reminder_sent`, `next_reminder_date`, `created_at`, `clinic_id`) VALUES ('APT-2026-614A4985', 'PET-2026-837EB3C8', 'usr-65987e84', '2026-08-19 18:30:00', '10:30:00', 'Home Visit', 'Pending', 'Bella has been experiencing excessive scratching and redness around the ears for the past 5 days. Home examination requested due to difficulty travelling to the clinic.', 0, NULL, '2026-08-14 05:32:16', 'clinic-1');
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `reminder_sent`, `next_reminder_date`, `created_at`, `clinic_id`) VALUES ('APT-2026-6621C798', 'PET-2026-223EAF35', 'usr-65987e84', '2026-08-12 18:30:00', '10:00:00', 'Clinic Visit', 'Pending', NULL, 0, NULL, '2026-08-13 13:52:17', 'clinic-1');
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `reminder_sent`, `next_reminder_date`, `created_at`, `clinic_id`) VALUES ('APT-2026-9F6C5988', 'PET-2026-AF7721C3', 'u3-doctor1', '2026-08-11 18:30:00', '20:30:00', 'Clinic Visit', 'Pending', NULL, 0, NULL, '2026-08-12 10:26:13', 'clinic-1');
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `reminder_sent`, `next_reminder_date`, `created_at`, `clinic_id`) VALUES ('APT-2026-B75D309C', 'PET-2026-837EB3C8', 'usr-65987e84', '2026-08-20 18:30:00', '10:00:00', 'Clinic Visit', 'Pending', 'Loss of appetite, vomiting, and low activity for the past 2 days.', 0, NULL, '2026-08-14 05:30:17', 'clinic-1');

-- Structure for table `assistance_tasks` --
DROP TABLE IF EXISTS `assistance_tasks`;
CREATE TABLE `assistance_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `doctor_id` varchar(100) DEFAULT NULL,
  `doctor_name` varchar(100) NOT NULL,
  `patient_id` varchar(100) DEFAULT NULL,
  `patient_name` varchar(100) NOT NULL,
  `task_type` enum('Surgery Prep','Lab Test','Treatment','Emergency') DEFAULT 'Treatment',
  `priority` enum('Critical','High','Medium','Low') DEFAULT 'Medium',
  `scheduled_time` varchar(50) DEFAULT 'ASAP',
  `status` enum('Pending','In Progress','Completed') DEFAULT 'Pending',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  PRIMARY KEY (`id`),
  KEY `fk_tasks_clinic` (`clinic_id`),
  CONSTRAINT `fk_tasks_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `assistance_tasks` --
INSERT INTO `assistance_tasks` (`id`, `title`, `doctor_id`, `doctor_name`, `patient_id`, `patient_name`, `task_type`, `priority`, `scheduled_time`, `status`, `notes`, `created_at`, `clinic_id`) VALUES (1, 'dddd', NULL, 'Dr. Sarah Connor', NULL, 'jacky', 'Treatment', 'Medium', 'ASAP', 'Pending', '', '2026-08-13 15:05:49', 'clinic-1');
INSERT INTO `assistance_tasks` (`id`, `title`, `doctor_id`, `doctor_name`, `patient_id`, `patient_name`, `task_type`, `priority`, `scheduled_time`, `status`, `notes`, `created_at`, `clinic_id`) VALUES (2, 'Perform Blood Test: Complete Blood Count (CBC)', 'u1-admin', 'Dr. Sarah Jenkins', 'PET-2026-837EB3C8', 'Bella', 'Lab Test', 'High', 'ASAP', 'Pending', 'Diagnostic order for Bella. Encounter ID: e41d43ad-8f5a-4936-96d3-211a6fae2466', '2026-08-14 05:35:57', 'clinic-1');
INSERT INTO `assistance_tasks` (`id`, `title`, `doctor_id`, `doctor_name`, `patient_id`, `patient_name`, `task_type`, `priority`, `scheduled_time`, `status`, `notes`, `created_at`, `clinic_id`) VALUES (3, 'Perform Ultrasound: Not required at this visit', 'u1-admin', 'Dr. Sarah Jenkins', 'PET-2026-837EB3C8', 'Bella', 'Lab Test', 'High', 'ASAP', 'Pending', 'Diagnostic order for Bella. Encounter ID: e41d43ad-8f5a-4936-96d3-211a6fae2466', '2026-08-14 05:35:57', 'clinic-1');
INSERT INTO `assistance_tasks` (`id`, `title`, `doctor_id`, `doctor_name`, `patient_id`, `patient_name`, `task_type`, `priority`, `scheduled_time`, `status`, `notes`, `created_at`, `clinic_id`) VALUES (4, 'Perform X-Ray: Not required at this visit', 'u1-admin', 'Dr. Sarah Jenkins', 'PET-2026-837EB3C8', 'Bella', 'Lab Test', 'High', 'ASAP', 'Pending', 'Diagnostic order for Bella. Encounter ID: e41d43ad-8f5a-4936-96d3-211a6fae2466', '2026-08-14 05:35:57', 'clinic-1');

-- Structure for table `attendance` --
DROP TABLE IF EXISTS `attendance`;
CREATE TABLE `attendance` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `attendance_date` date NOT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `working_hours` decimal(5,2) DEFAULT NULL,
  `status` enum('Present','Absent','Leave','Half Day') NOT NULL,
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_attendance_clinic` (`clinic_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_attendance_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `attendance` --
INSERT INTO `attendance` (`id`, `user_id`, `attendance_date`, `check_in`, `check_out`, `working_hours`, `status`, `clinic_id`) VALUES ('att-1', 'u3-doctor1', '2026-06-02 18:30:00', '08:45:00', '17:15:00', '8.50', 'Present', 'clinic-1');
INSERT INTO `attendance` (`id`, `user_id`, `attendance_date`, `check_in`, `check_out`, `working_hours`, `status`, `clinic_id`) VALUES ('att-2', 'u4-doctor2', '2026-06-02 18:30:00', '09:00:00', '17:00:00', '8.00', 'Present', 'clinic-1');
INSERT INTO `attendance` (`id`, `user_id`, `attendance_date`, `check_in`, `check_out`, `working_hours`, `status`, `clinic_id`) VALUES ('att-2f607b33', 'u6-vetasst', '2026-08-11 18:30:00', '22:43:28', NULL, NULL, 'Present', 'clinic-1');
INSERT INTO `attendance` (`id`, `user_id`, `attendance_date`, `check_in`, `check_out`, `working_hours`, `status`, `clinic_id`) VALUES ('att-3', 'u5-recept', '2026-06-02 18:30:00', '08:30:00', '17:30:00', '9.00', 'Present', 'clinic-1');
INSERT INTO `attendance` (`id`, `user_id`, `attendance_date`, `check_in`, `check_out`, `working_hours`, `status`, `clinic_id`) VALUES ('att-897ba5df', 'u1-admin', '2026-08-11 18:30:00', '11:39:36', '21:59:20', '10.33', 'Present', 'clinic-1');
INSERT INTO `attendance` (`id`, `user_id`, `attendance_date`, `check_in`, `check_out`, `working_hours`, `status`, `clinic_id`) VALUES ('att-b9c248c8', 'u1-admin', '2026-08-05 18:30:00', '23:30:54', '23:31:01', '0.02', 'Present', 'clinic-1');

-- Structure for table `clinic_settings` --
DROP TABLE IF EXISTS `clinic_settings`;
CREATE TABLE `clinic_settings` (
  `clinic_id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `primaryThemeColor` varchar(50) NOT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `autoEmail` tinyint(1) DEFAULT 1,
  `reminderTime` varchar(10) DEFAULT '24h',
  PRIMARY KEY (`clinic_id`),
  CONSTRAINT `clinic_settings_ibfk_1` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `clinic_settings` --
INSERT INTO `clinic_settings` (`clinic_id`, `name`, `email`, `phone`, `address`, `primaryThemeColor`, `logo`, `autoEmail`, `reminderTime`) VALUES ('clinic-1', 'VetCare Pro Animal Hospital', 'info@vetcarepro.com', '+94 11 234 5678', 'No. 45, Temple Road, Colombo 07, Sri Lanka', '#14b8a6', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=150', 1, '24h');

-- Structure for table `clinical_encounters` --
DROP TABLE IF EXISTS `clinical_encounters`;
CREATE TABLE `clinical_encounters` (
  `id` varchar(36) NOT NULL,
  `pet_id` varchar(36) DEFAULT NULL,
  `doctor_id` varchar(36) DEFAULT NULL,
  `encounter_date` date NOT NULL,
  `complaint` varchar(255) DEFAULT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `symptoms` text DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `treatment` text DEFAULT NULL,
  `follow_up` varchar(255) DEFAULT NULL,
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  PRIMARY KEY (`id`),
  KEY `pet_id` (`pet_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `fk_encounters_clinic` (`clinic_id`),
  CONSTRAINT `clinical_encounters_ibfk_1` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `clinical_encounters_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_encounters_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `clinical_encounters` --
INSERT INTO `clinical_encounters` (`id`, `pet_id`, `doctor_id`, `encounter_date`, `complaint`, `duration`, `symptoms`, `diagnosis`, `treatment`, `follow_up`, `clinic_id`) VALUES ('1f19b46d-ce89-40e5-84bd-4be2cab886e7', 'PET-2026-AF7721C3', 'u1-admin', '2026-08-11 18:30:00', 'ghgfhf', NULL, NULL, 'fdfhdg', NULL, NULL, 'clinic-1');
INSERT INTO `clinical_encounters` (`id`, `pet_id`, `doctor_id`, `encounter_date`, `complaint`, `duration`, `symptoms`, `diagnosis`, `treatment`, `follow_up`, `clinic_id`) VALUES ('2583b2dc-2c32-4d7e-b4e0-7dc72a45cde8', 'PET-2026-223EAF35', 'u3-doctor1', '2026-08-13 18:30:00', 'Loss of appetite, mild vomiting, and lethargy for 2 days', '2 days', 'Reduced appetite, occasional vomiting, low activity, mild dehydration', 'Physical examination indicates mild dehydration and gastrointestinal upset. Provisional diagnosis: Acute Gastritis', 'IV fluids administered; antiemetic treatment given; patient monitored for hydration and appetite', NULL, 'clinic-1');
INSERT INTO `clinical_encounters` (`id`, `pet_id`, `doctor_id`, `encounter_date`, `complaint`, `duration`, `symptoms`, `diagnosis`, `treatment`, `follow_up`, `clinic_id`) VALUES ('6be77973-f25a-4c98-babb-f2b54dbd9696', 'PET-2026-ED7F06DB', 'usr-65987e84', '2026-08-11 18:30:00', 'Diagnostic File Upload', NULL, NULL, 'Lab Evaluation', NULL, NULL, 'clinic-1');
INSERT INTO `clinical_encounters` (`id`, `pet_id`, `doctor_id`, `encounter_date`, `complaint`, `duration`, `symptoms`, `diagnosis`, `treatment`, `follow_up`, `clinic_id`) VALUES ('e41d43ad-8f5a-4936-96d3-211a6fae2466', 'PET-2026-837EB3C8', 'u1-admin', '2026-08-13 18:30:00', 'Excessive scratching, ear redness, and frequent head shaking', '5 days', 'Redness in both ears, itching, head shaking, mild ear discharge', 'Ear examination shows inflammation and mild discharge. Provisional diagnosis: Otitis externa', 'Ear cleaning performed and topical ear medication applied', 'Follow-up after 7 days. Keep ears dry and monitor redness, discharge, and scratching. Return earlier if symptoms worsen.', 'clinic-1');
INSERT INTO `clinical_encounters` (`id`, `pet_id`, `doctor_id`, `encounter_date`, `complaint`, `duration`, `symptoms`, `diagnosis`, `treatment`, `follow_up`, `clinic_id`) VALUES ('e564d5d5-8ca2-4a67-a6dd-b2f3988a195d', 'PET-2026-223EAF35', 'u1-admin', '2026-08-12 18:30:00', 'Clinical Consultation', NULL, NULL, 'Bsbsbs', NULL, NULL, 'clinic-1');

-- Structure for table `clinics` --
DROP TABLE IF EXISTS `clinics`;
CREATE TABLE `clinics` (
  `id` varchar(36) NOT NULL,
  `clinic_name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT NULL,
  `status` enum('TRIAL','ACTIVE','SUSPENDED','EXPIRED','INACTIVE') DEFAULT 'ACTIVE',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `clinics` --
INSERT INTO `clinics` (`id`, `clinic_name`, `email`, `phone`, `address`, `city`, `state`, `country`, `status`, `created_at`, `updated_at`) VALUES ('347e7a3f-0910-425a-937d-877df4a89303', 'Hamara Clinic', 'efga42687@gmail.com', '6302145897', NULL, NULL, NULL, NULL, 'ACTIVE', '2026-08-12 07:44:41', '2026-08-12 07:44:41');
INSERT INTO `clinics` (`id`, `clinic_name`, `email`, `phone`, `address`, `city`, `state`, `country`, `status`, `created_at`, `updated_at`) VALUES ('611dabff-1c91-4b0c-a477-3bf04ccbb5eb', 'Test Vet Clinic', 'landingtest1@example.com', '9876543211', NULL, NULL, NULL, NULL, 'ACTIVE', '2026-08-12 09:44:24', '2026-08-12 09:44:24');
INSERT INTO `clinics` (`id`, `clinic_name`, `email`, `phone`, `address`, `city`, `state`, `country`, `status`, `created_at`, `updated_at`) VALUES ('65783694-c111-4bfd-b48c-d76d6cda9ccd', 'Pro Vet Hospital', 'proadmin1@example.com', '9876543299', NULL, NULL, NULL, NULL, 'ACTIVE', '2026-08-12 09:46:24', '2026-08-12 09:46:24');
INSERT INTO `clinics` (`id`, `clinic_name`, `email`, `phone`, `address`, `city`, `state`, `country`, `status`, `created_at`, `updated_at`) VALUES ('67214fa4-4ef6-43a0-b798-3188be8c2318', 'Test Clinic', 'test1786550762719@test.com', '9550762719', NULL, NULL, NULL, NULL, 'TRIAL', '2026-08-12 16:06:02', '2026-08-12 16:06:02');
INSERT INTO `clinics` (`id`, `clinic_name`, `email`, `phone`, `address`, `city`, `state`, `country`, `status`, `created_at`, `updated_at`) VALUES ('6eee1bbc-ca0b-40fb-971a-d30b36f753dc', 'Vetenary Clinic', 'kushakriti524@gmail.com', '5201364789', NULL, NULL, NULL, NULL, 'ACTIVE', '2026-08-11 12:51:00', '2026-08-11 12:51:00');
INSERT INTO `clinics` (`id`, `clinic_name`, `email`, `phone`, `address`, `city`, `state`, `country`, `status`, `created_at`, `updated_at`) VALUES ('cba43d1a-e9ee-49a1-901a-ca73bf4a8a54', 'Test Clinic', 'test1786452432082@test.com', '1234567890', NULL, NULL, NULL, NULL, 'ACTIVE', '2026-08-11 12:47:12', '2026-08-11 12:47:12');
INSERT INTO `clinics` (`id`, `clinic_name`, `email`, `phone`, `address`, `city`, `state`, `country`, `status`, `created_at`, `updated_at`) VALUES ('clinic-1', 'Default Clinic', NULL, NULL, NULL, NULL, NULL, NULL, 'ACTIVE', '2026-08-10 16:41:58', '2026-08-10 16:41:58');

-- Structure for table `diagnostic_reports` --
DROP TABLE IF EXISTS `diagnostic_reports`;
CREATE TABLE `diagnostic_reports` (
  `id` varchar(36) NOT NULL,
  `encounter_id` varchar(36) DEFAULT NULL,
  `report_type` enum('Blood Test','X-Ray','Ultrasound','PDF Report') NOT NULL,
  `file_url` longtext DEFAULT NULL,
  `uploaded_by` varchar(36) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  `status` varchar(50) DEFAULT 'Pending',
  PRIMARY KEY (`id`),
  KEY `encounter_id` (`encounter_id`),
  KEY `uploaded_by` (`uploaded_by`),
  KEY `fk_reports_clinic` (`clinic_id`),
  CONSTRAINT `diagnostic_reports_ibfk_1` FOREIGN KEY (`encounter_id`) REFERENCES `clinical_encounters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `diagnostic_reports_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reports_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `diagnostic_reports` --
INSERT INTO `diagnostic_reports` (`id`, `encounter_id`, `report_type`, `file_url`, `uploaded_by`, `uploaded_at`, `clinic_id`, `status`) VALUES ('04391c16-1e57-4ff1-90d9-72a8e85e1989', 'e41d43ad-8f5a-4936-96d3-211a6fae2466', 'Ultrasound', 'Not required at this visit', 'u1-admin', '2026-08-14 05:35:57', 'clinic-1', 'Pending');
INSERT INTO `diagnostic_reports` (`id`, `encounter_id`, `report_type`, `file_url`, `uploaded_by`, `uploaded_at`, `clinic_id`, `status`) VALUES ('1790d798-f487-4ae4-93f2-4f87c50eaf0b', 'e41d43ad-8f5a-4936-96d3-211a6fae2466', 'Blood Test', 'Complete Blood Count (CBC)', 'u1-admin', '2026-08-14 05:35:57', 'clinic-1', 'Pending');
INSERT INTO `diagnostic_reports` (`id`, `encounter_id`, `report_type`, `file_url`, `uploaded_by`, `uploaded_at`, `clinic_id`, `status`) VALUES ('9856185d-d784-4d98-b823-17a430845f0d', '6be77973-f25a-4c98-babb-f2b54dbd9696', 'Blood Test', 'supplier_product_catalog.xlsx', 'usr-65987e84', '2026-08-12 16:44:48', 'clinic-1', 'Completed');
INSERT INTO `diagnostic_reports` (`id`, `encounter_id`, `report_type`, `file_url`, `uploaded_by`, `uploaded_at`, `clinic_id`, `status`) VALUES ('ebfe2a28-3767-4065-af8e-ff374f85ce32', 'e41d43ad-8f5a-4936-96d3-211a6fae2466', 'X-Ray', 'Not required at this visit', 'u1-admin', '2026-08-14 05:35:57', 'clinic-1', 'Pending');

-- Structure for table `email_reminders` --
DROP TABLE IF EXISTS `email_reminders`;
CREATE TABLE `email_reminders` (
  `id` varchar(36) NOT NULL,
  `appointment_id` varchar(36) DEFAULT NULL,
  `recipient_email` varchar(255) NOT NULL,
  `scheduled_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `sent_at` timestamp NULL DEFAULT NULL,
  `status` enum('Pending','Sent','Failed') DEFAULT 'Pending',
  PRIMARY KEY (`id`),
  KEY `appointment_id` (`appointment_id`),
  CONSTRAINT `email_reminders_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Structure for table `home_visits` --
DROP TABLE IF EXISTS `home_visits`;
CREATE TABLE `home_visits` (
  `id` varchar(36) NOT NULL,
  `appointment_id` varchar(36) DEFAULT NULL,
  `pet_id` varchar(36) DEFAULT NULL,
  `owner_id` varchar(36) DEFAULT NULL,
  `doctor_id` varchar(36) DEFAULT NULL,
  `address` text NOT NULL,
  `travel_fee` decimal(10,2) DEFAULT 0.00,
  `visit_status` enum('Scheduled','In Progress','Completed','Cancelled') DEFAULT 'Scheduled',
  `notes` text DEFAULT NULL,
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  PRIMARY KEY (`id`),
  KEY `appointment_id` (`appointment_id`),
  KEY `pet_id` (`pet_id`),
  KEY `owner_id` (`owner_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `fk_home_visits_clinic` (`clinic_id`),
  CONSTRAINT `fk_home_visits_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `home_visits_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `home_visits_ibfk_2` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `home_visits_ibfk_3` FOREIGN KEY (`owner_id`) REFERENCES `pet_owners` (`id`) ON DELETE CASCADE,
  CONSTRAINT `home_visits_ibfk_4` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `home_visits` --
INSERT INTO `home_visits` (`id`, `appointment_id`, `pet_id`, `owner_id`, `doctor_id`, `address`, `travel_fee`, `visit_status`, `notes`, `clinic_id`) VALUES ('HV-2026-1E5F861D', 'APT-2026-614A4985', 'PET-2026-837EB3C8', 'own-6b4db7c3', 'usr-65987e84', 'No. 25, Lake Road, Colombo 05, Sri Lanka', '1484.00', 'Scheduled', 'Bella has been experiencing excessive scratching and redness around the ears for the past 5 days. Home examination requested due to difficulty travelling to the clinic.', 'clinic-1');
INSERT INTO `home_visits` (`id`, `appointment_id`, `pet_id`, `owner_id`, `doctor_id`, `address`, `travel_fee`, `visit_status`, `notes`, `clinic_id`) VALUES ('HV-2026-841CD10D', 'APT-2026-45D01765', 'PET-2026-AF7721C3', 'own-7ac05428', 'u3-doctor1', 'saffd', '0.00', 'Completed', NULL, 'clinic-1');

-- Structure for table `hospitalization_cages` --
DROP TABLE IF EXISTS `hospitalization_cages`;
CREATE TABLE `hospitalization_cages` (
  `id` varchar(50) NOT NULL,
  `clinic_id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `type` varchar(100) NOT NULL,
  `status` enum('Vacant','Occupied','Cleaning Needed') DEFAULT 'Vacant',
  `pet_id` varchar(36) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `check_in` varchar(255) DEFAULT NULL,
  `flowsheet` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`flowsheet`)),
  PRIMARY KEY (`id`,`clinic_id`),
  KEY `clinic_id` (`clinic_id`),
  KEY `pet_id` (`pet_id`),
  CONSTRAINT `hospitalization_cages_ibfk_1` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `hospitalization_cages_ibfk_2` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `hospitalization_cages` --
INSERT INTO `hospitalization_cages` (`id`, `clinic_id`, `name`, `type`, `status`, `pet_id`, `reason`, `check_in`, `flowsheet`) VALUES ('ICU-01', 'clinic-1', 'ICU Unit 1', 'ICU', 'Occupied', 'PET-2026-837EB3C8', 'Severe vomiting, dehydration, weakness, and continuous monitoring', '8/14/2026, 11:03:14 AM', '{"fed":false,"meds":false,"walk":false,"eveningFed":false}');

-- Structure for table `hospitalizations` --
DROP TABLE IF EXISTS `hospitalizations`;
CREATE TABLE `hospitalizations` (
  `id` varchar(36) NOT NULL,
  `clinic_id` varchar(36) NOT NULL,
  `cage_id` varchar(50) NOT NULL,
  `cage_name` varchar(100) NOT NULL,
  `cage_type` varchar(100) NOT NULL,
  `pet_id` varchar(36) DEFAULT NULL,
  `admitted_by` varchar(36) DEFAULT NULL,
  `admission_reason` text NOT NULL,
  `special_instructions` text DEFAULT NULL,
  `check_in` datetime DEFAULT current_timestamp(),
  `check_out` datetime DEFAULT NULL,
  `status` enum('Occupied','Vacant','Cleaning Needed') DEFAULT 'Occupied',
  `flowsheet` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '{"fed":false,"meds":false,"walk":false,"eveningFed":false}' CHECK (json_valid(`flowsheet`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `pet_id` (`pet_id`),
  KEY `admitted_by` (`admitted_by`),
  CONSTRAINT `hospitalizations_ibfk_1` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `hospitalizations_ibfk_2` FOREIGN KEY (`admitted_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `hospitalizations` --
INSERT INTO `hospitalizations` (`id`, `clinic_id`, `cage_id`, `cage_name`, `cage_type`, `pet_id`, `admitted_by`, `admission_reason`, `special_instructions`, `check_in`, `check_out`, `status`, `flowsheet`, `created_at`, `updated_at`) VALUES ('6438bc11-0075-43f1-80e9-3acf9654eeec', 'clinic-1', 'ICU-02', 'ICU Unit 2', 'ICU', 'PET-2026-AF7721C3', 'u1-admin', 'sfsdf', 'fdfsfs', '2026-08-12 10:32:54', NULL, 'Occupied', '{"fed":false,"meds":false,"walk":false,"eveningFed":false}', '2026-08-12 10:32:54', '2026-08-12 10:32:54');

-- Structure for table `inventory` --
DROP TABLE IF EXISTS `inventory`;
CREATE TABLE `inventory` (
  `id` varchar(36) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` enum('Accessories & Toys','Hygiene Items','Food & Snacks','Vitamins & Supplements','Medicine','Service') NOT NULL,
  `supplier` varchar(255) DEFAULT NULL,
  `quantity` int(11) DEFAULT 0,
  `low_stock_threshold` int(11) DEFAULT 5,
  `cost_price` decimal(10,2) DEFAULT NULL,
  `selling_price` decimal(10,2) NOT NULL,
  `is_taxable` tinyint(1) DEFAULT 1,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `fk_inventory_clinic` (`clinic_id`),
  CONSTRAINT `fk_inventory_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `inventory` --
INSERT INTO `inventory` (`id`, `sku`, `name`, `category`, `supplier`, `quantity`, `low_stock_threshold`, `cost_price`, `selling_price`, `is_taxable`, `expiry_date`, `created_at`, `clinic_id`) VALUES ('1fd68aec-0577-4180-8f83-f2c642f8176e', 'AMX-2026-0815', 'Amoxicillin 500mg Capsules', 'Medicine', 'VetPharm Laboratories', 100, 20, NULL, '850.00', 1, '2028-10-24 18:30:00', '2026-08-14 05:40:19', 'clinic-1');
INSERT INTO `inventory` (`id`, `sku`, `name`, `category`, `supplier`, `quantity`, `low_stock_threshold`, `cost_price`, `selling_price`, `is_taxable`, `expiry_date`, `created_at`, `clinic_id`) VALUES ('c753a1aa-c1a4-4a1b-ae1a-84b6f4ec28b1', 'CEP-2026-0452', 'Cefpodoxime 100mg Tablets', 'Medicine', 'AnimalCare Pharma', 75, 15, NULL, '1250.00', 1, '2028-05-16 18:30:00', '2026-08-14 05:42:11', 'clinic-1');

-- Structure for table `invoice_line_items` --
DROP TABLE IF EXISTS `invoice_line_items`;
CREATE TABLE `invoice_line_items` (
  `id` varchar(36) NOT NULL,
  `invoice_id` varchar(36) DEFAULT NULL,
  `inventory_id` varchar(36) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `inventory_id` (`inventory_id`),
  KEY `fk_invoice_items_clinic` (`clinic_id`),
  CONSTRAINT `fk_invoice_items_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_line_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_line_items_ibfk_2` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `invoice_line_items` --
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `inventory_id`, `quantity`, `unit_price`, `total`, `clinic_id`) VALUES ('7283ea4c-c4fb-413f-aafd-cbef9f3e857f', 'INV-2026-0002', NULL, 1, '0.00', '0.00', 'clinic-1');
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `inventory_id`, `quantity`, `unit_price`, `total`, `clinic_id`) VALUES ('7d9de5fe-8929-46cb-9f53-4333759e336f', 'INV-2026-0002', NULL, 1, '45.00', '45.00', 'clinic-1');
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `inventory_id`, `quantity`, `unit_price`, `total`, `clinic_id`) VALUES ('eb4066f1-8410-435c-97cf-49ced0e74b3e', 'INV-2026-0002', NULL, 3, '50.00', '150.00', 'clinic-1');

-- Structure for table `invoices` --
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `id` varchar(36) NOT NULL,
  `owner_id` varchar(36) DEFAULT NULL,
  `pet_id` varchar(36) DEFAULT NULL,
  `doctor_id` varchar(36) DEFAULT NULL,
  `encounter_id` varchar(36) DEFAULT NULL,
  `home_visit_id` varchar(36) DEFAULT NULL,
  `invoice_date` date NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `grand_total` decimal(10,2) NOT NULL,
  `status` enum('Paid','Pending','Cancelled') DEFAULT 'Pending',
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  PRIMARY KEY (`id`),
  KEY `owner_id` (`owner_id`),
  KEY `pet_id` (`pet_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `encounter_id` (`encounter_id`),
  KEY `home_visit_id` (`home_visit_id`),
  KEY `fk_invoices_clinic` (`clinic_id`),
  CONSTRAINT `fk_invoices_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `pet_owners` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_4` FOREIGN KEY (`encounter_id`) REFERENCES `clinical_encounters` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_5` FOREIGN KEY (`home_visit_id`) REFERENCES `home_visits` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `invoices` --
INSERT INTO `invoices` (`id`, `owner_id`, `pet_id`, `doctor_id`, `encounter_id`, `home_visit_id`, `invoice_date`, `subtotal`, `tax_amount`, `discount_amount`, `grand_total`, `status`, `clinic_id`) VALUES ('INV-2026-0001', 'own-7ac05428', 'PET-2026-AF7721C3', NULL, NULL, NULL, '2026-08-11 18:30:00', '100.00', '8.00', '0.00', '108.00', 'Pending', 'clinic-1');
INSERT INTO `invoices` (`id`, `owner_id`, `pet_id`, `doctor_id`, `encounter_id`, `home_visit_id`, `invoice_date`, `subtotal`, `tax_amount`, `discount_amount`, `grand_total`, `status`, `clinic_id`) VALUES ('INV-2026-0002', 'own-6b4db7c3', 'PET-2026-837EB3C8', 'usr-65987e84', 'e41d43ad-8f5a-4936-96d3-211a6fae2466', NULL, '2026-08-13 18:30:00', '195.00', '0.00', '0.00', '195.00', 'Pending', 'clinic-1');

-- Structure for table `notifications` --
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('Inventory','Appointment','Attendance','System') NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `fk_notifications_clinic` (`clinic_id`),
  CONSTRAINT `fk_notifications_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `notifications` --
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-09f1ad8c-f', NULL, '🐾 New Pet Registered', 'aaa (Dog) has been registered by undefined.', '', 0, '2026-08-12 10:21:39', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-1', 'u1-admin', 'Low Stock Alert', 'Royal Canin Gastrointestinal 2kg is running low (Current: 12, Threshold: 5).', 'Inventory', 0, '2026-08-06 17:29:24', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-2acfb8ea-9', NULL, '🐾 New Pet Registered', 'Jacky  (Dog) has been registered by undefined.', '', 0, '2026-08-13 13:51:34', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-34f32910-0', NULL, '🐾 New Pet Registered', 'Bella (Dog) has been registered by undefined.', '', 0, '2026-08-14 05:28:03', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-3ebdfe9b-1', NULL, '🐾 New Pet Registered', 'Milo (Dog) has been registered by undefined.', '', 0, '2026-08-14 05:18:43', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-4bf90985-6', NULL, '📅 New Appointment Booked', 'Jacky  with Dr. ak on 2026-08-13 at 10:00:00.', 'Appointment', 0, '2026-08-13 13:52:17', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-4e6b8e37-0', NULL, '🧪 Lab Test Ordered: Bella', 'Dr. Sarah Jenkins ordered Ultrasound for patient Bella. Task pending in Assistant queue.', 'System', 0, '2026-08-14 05:35:57', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-4fadee4a-b', 'u3-doctor1', '📅 New Appointment Scheduled', 'Patient: aaa (Owner: dasdad) — on 2026-08-12 at 20:30:00. Please review your schedule.', 'Appointment', 0, '2026-08-12 10:26:13', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-7193a377-3', NULL, '📅 New Appointment Booked', 'aaa with Dr. Dr. Alan Grant on 2026-08-12 at 20:30:00.', 'Appointment', 0, '2026-08-12 10:26:13', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-7ca56dea-3', NULL, '🧪 Lab Test Ordered: Bella', 'Dr. Sarah Jenkins ordered Blood Test for patient Bella. Task pending in Assistant queue.', 'System', 0, '2026-08-14 05:35:57', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-85fe3750-c', 'usr-65987e84', '📅 New Appointment Scheduled', 'Patient: aaa (Owner: dasdad) — on 2026-08-13 at 21:00:00. Please review your schedule.', 'Appointment', 0, '2026-08-13 13:31:34', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-897f664f-1', 'usr-65987e84', '📅 New Appointment Scheduled', 'Patient: Jacky  (Owner: Varun) — on 2026-08-13 at 10:00:00. Please review your schedule.', 'Appointment', 0, '2026-08-13 13:52:17', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-9dcc1cba-9', NULL, '🐾 New Pet Registered', 'Max (Dog) has been registered by undefined.', '', 0, '2026-08-12 10:20:52', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-bf0bc836-1', NULL, '📅 New Appointment Booked', 'aaa with Dr. ak on 2026-08-13 at 21:00:00.', 'Appointment', 0, '2026-08-13 13:31:34', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-d2658492-e', 'usr-65987e84', '📅 New Appointment Scheduled', 'Patient: Bella (Owner: Perera) — on 2026-08-21 at 10:00:00. Please review your schedule.', 'Appointment', 0, '2026-08-14 05:30:17', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-e1f26f50-b', NULL, '🧪 Lab Test Ordered: Bella', 'Dr. Sarah Jenkins ordered X-Ray for patient Bella. Task pending in Assistant queue.', 'System', 0, '2026-08-14 05:35:57', 'clinic-1');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`, `clinic_id`) VALUES ('notif-eeabc383-d', NULL, '📅 New Appointment Booked', 'Bella with Dr. ak on 2026-08-21 at 10:00:00.', 'Appointment', 0, '2026-08-14 05:30:17', 'clinic-1');

-- Structure for table `pet_owners` --
DROP TABLE IF EXISTS `pet_owners`;
CREATE TABLE `pet_owners` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `nic` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `telephone` varchar(20) DEFAULT NULL,
  `mobile` varchar(20) NOT NULL,
  `address` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nic` (`nic`),
  KEY `fk_owners_clinic` (`clinic_id`),
  CONSTRAINT `fk_owners_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `pet_owners` --
INSERT INTO `pet_owners` (`id`, `name`, `nic`, `email`, `telephone`, `mobile`, `address`, `created_at`, `clinic_id`) VALUES ('own-6b4db7c3', 'Perera', '199403810291', 'perera@example.com', '+94 11 234 5678', '+94 77 456 7890', 'No. 25, Lake Road, Colombo 05, Sri Lanka', '2026-08-14 05:15:05', 'clinic-1');
INSERT INTO `pet_owners` (`id`, `name`, `nic`, `email`, `telephone`, `mobile`, `address`, `created_at`, `clinic_id`) VALUES ('own-7ac05428', 'dasdad', 'dfsdfs', 'dfsfs@gmail.com', '645645664', '6546464646', NULL, '2026-08-12 10:17:41', 'clinic-1');
INSERT INTO `pet_owners` (`id`, `name`, `nic`, `email`, `telephone`, `mobile`, `address`, `created_at`, `clinic_id`) VALUES ('own-dac65856', 'Varun', 'Indian ', 'V@gmail.com', NULL, '4545454565', 'Delhi', '2026-08-13 13:49:11', 'clinic-1');

-- Structure for table `pets` --
DROP TABLE IF EXISTS `pets`;
CREATE TABLE `pets` (
  `id` varchar(36) NOT NULL,
  `owner_id` varchar(36) DEFAULT NULL,
  `microchip_number` varchar(100) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `species` varchar(100) DEFAULT NULL,
  `breed` varchar(100) DEFAULT NULL,
  `gender` enum('Male','Female') DEFAULT NULL,
  `age` varchar(50) DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `previous_medical_history` text DEFAULT NULL,
  `last_vaccination` date DEFAULT NULL,
  `last_deworming` date DEFAULT NULL,
  `photo_url` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  `neutered_status` varchar(10) DEFAULT 'No',
  PRIMARY KEY (`id`),
  KEY `owner_id` (`owner_id`),
  KEY `fk_pets_clinic` (`clinic_id`),
  CONSTRAINT `fk_pets_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pets_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `pet_owners` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `pets` --
INSERT INTO `pets` (`id`, `owner_id`, `microchip_number`, `name`, `species`, `breed`, `gender`, `age`, `weight`, `previous_medical_history`, `last_vaccination`, `last_deworming`, `photo_url`, `created_at`, `clinic_id`, `neutered_status`) VALUES ('PET-2026-223EAF35', 'own-dac65856', NULL, 'Jacky ', 'Dog', 'Hjs', 'Male', '2', '15.00', NULL, NULL, NULL, NULL, '2026-08-13 13:51:34', 'clinic-1', '0');
INSERT INTO `pets` (`id`, `owner_id`, `microchip_number`, `name`, `species`, `breed`, `gender`, `age`, `weight`, `previous_medical_history`, `last_vaccination`, `last_deworming`, `photo_url`, `created_at`, `clinic_id`, `neutered_status`) VALUES ('PET-2026-262BBEBF', 'own-6b4db7c3', '985141234567891', 'Milo', 'Dog', 'Persian', 'Male', '2 years', '4.80', 'Previous mild respiratory infection, fully recovered. Routine vaccinations up to date.', '2026-06-19 18:30:00', '2026-07-09 18:30:00', 'http://localhost:5000/uploads/c7d8b1da-bffa-46f3-9c89-11b6ab1a94f1.jpg', '2026-08-14 05:18:43', 'clinic-1', '1');
INSERT INTO `pets` (`id`, `owner_id`, `microchip_number`, `name`, `species`, `breed`, `gender`, `age`, `weight`, `previous_medical_history`, `last_vaccination`, `last_deworming`, `photo_url`, `created_at`, `clinic_id`, `neutered_status`) VALUES ('PET-2026-837EB3C8', 'own-6b4db7c3', '985141234567892', 'Bella', 'Dog', 'Golden Retriever', 'Male', '5 years', '25.20', 'History of mild ear infection treated successfully. No current health concerns.', NULL, NULL, 'http://localhost:5000/uploads/98e967b6-f5e0-4cef-8df2-ce70e7703e45.jpg', '2026-08-14 05:28:03', 'clinic-1', '1');
INSERT INTO `pets` (`id`, `owner_id`, `microchip_number`, `name`, `species`, `breed`, `gender`, `age`, `weight`, `previous_medical_history`, `last_vaccination`, `last_deworming`, `photo_url`, `created_at`, `clinic_id`, `neutered_status`) VALUES ('PET-2026-AF7721C3', 'own-7ac05428', '343255353555', 'aaa', 'Dog', 'eewrwer', 'Male', NULL, NULL, NULL, NULL, NULL, NULL, '2026-08-12 10:21:39', 'clinic-1', 'No');
INSERT INTO `pets` (`id`, `owner_id`, `microchip_number`, `name`, `species`, `breed`, `gender`, `age`, `weight`, `previous_medical_history`, `last_vaccination`, `last_deworming`, `photo_url`, `created_at`, `clinic_id`, `neutered_status`) VALUES ('PET-2026-ED7F06DB', 'own-7ac05428', NULL, 'Max', 'Dog', 'Labrador', 'Male', '3', '22.00', NULL, NULL, NULL, NULL, '2026-08-12 10:20:52', 'clinic-1', 'No');

-- Structure for table `prescriptions` --
DROP TABLE IF EXISTS `prescriptions`;
CREATE TABLE `prescriptions` (
  `id` varchar(36) NOT NULL,
  `encounter_id` varchar(36) DEFAULT NULL,
  `medicine_name` varchar(255) NOT NULL,
  `dosage` varchar(100) DEFAULT NULL,
  `frequency` varchar(100) DEFAULT NULL,
  `duration` varchar(100) DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  `inventory_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `encounter_id` (`encounter_id`),
  KEY `fk_prescriptions_clinic` (`clinic_id`),
  KEY `fk_prescriptions_inventory` (`inventory_id`),
  CONSTRAINT `fk_prescriptions_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_prescriptions_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE SET NULL,
  CONSTRAINT `prescriptions_ibfk_1` FOREIGN KEY (`encounter_id`) REFERENCES `clinical_encounters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `prescriptions` --
INSERT INTO `prescriptions` (`id`, `encounter_id`, `medicine_name`, `dosage`, `frequency`, `duration`, `instructions`, `clinic_id`, `inventory_id`) VALUES ('06eb4dd1-190b-4265-a87f-53b52024148b', '2583b2dc-2c32-4d7e-b4e0-7dc72a45cde8', 'Omeprazole 10 mg – once daily for 5 days; Metoclopramide 5 mg – as directed for 3 days', NULL, NULL, NULL, NULL, 'clinic-1', NULL);
INSERT INTO `prescriptions` (`id`, `encounter_id`, `medicine_name`, `dosage`, `frequency`, `duration`, `instructions`, `clinic_id`, `inventory_id`) VALUES ('57104e59-f59e-4615-a3df-6afd7377eab9', 'e41d43ad-8f5a-4936-96d3-211a6fae2466', 'Otic ear drops – 4 drops in affected ear twice daily for 7 days', NULL, NULL, NULL, NULL, 'clinic-1', NULL);

-- Structure for table `saas_payments` --
DROP TABLE IF EXISTS `saas_payments`;
CREATE TABLE `saas_payments` (
  `id` varchar(36) NOT NULL,
  `clinic_admin_id` varchar(36) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `status` enum('Successful','Pending','Failed','Refunded') DEFAULT 'Pending',
  `payment_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `razorpay_order_id` varchar(255) DEFAULT NULL,
  `razorpay_payment_id` varchar(255) DEFAULT NULL,
  `razorpay_signature` varchar(255) DEFAULT NULL,
  `currency` varchar(10) DEFAULT 'INR',
  `invoice_number` varchar(100) DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `plan_id` varchar(36) DEFAULT NULL,
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  PRIMARY KEY (`id`),
  KEY `clinic_admin_id` (`clinic_admin_id`),
  KEY `fk_pay_clinic` (`clinic_id`),
  CONSTRAINT `fk_pay_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `saas_payments_ibfk_1` FOREIGN KEY (`clinic_admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `saas_payments` --
INSERT INTO `saas_payments` (`id`, `clinic_admin_id`, `amount`, `status`, `payment_date`, `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `currency`, `invoice_number`, `payment_method`, `plan_id`, `clinic_id`) VALUES ('7b71263d-d755-4c26-83e2-60a9df03ede3', 'dea9a0c3-31af-4359-a012-cb744a94e2ef', '1.00', 'Successful', '2026-08-08 17:07:38', 'order_TNLtsaOb3eIiLl', 'pay_TNLupAp1vOQpxf', 'bb132005d1457fac90aaa3386cf6165c96468c16bef5c437cbe0782529c8175a', 'INR', 'INV-1786208931003', 'Razorpay', 'testing', 'clinic-1');
INSERT INTO `saas_payments` (`id`, `clinic_admin_id`, `amount`, `status`, `payment_date`, `razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`, `currency`, `invoice_number`, `payment_method`, `plan_id`, `clinic_id`) VALUES ('b453e953-1fdc-4c0e-a882-bf48ff06e965', '80a1dd34-8246-4a62-b861-8b04a127ce43', '1299.00', 'Pending', '2026-08-12 09:46:25', 'order_TOoflE68NrHrl9', NULL, NULL, 'INR', NULL, NULL, 'pro', '65783694-c111-4bfd-b48c-d76d6cda9ccd');

-- Structure for table `saas_plans` --
DROP TABLE IF EXISTS `saas_plans`;
CREATE TABLE `saas_plans` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration_days` int(11) NOT NULL,
  `features` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `saas_plans` --
INSERT INTO `saas_plans` (`id`, `name`, `price`, `duration_days`, `features`, `is_active`, `created_at`) VALUES ('plan-free-trial', 'Free Trial', '0.00', 7, 'Full access for 7 days,No credit card required', 1, '2026-08-08 16:21:27');
INSERT INTO `saas_plans` (`id`, `name`, `price`, `duration_days`, `features`, `is_active`, `created_at`) VALUES ('plan-pro', 'Pro', '1.00', 30, 'Advanced features,Unlimited pets,Multi-clinic support', 1, '2026-08-08 16:21:27');
INSERT INTO `saas_plans` (`id`, `name`, `price`, `duration_days`, `features`, `is_active`, `created_at`) VALUES ('plan-standard', 'Standard', '1.00', 30, 'Complete features,Up to 500 pets,WhatsApp+Email reminders', 1, '2026-08-08 16:21:27');
INSERT INTO `saas_plans` (`id`, `name`, `price`, `duration_days`, `features`, `is_active`, `created_at`) VALUES ('plan-starter', 'Starter', '1.00', 30, 'Basic clinic management,Up to 100 pets,Email reminders', 1, '2026-08-08 16:21:27');
INSERT INTO `saas_plans` (`id`, `name`, `price`, `duration_days`, `features`, `is_active`, `created_at`) VALUES ('plan-testing', 'Testing Plan', '1.00', 30, 'For razorpay testing,1 Rs payment', 1, '2026-08-08 16:32:53');

-- Structure for table `saas_subscriptions` --
DROP TABLE IF EXISTS `saas_subscriptions`;
CREATE TABLE `saas_subscriptions` (
  `id` varchar(36) NOT NULL,
  `clinic_admin_id` varchar(36) DEFAULT NULL,
  `plan_id` varchar(36) DEFAULT NULL,
  `status` enum('Active','Expired','Cancelled','Trial') DEFAULT 'Trial',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `razorpay_payment_id` varchar(255) DEFAULT NULL,
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  PRIMARY KEY (`id`),
  KEY `clinic_admin_id` (`clinic_admin_id`),
  KEY `plan_id` (`plan_id`),
  KEY `fk_sub_clinic` (`clinic_id`),
  CONSTRAINT `fk_sub_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `saas_subscriptions_ibfk_1` FOREIGN KEY (`clinic_admin_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `saas_subscriptions_ibfk_2` FOREIGN KEY (`plan_id`) REFERENCES `saas_plans` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `saas_subscriptions` --
INSERT INTO `saas_subscriptions` (`id`, `clinic_admin_id`, `plan_id`, `status`, `start_date`, `end_date`, `created_at`, `razorpay_payment_id`, `clinic_id`) VALUES ('8fc75931-f3a4-4473-9469-4585233fe27a', 'ccc7a061-74e7-4158-8c5a-ab9eb7ec8013', 'plan-free-trial', 'Active', '2026-08-07 18:30:00', '2026-08-14 18:30:00', '2026-08-08 17:25:22', NULL, 'clinic-1');
INSERT INTO `saas_subscriptions` (`id`, `clinic_admin_id`, `plan_id`, `status`, `start_date`, `end_date`, `created_at`, `razorpay_payment_id`, `clinic_id`) VALUES ('af5a249a-4ee5-43ed-bc6b-d3eb4970c6f5', 'ba06097f-b161-42c9-8632-3e784aed75f9', 'plan-free-trial', 'Trial', '1899-11-29 18:38:50', '2026-08-11 18:30:00', '2026-08-12 16:06:02', NULL, '67214fa4-4ef6-43a0-b798-3188be8c2318');
INSERT INTO `saas_subscriptions` (`id`, `clinic_admin_id`, `plan_id`, `status`, `start_date`, `end_date`, `created_at`, `razorpay_payment_id`, `clinic_id`) VALUES ('SUB-1786527864226-743', '6cb68fe1-cb71-42bd-aada-3df707094b56', 'plan-free-trial', 'Active', '2026-08-11 18:30:00', '2026-08-18 18:30:00', '2026-08-12 09:44:24', NULL, '611dabff-1c91-4b0c-a477-3bf04ccbb5eb');
INSERT INTO `saas_subscriptions` (`id`, `clinic_admin_id`, `plan_id`, `status`, `start_date`, `end_date`, `created_at`, `razorpay_payment_id`, `clinic_id`) VALUES ('SUB-1786527984408-923', '80a1dd34-8246-4a62-b861-8b04a127ce43', 'plan-free-trial', 'Active', '2026-08-11 18:30:00', '2026-08-18 18:30:00', '2026-08-12 09:46:24', NULL, '65783694-c111-4bfd-b48c-d76d6cda9ccd');

-- Structure for table `saas_support_tickets` --
DROP TABLE IF EXISTS `saas_support_tickets`;
CREATE TABLE `saas_support_tickets` (
  `id` varchar(50) NOT NULL,
  `clinic_admin_id` varchar(36) DEFAULT NULL,
  `clinic` varchar(255) NOT NULL,
  `adminName` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `priority` varchar(50) NOT NULL,
  `category` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Open',
  `updated` varchar(100) NOT NULL,
  `messages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`messages`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `saas_support_tickets` --
INSERT INTO `saas_support_tickets` (`id`, `clinic_admin_id`, `clinic`, `adminName`, `email`, `subject`, `priority`, `category`, `status`, `updated`, `messages`, `created_at`) VALUES ('TKT-1634891290342-108', NULL, 'Happy Pets Clinic', 'Dr. Sarah Connor', 'sarah.connor@happypets.com', 'Invoice Download', 'Low', 'Billing', 'Closed', '5 Aug 2026', '[{"sender":"Admin","text":"How do I download duplicate copies of receipts from the billing section?","time":"05/08/26, 11:30 am","isUser":true},{"sender":"Superadmin","text":"You can go to Billing & POS and click the download icon next to any invoice.","time":"05/08/26, 11:45 am","isUser":false}]', '2026-08-12 06:33:07');
INSERT INTO `saas_support_tickets` (`id`, `clinic_admin_id`, `clinic`, `adminName`, `email`, `subject`, `priority`, `category`, `status`, `updated`, `messages`, `created_at`) VALUES ('TKT-1786006334931-390', NULL, 'Anytime Fitness Vet', 'Rahul Sharma', 'anytimefitness@gmail.com', 'Payment Issue', 'Medium', 'Billing', 'Replied', '8 Aug 2026', '[{"sender":"Admin","text":"There is an issue with the payment gateway. It shows error on checkout.","time":"06/08/26, 2:22 pm","isUser":true},{"sender":"Superadmin","text":"We have identified the issue. It will be resolved within 24 hours.","time":"06/08/26, 2:27 pm","isUser":false}]', '2026-08-12 06:33:07');
INSERT INTO `saas_support_tickets` (`id`, `clinic_admin_id`, `clinic`, `adminName`, `email`, `subject`, `priority`, `category`, `status`, `updated`, `messages`, `created_at`) VALUES ('TKT-1786516748835-911', 'u1-admin', 'My Veterinary Clinic', 'admin@vetcarepro.com', 'admin@vetcarepro.com', 'tabs not working ', 'Medium', 'Technical', 'Replied', '12/08/26', '[{"sender":"Admin","text":"when we book appointment there is not found any  appointmnet on the dashboard.","time":"12/08/26, 12:09 pm","isUser":true},{"sender":"Superadmin","text":"ok we will check","time":"12/08/26, 12:11 pm","isUser":false}]', '2026-08-12 06:39:08');
INSERT INTO `saas_support_tickets` (`id`, `clinic_admin_id`, `clinic`, `adminName`, `email`, `subject`, `priority`, `category`, `status`, `updated`, `messages`, `created_at`) VALUES ('TKT-1786519345674-932', '7ebf6a10-5a99-49a6-8e73-71d7b4859a43', 'My Veterinary Clinic', 'kushakriti524@gmail.com', 'kushakriti524@gmail.com', 'Payment Issue', 'High', 'Billing', 'Open', '12/08/26', '[{"sender":"Admin","text":"ndiu jhdiud jdnuhdid ndio","time":"12/08/26, 12:52 pm","isUser":true}]', '2026-08-12 07:22:25');
INSERT INTO `saas_support_tickets` (`id`, `clinic_admin_id`, `clinic`, `adminName`, `email`, `subject`, `priority`, `category`, `status`, `updated`, `messages`, `created_at`) VALUES ('TKT-1786520083061-289', '7ebf6a10-5a99-49a6-8e73-71d7b4859a43', 'My Veterinary Clinic', 'kushakriti524@gmail.com', 'kushakriti524@gmail.com', 'Add new Feature', 'Medium', 'Feature Request', 'Open', '12/08/26', '[{"sender":"Admin","text":"nknisd nduhd ijshduiwd sdud ","time":"12/08/26, 01:04 pm","isUser":true}]', '2026-08-12 07:34:43');
INSERT INTO `saas_support_tickets` (`id`, `clinic_admin_id`, `clinic`, `adminName`, `email`, `subject`, `priority`, `category`, `status`, `updated`, `messages`, `created_at`) VALUES ('TKT-1786520518193-233', 'u1-admin', 'Default Clinic', 'Dr. Sarah Jenkins', 'admin@vetcarepro.com', 'Not Working ', 'Medium', 'Account', 'Open', '12/08/26', '[{"sender":"Admin","text":"asdffhjk hedjkuy yhueiks","time":"12/08/26, 01:11 pm","isUser":true}]', '2026-08-12 07:41:58');
INSERT INTO `saas_support_tickets` (`id`, `clinic_admin_id`, `clinic`, `adminName`, `email`, `subject`, `priority`, `category`, `status`, `updated`, `messages`, `created_at`) VALUES ('TKT-1892017382103-512', NULL, 'Paws & Claws Care', 'Dr. John Doe', 'john.doe@pawsclaws.com', 'Login Issue', 'High', 'Technical', 'Open', '7 Aug 2026', '[{"sender":"Admin","text":"Dashboard is loading slow today and showing connection timeout errors repeatedly.","time":"07/08/26, 10:15 am","isUser":true}]', '2026-08-12 06:33:07');

-- Structure for table `saas_system_settings` --
DROP TABLE IF EXISTS `saas_system_settings`;
CREATE TABLE `saas_system_settings` (
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Structure for table `super_admins` --
DROP TABLE IF EXISTS `super_admins`;
CREATE TABLE `super_admins` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'SUPER_ADMIN',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `super_admins` --
INSERT INTO `super_admins` (`id`, `email`, `password_hash`, `role`, `created_at`, `updated_at`) VALUES ('sa-1', 'superadmin@vetcarepro.com', '$2b$10$5uk009IgwBrONcwj.0Sjt.vTDRkJpLRvcinB136TTVlYobX1sTfbW', 'SUPER_ADMIN', '2026-08-06 18:15:52', '2026-08-06 18:15:52');

-- Structure for table `treatment_notes` --
DROP TABLE IF EXISTS `treatment_notes`;
CREATE TABLE `treatment_notes` (
  `id` varchar(36) NOT NULL,
  `encounter_id` varchar(36) DEFAULT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `note_type` enum('observation','medication','vitals') NOT NULL,
  `note_text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  PRIMARY KEY (`id`),
  KEY `encounter_id` (`encounter_id`),
  KEY `user_id` (`user_id`),
  KEY `fk_treatment_clinic` (`clinic_id`),
  CONSTRAINT `fk_treatment_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE,
  CONSTRAINT `treatment_notes_ibfk_1` FOREIGN KEY (`encounter_id`) REFERENCES `clinical_encounters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `treatment_notes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Structure for table `users` --
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Admin','Manager','Doctor','Receptionist','Vet Assistant') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `profile_image` longtext DEFAULT NULL,
  `status` enum('Active','Inactive','On Leave','Terminated') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `selected_plan` varchar(20) DEFAULT 'free-trial',
  `trial_expiry_date` date DEFAULT NULL,
  `subscription_status` enum('trial','active','expired') DEFAULT 'trial',
  `clinic_id` varchar(36) DEFAULT 'clinic-1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  KEY `fk_users_clinic` (`clinic_id`),
  CONSTRAINT `fk_users_clinic` FOREIGN KEY (`clinic_id`) REFERENCES `clinics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `users` --
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('6cb68fe1-cb71-42bd-aada-3df707094b56', 'Dr. Test', 'landingtest1@example.com', '$2b$10$6gx7TFAweuUBfT/1hhwa3uHHvKxR7wa0iWSjk.ue89qQ9DgRPXQwK', 'Admin', '9876543211', 'landingtest146', NULL, NULL, 'Active', '2026-08-12 09:44:24', '2026-08-12 09:44:24', 'free-trial', NULL, 'trial', '611dabff-1c91-4b0c-a477-3bf04ccbb5eb');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('7ebf6a10-5a99-49a6-8e73-71d7b4859a43', 'Owner Kumar', 'kushakriti524@gmail.com', '$2b$10$FBsgbf0JBTDNojZfVtsfmuU3gOjV8gQRU.blk6Lvkw3odq1hS.yOC', 'Admin', '5201364789', 'kushakriti52482', NULL, NULL, 'Active', '2026-08-11 12:51:00', '2026-08-11 12:51:00', 'free-trial', NULL, 'trial', '6eee1bbc-ca0b-40fb-971a-d30b36f753dc');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('80a1dd34-8246-4a62-b861-8b04a127ce43', 'Dr. Pro Admin', 'proadmin1@example.com', '$2b$10$2pVNXdh0Nsr07jhxcZKR4ODvTCkdZX12dx8ZcL.tryFX4eBvoISme', 'Admin', '9876543299', 'proadmin17', NULL, NULL, 'Active', '2026-08-12 09:46:24', '2026-08-12 09:46:24', 'free-trial', NULL, 'trial', '65783694-c111-4bfd-b48c-d76d6cda9ccd');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('ba06097f-b161-42c9-8632-3e784aed75f9', 'Test Admin', 'test1786550762719@test.com', '$2b$10$cRiI57iwa6cIMxW9A06PTuTTnrs.Ay8oZGn.JJVJhzb7CBEh2Bez2', 'Admin', '9550762719', 'test178655076271920', NULL, NULL, 'Active', '2026-08-12 16:06:02', '2026-08-12 16:06:02', 'free-trial', NULL, 'trial', '67214fa4-4ef6-43a0-b798-3188be8c2318');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('c9f0635d-925b-4c3e-a522-f616be525598', 'ABCD Kumar', 'efga42687@gmail.com', '$2b$10$EXGfqu0p9c.KRQqM.z7zNevbCXLhhxQTzXMFbIKneSLE3GmRCuVhm', 'Admin', '6302145897', 'efga4268788', NULL, NULL, 'Active', '2026-08-12 07:44:41', '2026-08-12 07:44:41', 'free-trial', NULL, 'trial', '347e7a3f-0910-425a-937d-877df4a89303');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('ccc7a061-74e7-4158-8c5a-ab9eb7ec8013', 'admin', 'mask12527@gmail.com', '$2b$10$W.amXUvPgGSf/4KDatOQGu0CURzfhromtmT0znexX8opc0L4GQSei', 'Doctor', '917458889966', 'mask1252778', 'Dermatology', 'data:image/jpeg;base64,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', 'Active', '2026-08-08 17:25:22', '2026-08-14 05:44:25', 'free-trial', '2026-08-14 18:30:00', 'trial', 'clinic-1');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('dea9a0c3-31af-4359-a012-cb744a94e2ef', 'Clinic Admin', 'astp750@gmail.com', '$2b$10$zurtmYKQioSbo0musVIdK.QWzn46GqcZ4.00utfNyib3UXq2rKqEa', 'Admin', '2013654789', 'astp75093', NULL, NULL, 'Active', '2026-08-08 17:07:38', '2026-08-08 17:07:38', 'testing', '2026-08-14 18:30:00', 'trial', 'clinic-1');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('e9e44c99-48fd-46c3-8d6c-80a9cb135e6d', 'Test Admin', 'test1786452432082@test.com', '$2b$10$QQoR9UKhZAhzQxxdxIw.XunqWooOIATF.oHi1mLljxCLVoih/U5rS', 'Admin', '1234567890', 'test178645243208262', NULL, NULL, 'Active', '2026-08-11 12:47:12', '2026-08-11 12:47:12', 'free-trial', NULL, 'trial', 'cba43d1a-e9ee-49a1-901a-ca73bf4a8a54');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('ee9b739f-9be4-4370-9250-db5b51009f31', 'fnfjknfjeoijw', 'nfdfnd@gmail.com', '$2b$10$jbec3kzWE.cpGsUgapBjZeQqqKAjTGWH4QpSpfmKDETOSnKO9yhOC', 'Admin', '7458012369', 'nfdfnd57', NULL, NULL, 'Active', '2026-08-07 05:39:51', '2026-08-07 05:39:51', 'free-trial', NULL, 'trial', 'clinic-1');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('u1-admin', 'Dr. Sarah Jenkins', 'admin@vetcarepro.com', '$2b$10$l4lSVlr8arXCtyQgVTNMKehWkjIrJNQfzN3NFAx4bMVdVzt/cWi2y', 'Admin', '555-0100', NULL, NULL, NULL, 'Active', '2026-08-06 17:29:24', '2026-08-06 17:42:33', 'free-trial', NULL, 'trial', 'clinic-1');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('u2-manager', 'Michael Ross', 'manager@vetcarepro.com', '$2b$10$l4lSVlr8arXCtyQgVTNMKehWkjIrJNQfzN3NFAx4bMVdVzt/cWi2y', 'Manager', '555-0101', NULL, NULL, NULL, 'Active', '2026-08-06 17:29:24', '2026-08-06 17:42:33', 'free-trial', NULL, 'trial', 'clinic-1');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('u3-doctor1', 'Dr. Alan Grant', 'demodoctor@gmail.com', '$2b$10$l4lSVlr8arXCtyQgVTNMKehWkjIrJNQfzN3NFAx4bMVdVzt/cWi2y', 'Doctor', '555-0102', NULL, NULL, NULL, 'Active', '2026-08-06 17:29:24', '2026-08-06 17:43:14', 'free-trial', NULL, 'trial', 'clinic-1');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('u4-doctor2', 'Dr. Ellie Sattler', 'esattler@veterinary.com', '$2b$10$l4lSVlr8arXCtyQgVTNMKehWkjIrJNQfzN3NFAx4bMVdVzt/cWi2y', 'Doctor', '555-0103', NULL, NULL, NULL, 'Active', '2026-08-06 17:29:24', '2026-08-06 17:42:33', 'free-trial', NULL, 'trial', 'clinic-1');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('u5-recept', 'Jessica Day', 'demoR@gmail.com', '$2b$10$l4lSVlr8arXCtyQgVTNMKehWkjIrJNQfzN3NFAx4bMVdVzt/cWi2y', 'Receptionist', '555-0104', NULL, NULL, NULL, 'Active', '2026-08-06 17:29:24', '2026-08-06 17:43:14', 'free-trial', NULL, 'trial', 'clinic-1');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('u6-vetasst', 'Todd Chavez', 'assistant@vetcarepro.com', '$2b$10$l4lSVlr8arXCtyQgVTNMKehWkjIrJNQfzN3NFAx4bMVdVzt/cWi2y', 'Vet Assistant', '555-0105', NULL, NULL, NULL, 'Active', '2026-08-06 17:29:24', '2026-08-06 17:43:14', 'free-trial', NULL, 'trial', 'clinic-1');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `username`, `department`, `profile_image`, `status`, `created_at`, `updated_at`, `selected_plan`, `trial_expiry_date`, `subscription_status`, `clinic_id`) VALUES ('usr-65987e84', 'ak', 'ak@gmail.com', '$2b$10$BQ9mxNh1QHbX1bCW7/1tjeQF4/rxvoWyNHSMbQ/cUni7xv5cHLj5u', 'Doctor', '4242424454', 'akku', 'Surgery', 'data:image/jpeg;base64,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', 'Active', '2026-08-12 16:32:14', '2026-08-12 16:36:13', 'free-trial', NULL, 'trial', 'clinic-1');

SET FOREIGN_KEY_CHECKS=1;
