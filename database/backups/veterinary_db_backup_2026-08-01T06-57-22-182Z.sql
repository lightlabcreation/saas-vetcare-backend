-- VETERINARY DB BACKUP GENERATED AT 2026-08-01T06:57:22.221Z
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
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reminder_sent` tinyint(1) DEFAULT 0,
  `next_reminder_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pet_id` (`pet_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `appointments` --
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `created_at`, `reminder_sent`, `next_reminder_date`) VALUES ('APT-2026-2229064D', 'PET-2026-FF77BD4F', 'usr-70a2733f', '2026-06-06 18:30:00', '02:00:00', 'Home Visit', 'Pending', NULL, '2026-06-06 12:18:26', 0, NULL);
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `created_at`, `reminder_sent`, `next_reminder_date`) VALUES ('APT-2026-46734990', 'PET-2026-F8DCF56B', NULL, '2026-06-08 18:30:00', '10:00:00', 'Clinic Visit', 'Pending', NULL, '2026-06-06 06:06:44', 1, NULL);
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `created_at`, `reminder_sent`, `next_reminder_date`) VALUES ('APT-2026-4D3BCEBD', 'PET-2026-5C6C3173', NULL, '2026-06-06 18:30:00', '09:30:00', 'Clinic Visit', 'Cancelled', NULL, '2026-06-04 12:03:17', 0, NULL);
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `created_at`, `reminder_sent`, `next_reminder_date`) VALUES ('APT-2026-4D9B2E38', 'PET-2026-5C6C3173', 'usr-70a2733f', '2026-08-01 18:30:00', '00:00:10', 'Home Visit', 'Pending', NULL, '2026-07-30 06:39:51', 0, NULL);
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `created_at`, `reminder_sent`, `next_reminder_date`) VALUES ('APT-2026-6ED1C4D3', 'PET-2026-5C6C3173', NULL, '2026-06-06 18:30:00', '09:00:00', 'Clinic Visit', 'Pending', NULL, '2026-06-06 05:48:24', 0, NULL);
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `created_at`, `reminder_sent`, `next_reminder_date`) VALUES ('APT-2026-8C48C8EB', 'PET-2026-5C6C3173', NULL, '2026-06-17 18:30:00', '09:30:00', 'Clinic Visit', 'Pending', NULL, '2026-06-04 12:04:28', 1, NULL);
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `created_at`, `reminder_sent`, `next_reminder_date`) VALUES ('APT-2026-9355EC95', 'PET-2026-DCE16CD9', 'usr-d837bb2d', '2026-07-30 18:30:00', '21:00:00', 'Clinic Visit', 'Pending', NULL, '2026-07-30 07:57:04', 0, NULL);
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `created_at`, `reminder_sent`, `next_reminder_date`) VALUES ('APT-2026-A857BD49', 'PET-2026-F3E038DF', 'usr-d837bb2d', '2026-06-05 18:30:00', '21:00:00', 'Clinic Visit', 'Pending', NULL, '2026-06-06 12:14:55', 0, NULL);
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `created_at`, `reminder_sent`, `next_reminder_date`) VALUES ('APT-2026-AAF714C9', 'PET-2026-6D6B774B', 'usr-d837bb2d', '2026-07-30 18:30:00', '09:00:00', 'Home Visit', 'Pending', NULL, '2026-07-30 06:33:26', 0, NULL);
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `created_at`, `reminder_sent`, `next_reminder_date`) VALUES ('APT-2026-B6912692', 'PET-2026-FF77BD4F', 'usr-d837bb2d', '2026-06-06 18:30:00', '09:00:00', 'Clinic Visit', 'Pending', NULL, '2026-06-06 12:15:49', 0, NULL);
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `created_at`, `reminder_sent`, `next_reminder_date`) VALUES ('APT-2026-B977E504', 'PET-2026-F8DCF56B', NULL, '2026-06-04 18:30:00', '00:00:03', 'Home Visit', 'Completed', NULL, '2026-06-06 06:22:10', 0, NULL);
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `created_at`, `reminder_sent`, `next_reminder_date`) VALUES ('APT-2026-C0476E2D', 'PET-2026-5C6C3173', NULL, '2026-06-04 18:30:00', '09:00:00', 'Clinic Visit', 'Pending', NULL, '2026-06-04 12:01:24', 0, NULL);
INSERT INTO `appointments` (`id`, `pet_id`, `doctor_id`, `appointment_date`, `appointment_time`, `appointment_type`, `status`, `notes`, `created_at`, `reminder_sent`, `next_reminder_date`) VALUES ('APT-2026-F73BDE00', 'PET-2026-5C6C3173', NULL, '2026-06-04 18:30:00', '00:00:09', 'Clinic Visit', 'Pending', NULL, '2026-06-04 12:01:52', 0, NULL);

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
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `attendance` --
INSERT INTO `attendance` (`id`, `user_id`, `attendance_date`, `check_in`, `check_out`, `working_hours`, `status`) VALUES ('att-29b5c05a', 'usr-asst', '2026-06-05 18:30:00', '17:05:52', '17:06:04', '0.02', 'Present');
INSERT INTO `attendance` (`id`, `user_id`, `attendance_date`, `check_in`, `check_out`, `working_hours`, `status`) VALUES ('att-44c228a2', 'usr-admin', '2026-06-07 18:30:00', '12:09:45', NULL, NULL, 'Present');
INSERT INTO `attendance` (`id`, `user_id`, `attendance_date`, `check_in`, `check_out`, `working_hours`, `status`) VALUES ('att-700a35c9', 'usr-mgr', '2026-06-05 18:30:00', '16:55:09', '16:56:46', '0.02', 'Present');
INSERT INTO `attendance` (`id`, `user_id`, `attendance_date`, `check_in`, `check_out`, `working_hours`, `status`) VALUES ('att-76082a12', 'usr-admin', '2026-06-05 18:30:00', '16:54:44', '17:02:24', '0.13', 'Present');
INSERT INTO `attendance` (`id`, `user_id`, `attendance_date`, `check_in`, `check_out`, `working_hours`, `status`) VALUES ('att-e0423bd3', 'usr-9eabad8d', '2026-06-05 18:30:00', '16:27:28', '16:36:41', '0.15', 'Present');
INSERT INTO `attendance` (`id`, `user_id`, `attendance_date`, `check_in`, `check_out`, `working_hours`, `status`) VALUES ('att-efd47b3f', 'usr-admin', '2026-07-29 18:30:00', '12:41:18', NULL, NULL, 'Present');
INSERT INTO `attendance` (`id`, `user_id`, `attendance_date`, `check_in`, `check_out`, `working_hours`, `status`) VALUES ('att-fbe31cd7', 'usr-mgr', '2026-06-07 18:30:00', '12:10:04', NULL, NULL, 'Present');

-- Structure for table `clinic_settings` --
DROP TABLE IF EXISTS `clinic_settings`;
CREATE TABLE `clinic_settings` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `primaryThemeColor` varchar(50) NOT NULL,
  `logo` varchar(255) DEFAULT NULL,
  `autoEmail` tinyint(1) DEFAULT 1,
  `reminderTime` varchar(10) DEFAULT '24h',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `clinic_settings` --
INSERT INTO `clinic_settings` (`id`, `name`, `email`, `phone`, `address`, `primaryThemeColor`, `logo`, `autoEmail`, `reminderTime`) VALUES (1, 'VetCare Pro Animal Hospital', 'info@vetcarepro.com', '12345785', 'No. 45, Temple Road, Colombo 07, Sri Lanka', '#4caea2', 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=150', 1, '24h');

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
  PRIMARY KEY (`id`),
  KEY `pet_id` (`pet_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `clinical_encounters_ibfk_1` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `clinical_encounters_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `clinical_encounters` --
INSERT INTO `clinical_encounters` (`id`, `pet_id`, `doctor_id`, `encounter_date`, `complaint`, `duration`, `symptoms`, `diagnosis`, `treatment`, `follow_up`) VALUES ('3433d970-b1be-43db-9b9a-d8af6cb2fae4', 'PET-2026-F8DCF56B', NULL, '2026-06-05 18:30:00', 'Vomiting', '2 days', 'Lethargic and dehydrated', 'Mild dehydration', 'Subcutaneous fluids', NULL);
INSERT INTO `clinical_encounters` (`id`, `pet_id`, `doctor_id`, `encounter_date`, `complaint`, `duration`, `symptoms`, `diagnosis`, `treatment`, `follow_up`) VALUES ('3addb4cf-9e9b-4907-a0a2-6241a9ae5e02', 'PET-2026-F8DCF56B', NULL, '2026-06-05 18:30:00', 'lethargic,reduced appetite,mild intermittent vomiting ', '2 days', 'The owner reports that Max has been lethargic, has had a reduced appetite, and has been experiencing mild intermittent vomiting for the past 48 hours.', 'Mildly dehydrated (approximately 5% - 6% skin tent).', 'Administered 250 mL of Lactated Ringer''s Solution (LRS) subcutaneously. Administered one injection of Cerenia (1 mg/kg) for nausea/vomiting.', ' Schedule a follow-up appointment in 48 hours to evaluate hydration and assess if his appetite has improved.');
INSERT INTO `clinical_encounters` (`id`, `pet_id`, `doctor_id`, `encounter_date`, `complaint`, `duration`, `symptoms`, `diagnosis`, `treatment`, `follow_up`) VALUES ('4aa8a593-6483-4a53-8fbc-d1902a7daa4c', 'PET-2026-5C6C3173', NULL, '2026-06-05 18:30:00', 'Fever', '2 days', 'Low appetite', 'Mild Infection', 'Antibiotics', NULL);
INSERT INTO `clinical_encounters` (`id`, `pet_id`, `doctor_id`, `encounter_date`, `complaint`, `duration`, `symptoms`, `diagnosis`, `treatment`, `follow_up`) VALUES ('ab635019-9495-4291-9949-7eba2490428e', 'PET-2026-FF77BD4F', 'usr-d837bb2d', '2026-06-05 18:30:00', ' lethargic,vomited ', '2 days', 'Owner reports Bella has been lethargic, has had a decreased appetite for 2 days, and vomited twice this morning.', ' Suspected Acute Gastroenteritis (likely dietary indiscretion / garbage gut).', 'Recommended Complete Blood Count (CBC) and Serum Biochemistry Profile to evaluate organ function and electrolyte levels.Administered Abdominal Radiographs (X-rays) to rule out GI obstruction.', 'Recheck appointment scheduled for June 8, 2026.');

-- Structure for table `diagnostic_reports` --
DROP TABLE IF EXISTS `diagnostic_reports`;
CREATE TABLE `diagnostic_reports` (
  `id` varchar(36) NOT NULL,
  `encounter_id` varchar(36) DEFAULT NULL,
  `report_type` enum('Blood Test','X-Ray','Ultrasound','PDF Report') NOT NULL,
  `file_url` varchar(255) NOT NULL,
  `uploaded_by` varchar(36) DEFAULT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `encounter_id` (`encounter_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `diagnostic_reports_ibfk_1` FOREIGN KEY (`encounter_id`) REFERENCES `clinical_encounters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `diagnostic_reports_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `diagnostic_reports` --
INSERT INTO `diagnostic_reports` (`id`, `encounter_id`, `report_type`, `file_url`, `uploaded_by`, `uploaded_at`) VALUES ('3681d992-4a4b-423d-bdd5-42dcb1e80832', '3addb4cf-9e9b-4907-a0a2-6241a9ae5e02', 'Blood Test', 'CBC ', NULL, '2026-06-06 07:15:03');
INSERT INTO `diagnostic_reports` (`id`, `encounter_id`, `report_type`, `file_url`, `uploaded_by`, `uploaded_at`) VALUES ('5e1d408b-2e4c-49cd-9627-f4b6e8414b5d', 'ab635019-9495-4291-9949-7eba2490428e', 'Ultrasound', 'Serum Biochemistry Profile', 'usr-d837bb2d', '2026-06-06 12:27:59');
INSERT INTO `diagnostic_reports` (`id`, `encounter_id`, `report_type`, `file_url`, `uploaded_by`, `uploaded_at`) VALUES ('b15d3ab0-58c7-47d0-9ca3-8252316f30f8', '3addb4cf-9e9b-4907-a0a2-6241a9ae5e02', 'Ultrasound', 'Abdomen Ultrasound', NULL, '2026-06-06 07:15:03');
INSERT INTO `diagnostic_reports` (`id`, `encounter_id`, `report_type`, `file_url`, `uploaded_by`, `uploaded_at`) VALUES ('d990873b-5279-4e16-93e8-169d154f4e3b', '3433d970-b1be-43db-9b9a-d8af6cb2fae4', 'Blood Test', 'CBC Panel', NULL, '2026-06-06 06:54:48');
INSERT INTO `diagnostic_reports` (`id`, `encounter_id`, `report_type`, `file_url`, `uploaded_by`, `uploaded_at`) VALUES ('ea31a161-fbd5-467e-a564-001cac955fcd', 'ab635019-9495-4291-9949-7eba2490428e', 'Blood Test', 'Complete Blood Count (CBC)', 'usr-d837bb2d', '2026-06-06 12:27:59');

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

-- Data for table `email_reminders` --
INSERT INTO `email_reminders` (`id`, `appointment_id`, `recipient_email`, `scheduled_at`, `sent_at`, `status`) VALUES ('rem-2e483254', 'APT-2026-46734990', 'demoshree@gmail.com', '2026-06-08 07:18:06', '2026-06-08 07:18:06', 'Sent');
INSERT INTO `email_reminders` (`id`, `appointment_id`, `recipient_email`, `scheduled_at`, `sent_at`, `status`) VALUES ('rem-67e870b2', 'APT-2026-8C48C8EB', 'demo1@gmail.com', '2026-06-08 07:18:55', '2026-06-08 07:18:55', 'Sent');

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
  PRIMARY KEY (`id`),
  KEY `appointment_id` (`appointment_id`),
  KEY `pet_id` (`pet_id`),
  KEY `owner_id` (`owner_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `home_visits_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `home_visits_ibfk_2` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `home_visits_ibfk_3` FOREIGN KEY (`owner_id`) REFERENCES `pet_owners` (`id`) ON DELETE CASCADE,
  CONSTRAINT `home_visits_ibfk_4` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `home_visits` --
INSERT INTO `home_visits` (`id`, `appointment_id`, `pet_id`, `owner_id`, `doctor_id`, `address`, `travel_fee`, `visit_status`, `notes`) VALUES ('HV-2026-17A219F7', 'APT-2026-2229064D', 'PET-2026-FF77BD4F', 'own-456303f9-1847-4f2f-a0d9-dabf4b69', 'usr-70a2733f', 'Street, demo', '1000.00', 'Scheduled', NULL);
INSERT INTO `home_visits` (`id`, `appointment_id`, `pet_id`, `owner_id`, `doctor_id`, `address`, `travel_fee`, `visit_status`, `notes`) VALUES ('HV-2026-71EBFA03', 'APT-2026-4D9B2E38', 'PET-2026-5C6C3173', 'own-c4ac3125-4b8c-409d-bac8-fc1c8f6a', 'usr-70a2733f', 'demo street', '0.00', 'Scheduled', NULL);
INSERT INTO `home_visits` (`id`, `appointment_id`, `pet_id`, `owner_id`, `doctor_id`, `address`, `travel_fee`, `visit_status`, `notes`) VALUES ('HV-2026-F3A82F0C', 'APT-2026-B977E504', 'PET-2026-F8DCF56B', 'own-d720258f-03a2-4d16-a402-fe662c4e', NULL, 'street city', '100.00', 'Completed', NULL);

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Structure for table `invoice_line_items` --
DROP TABLE IF EXISTS `invoice_line_items`;
CREATE TABLE `invoice_line_items` (
  `id` varchar(36) NOT NULL,
  `invoice_id` varchar(36) DEFAULT NULL,
  `inventory_id` varchar(36) DEFAULT NULL,
  `quantity` int(11) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  KEY `inventory_id` (`inventory_id`),
  CONSTRAINT `invoice_line_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invoice_line_items_ibfk_2` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `invoice_line_items` --
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `inventory_id`, `quantity`, `unit_price`, `total`) VALUES ('02f3ac10-7ae1-41fb-9cf8-b6c84182573e', 'INV-2026-0001', NULL, 1, '45.00', '45.00');
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `inventory_id`, `quantity`, `unit_price`, `total`) VALUES ('09f36077-9da9-4a12-9387-7ef225e78d3f', 'INV-2026-0003', NULL, 1, '45.00', '45.00');
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `inventory_id`, `quantity`, `unit_price`, `total`) VALUES ('4f171298-198a-49e8-b7db-03b159c766cd', 'INV-2026-0003', NULL, 2, '50.00', '100.00');
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `inventory_id`, `quantity`, `unit_price`, `total`) VALUES ('644788ea-5475-4768-a155-e39bb61e782d', 'INV-2026-0002', NULL, 1, '45.00', '45.00');
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `inventory_id`, `quantity`, `unit_price`, `total`) VALUES ('71c4e015-c3e4-4352-b19d-7b4800d3adaa', 'INV-2026-0001', NULL, 1, '0.00', '0.00');
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `inventory_id`, `quantity`, `unit_price`, `total`) VALUES ('726349c1-4dbb-492b-a766-653ef4806fea', 'INV-2026-0005', NULL, 4, '45.00', '180.00');
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `inventory_id`, `quantity`, `unit_price`, `total`) VALUES ('75a773f4-824a-4f81-ba45-70eb8911c40e', 'INV-2026-0002', NULL, 1, '50.00', '50.00');
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `inventory_id`, `quantity`, `unit_price`, `total`) VALUES ('8ed3bd00-8c6f-45d2-9f65-2ad039cf5c75', 'INV-2026-0005', NULL, 3, '20.00', '60.00');
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `inventory_id`, `quantity`, `unit_price`, `total`) VALUES ('b19c0be8-bb68-4827-b15c-2ad3d8018fa0', 'INV-2026-0002', NULL, 1, '0.00', '0.00');
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `inventory_id`, `quantity`, `unit_price`, `total`) VALUES ('d352e86b-29af-4d21-8d89-e9f882f36d1c', 'INV-2026-0005', NULL, 1, '45.00', '45.00');
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `inventory_id`, `quantity`, `unit_price`, `total`) VALUES ('da572da2-dfd3-466d-a12a-61a47072725e', 'INV-2026-0003', NULL, 1, '0.00', '0.00');
INSERT INTO `invoice_line_items` (`id`, `invoice_id`, `inventory_id`, `quantity`, `unit_price`, `total`) VALUES ('e62c9597-d0b9-46bb-80a9-4d38166d6be8', 'INV-2026-0004', NULL, 1, '100.00', '100.00');

-- Structure for table `invoices` --
DROP TABLE IF EXISTS `invoices`;
CREATE TABLE `invoices` (
  `id` varchar(36) NOT NULL,
  `owner_id` varchar(36) DEFAULT NULL,
  `pet_id` varchar(36) DEFAULT NULL,
  `doctor_id` varchar(36) DEFAULT NULL,
  `invoice_date` date NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `tax_amount` decimal(10,2) DEFAULT 0.00,
  `discount_amount` decimal(10,2) DEFAULT 0.00,
  `grand_total` decimal(10,2) NOT NULL,
  `status` enum('Paid','Pending','Cancelled') DEFAULT 'Pending',
  `encounter_id` varchar(36) DEFAULT NULL,
  `home_visit_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `owner_id` (`owner_id`),
  KEY `pet_id` (`pet_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `fk_invoice_encounter` (`encounter_id`),
  KEY `fk_invoice_home_visit` (`home_visit_id`),
  CONSTRAINT `fk_invoice_encounter` FOREIGN KEY (`encounter_id`) REFERENCES `clinical_encounters` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_invoice_home_visit` FOREIGN KEY (`home_visit_id`) REFERENCES `home_visits` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `pet_owners` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_2` FOREIGN KEY (`pet_id`) REFERENCES `pets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `invoices_ibfk_3` FOREIGN KEY (`doctor_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `invoices` --
INSERT INTO `invoices` (`id`, `owner_id`, `pet_id`, `doctor_id`, `invoice_date`, `subtotal`, `tax_amount`, `discount_amount`, `grand_total`, `status`, `encounter_id`, `home_visit_id`) VALUES ('INV-2026-0001', 'own-c4ac3125-4b8c-409d-bac8-fc1c8f6a', 'PET-2026-5C6C3173', NULL, '2026-06-05 18:30:00', '45.00', '0.00', '0.00', '45.00', 'Paid', '4aa8a593-6483-4a53-8fbc-d1902a7daa4c', NULL);
INSERT INTO `invoices` (`id`, `owner_id`, `pet_id`, `doctor_id`, `invoice_date`, `subtotal`, `tax_amount`, `discount_amount`, `grand_total`, `status`, `encounter_id`, `home_visit_id`) VALUES ('INV-2026-0002', 'own-d720258f-03a2-4d16-a402-fe662c4e', 'PET-2026-F8DCF56B', NULL, '2026-06-05 18:30:00', '95.00', '0.00', '0.00', '95.00', 'Pending', '3433d970-b1be-43db-9b9a-d8af6cb2fae4', NULL);
INSERT INTO `invoices` (`id`, `owner_id`, `pet_id`, `doctor_id`, `invoice_date`, `subtotal`, `tax_amount`, `discount_amount`, `grand_total`, `status`, `encounter_id`, `home_visit_id`) VALUES ('INV-2026-0003', 'own-d720258f-03a2-4d16-a402-fe662c4e', 'PET-2026-F8DCF56B', NULL, '2026-06-05 18:30:00', '145.00', '0.00', '0.00', '145.00', 'Pending', '3addb4cf-9e9b-4907-a0a2-6241a9ae5e02', NULL);
INSERT INTO `invoices` (`id`, `owner_id`, `pet_id`, `doctor_id`, `invoice_date`, `subtotal`, `tax_amount`, `discount_amount`, `grand_total`, `status`, `encounter_id`, `home_visit_id`) VALUES ('INV-2026-0004', 'own-d720258f-03a2-4d16-a402-fe662c4e', 'PET-2026-F8DCF56B', NULL, '2026-06-05 18:30:00', '100.00', '0.00', '0.00', '100.00', 'Paid', NULL, 'HV-2026-F3A82F0C');
INSERT INTO `invoices` (`id`, `owner_id`, `pet_id`, `doctor_id`, `invoice_date`, `subtotal`, `tax_amount`, `discount_amount`, `grand_total`, `status`, `encounter_id`, `home_visit_id`) VALUES ('INV-2026-0005', 'own-456303f9-1847-4f2f-a0d9-dabf4b69', 'PET-2026-FF77BD4F', 'usr-d837bb2d', '2026-06-05 18:30:00', '285.00', '19.20', '0.00', '304.20', 'Paid', 'ab635019-9495-4291-9949-7eba2490428e', NULL);

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
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `notifications` --
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES ('notif-0adf26da-0', NULL, '📅 New Appointment Booked', 'petu with Dr. Demo doctor on 2026-07-31 at 21:00:00.', 'Appointment', 0, '2026-07-30 07:57:04');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES ('notif-1', 'u1-admin', 'Low Stock Alert', 'Royal Canin Gastrointestinal 2kg is running low (Current: 12, Threshold: 5).', 'Inventory', 0, '2026-06-06 07:44:50');
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`, `created_at`) VALUES ('notif-93e75464-b', 'usr-d837bb2d', '📅 New Appointment Scheduled', 'Patient: petu (Owner: bhakti) — on 2026-07-31 at 21:00:00. Please review your schedule.', 'Appointment', 0, '2026-07-30 07:57:04');

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
  PRIMARY KEY (`id`),
  UNIQUE KEY `nic` (`nic`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `pet_owners` --
INSERT INTO `pet_owners` (`id`, `name`, `nic`, `email`, `telephone`, `mobile`, `address`, `created_at`) VALUES ('own-456303f9-1847-4f2f-a0d9-dabf4b69', 'Priya', '75395145684', 'priya@gmail.com', '45124512', '75844452155', 'highway street, demo city', '2026-06-06 12:04:15');
INSERT INTO `pet_owners` (`id`, `name`, `nic`, `email`, `telephone`, `mobile`, `address`, `created_at`) VALUES ('own-a38fe183-bfaa-4a65-bf6b-10e5fd79', 'bhakti', '789456121', 'bhakti@gmail.com', '784623232', '22222555544', 'demo street indore', '2026-07-30 07:08:07');
INSERT INTO `pet_owners` (`id`, `name`, `nic`, `email`, `telephone`, `mobile`, `address`, `created_at`) VALUES ('own-a928b195-62bf-4d17-87e6-516be8a6', 'Ritika', '78945612548', 'ritika@gmail.com', '758496122', '7894561230', 'Demo street, city ', '2026-06-06 12:04:49');
INSERT INTO `pet_owners` (`id`, `name`, `nic`, `email`, `telephone`, `mobile`, `address`, `created_at`) VALUES ('own-c4ac3125-4b8c-409d-bac8-fc1c8f6a', 'demo1', '12345689', 'demo1@gmail.com', '12345568797', '449451548', 'sfgjf sfhehf', '2026-06-04 11:39:43');
INSERT INTO `pet_owners` (`id`, `name`, `nic`, `email`, `telephone`, `mobile`, `address`, `created_at`) VALUES ('own-d720258f-03a2-4d16-a402-fe662c4e', 'demo Shree', '1234657890', 'demoshree@gmail.com', '9876543210', '9876543210', 'street , demo city', '2026-06-06 06:04:10');

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
  `neutered_status` tinyint(1) DEFAULT 0,
  `age` varchar(50) DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `previous_medical_history` text DEFAULT NULL,
  `last_vaccination` date DEFAULT NULL,
  `last_deworming` date DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `owner_id` (`owner_id`),
  CONSTRAINT `pets_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `pet_owners` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `pets` --
INSERT INTO `pets` (`id`, `owner_id`, `microchip_number`, `name`, `species`, `breed`, `gender`, `neutered_status`, `age`, `weight`, `previous_medical_history`, `last_vaccination`, `last_deworming`, `photo_url`, `created_at`) VALUES ('PET-2026-0FD3A47B', 'own-a928b195-62bf-4d17-87e6-516be8a6', NULL, 'Whiskers Live', 'Cat', NULL, 'Male', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-06 12:14:19');
INSERT INTO `pets` (`id`, `owner_id`, `microchip_number`, `name`, `species`, `breed`, `gender`, `neutered_status`, `age`, `weight`, `previous_medical_history`, `last_vaccination`, `last_deworming`, `photo_url`, `created_at`) VALUES ('PET-2026-5C6C3173', 'own-c4ac3125-4b8c-409d-bac8-fc1c8f6a', '4587845452', 'max', 'Dog', 'GOLDEN ', 'Male', 0, '1.2 YR', '10.00', NULL, '2026-04-01 18:30:00', '2026-05-14 18:30:00', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=300', '2026-06-04 11:40:47');
INSERT INTO `pets` (`id`, `owner_id`, `microchip_number`, `name`, `species`, `breed`, `gender`, `neutered_status`, `age`, `weight`, `previous_medical_history`, `last_vaccination`, `last_deworming`, `photo_url`, `created_at`) VALUES ('PET-2026-6D6B774B', 'own-d720258f-03a2-4d16-a402-fe662c4e', '123456789012345', 'Whiskers', 'Cat', NULL, 'Male', 0, NULL, NULL, NULL, NULL, NULL, NULL, '2026-06-06 11:53:00');
INSERT INTO `pets` (`id`, `owner_id`, `microchip_number`, `name`, `species`, `breed`, `gender`, `neutered_status`, `age`, `weight`, `previous_medical_history`, `last_vaccination`, `last_deworming`, `photo_url`, `created_at`) VALUES ('PET-2026-DCE16CD9', 'own-a38fe183-bfaa-4a65-bf6b-10e5fd79', '744654211', 'petu', 'Exotic', 'sjkfj', 'Male', 0, '5', '6.00', NULL, '2026-07-23 18:30:00', '2026-07-28 18:30:00', NULL, '2026-07-30 07:10:17');
INSERT INTO `pets` (`id`, `owner_id`, `microchip_number`, `name`, `species`, `breed`, `gender`, `neutered_status`, `age`, `weight`, `previous_medical_history`, `last_vaccination`, `last_deworming`, `photo_url`, `created_at`) VALUES ('PET-2026-F3E038DF', 'own-a928b195-62bf-4d17-87e6-516be8a6', '74984546545', 'Facebook', 'Cat', 'Persian cat', 'Female', 0, '1.2 Yr', '3.00', NULL, '2026-03-10 18:30:00', '2026-05-13 18:30:00', 'http://localhost:5000/uploads/bbfe97ad-c6c2-4235-8f23-fc1298620111.jpg', '2026-06-06 12:08:11');
INSERT INTO `pets` (`id`, `owner_id`, `microchip_number`, `name`, `species`, `breed`, `gender`, `neutered_status`, `age`, `weight`, `previous_medical_history`, `last_vaccination`, `last_deworming`, `photo_url`, `created_at`) VALUES ('PET-2026-F8DCF56B', 'own-d720258f-03a2-4d16-a402-fe662c4e', '4567156454', 'pups ', 'Dog', 'Pomeranian', 'Male', 0, '0.6 month', '4.00', NULL, '2026-04-11 18:30:00', '2026-05-24 18:30:00', 'http://localhost:5000/uploads/3c277cfa-254d-404f-b9ae-9b3fb0b00491.jpg', '2026-06-06 06:06:02');
INSERT INTO `pets` (`id`, `owner_id`, `microchip_number`, `name`, `species`, `breed`, `gender`, `neutered_status`, `age`, `weight`, `previous_medical_history`, `last_vaccination`, `last_deworming`, `photo_url`, `created_at`) VALUES ('PET-2026-FF77BD4F', 'own-456303f9-1847-4f2f-a0d9-dabf4b69', '457897454565', 'sheru', 'Dog', 'German Shepherd', 'Male', 0, '1 yr', '6.00', NULL, '2026-04-08 18:30:00', '2025-12-15 18:30:00', 'http://localhost:5000/uploads/d5bb9b54-a3de-44f0-bdb7-30ef98a4ca46.jpg', '2026-06-06 12:11:26');

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
  `inventory_id` varchar(36) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `encounter_id` (`encounter_id`),
  KEY `fk_prescription_inventory` (`inventory_id`),
  CONSTRAINT `fk_prescription_inventory` FOREIGN KEY (`inventory_id`) REFERENCES `inventory` (`id`) ON DELETE SET NULL,
  CONSTRAINT `prescriptions_ibfk_1` FOREIGN KEY (`encounter_id`) REFERENCES `clinical_encounters` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `prescriptions` --
INSERT INTO `prescriptions` (`id`, `encounter_id`, `medicine_name`, `dosage`, `frequency`, `duration`, `instructions`, `inventory_id`) VALUES ('41cc6672-2b5d-4435-aabc-74a630d0ef5f', '3addb4cf-9e9b-4907-a0a2-6241a9ae5e02', 'Omeprazole: 20 mg (1 tablet by mouth daily for 5 days)Prescription Diet: Gastrointestinal low-fat wet food (feed small, frequent meals for 3 days).', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `prescriptions` (`id`, `encounter_id`, `medicine_name`, `dosage`, `frequency`, `duration`, `instructions`, `inventory_id`) VALUES ('480977ec-b646-4ad6-885f-060b8e8c797c', '3433d970-b1be-43db-9b9a-d8af6cb2fae4', 'Laxatone Paste', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `prescriptions` (`id`, `encounter_id`, `medicine_name`, `dosage`, `frequency`, `duration`, `instructions`, `inventory_id`) VALUES ('ba1c2cc4-0cae-4d58-adb3-62fca3ddc0ad', 'ab635019-9495-4291-9949-7eba2490428e', 'Famotidine: 10 mg by mouth (PO) every 24 hours for  5 days (for gastric acid suppression).Prescription Diet: Transition to a bland diet (boiled chicken and white rice) for  3–5 days, gradually returning to normal kibble.', NULL, NULL, NULL, NULL, NULL);
INSERT INTO `prescriptions` (`id`, `encounter_id`, `medicine_name`, `dosage`, `frequency`, `duration`, `instructions`, `inventory_id`) VALUES ('f2657d0e-d1b2-4c12-8464-a39af38bbabb', '4aa8a593-6483-4a53-8fbc-d1902a7daa4c', 'Antibiotics', NULL, NULL, NULL, NULL, NULL);

-- Structure for table `treatment_notes` --
DROP TABLE IF EXISTS `treatment_notes`;
CREATE TABLE `treatment_notes` (
  `id` varchar(36) NOT NULL,
  `encounter_id` varchar(36) DEFAULT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `note_type` enum('observation','medication','vitals') NOT NULL,
  `note_text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `encounter_id` (`encounter_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `treatment_notes_ibfk_1` FOREIGN KEY (`encounter_id`) REFERENCES `clinical_encounters` (`id`) ON DELETE CASCADE,
  CONSTRAINT `treatment_notes_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `treatment_notes` --
INSERT INTO `treatment_notes` (`id`, `encounter_id`, `user_id`, `note_type`, `note_text`, `created_at`) VALUES ('2e2eebe4-91a2-4fc7-8a4b-391f133e8d1d', '3433d970-b1be-43db-9b9a-d8af6cb2fae4', NULL, 'medication', 'Omeprazole: 20 mg (1 tablet by mouth daily for 5 days)Prescription Diet: Gastrointestinal low-fat wet food (feed small, frequent meals for 3 days).', '2026-06-06 07:17:52');
INSERT INTO `treatment_notes` (`id`, `encounter_id`, `user_id`, `note_type`, `note_text`, `created_at`) VALUES ('5530503d-1abe-48c8-98f3-7d5c58f23061', '3433d970-b1be-43db-9b9a-d8af6cb2fae4', NULL, 'observation', 'The owner reports that Max has been lethargic, has had a reduced appetite, and has been experiencing mild intermittent vomiting for the past 48 hours.', '2026-06-06 07:17:30');
INSERT INTO `treatment_notes` (`id`, `encounter_id`, `user_id`, `note_type`, `note_text`, `created_at`) VALUES ('6c8689e8-5650-4889-81cf-6aca0c2aa1be', '3433d970-b1be-43db-9b9a-d8af6cb2fae4', NULL, 'observation', 'Patient is resting comfortably', '2026-06-06 06:57:56');

-- Structure for table `users` --
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('Admin','Manager','Doctor','Receptionist','Vet Assistant') NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `status` enum('Active','Inactive','On Leave','Terminated') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `username` varchar(50) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Data for table `users` --
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `profile_image`, `status`, `created_at`, `updated_at`, `username`, `department`) VALUES ('u1-admin', 'Dr. Sarah Jenkins', 'admin@veterinary.com', '$2b$10$hashedpassworddummy', 'Admin', '555-0100', NULL, 'Active', '2026-06-06 07:44:50', '2026-06-06 07:44:50', NULL, NULL);
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `profile_image`, `status`, `created_at`, `updated_at`, `username`, `department`) VALUES ('usr-70a2733f', 'Dr. Riya R', 'riya@gmail.com', '$2b$10$JNIdbkdD/GhAb8K9cqgQJeU49abLbcyQBjcm7jUOq6j37S0g8.wcm', 'Doctor', '7894561230', NULL, 'Active', '2026-06-06 12:17:36', '2026-07-30 07:51:21', 'riya', 'General Practice');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `profile_image`, `status`, `created_at`, `updated_at`, `username`, `department`) VALUES ('usr-9eabad8d', 'demo Receptionist', 'demoR@gmail.com', '$2b$10$8jg.fhdr1Mv2GpqSqirVT.lG3n1hfLxHs4aUgfpfENaY2WHpCLISK', 'Receptionist', '456789215644', 'Active', 'Active', '2026-06-06 10:18:51', '2026-06-06 11:26:50', 'Receptionist', 'Front Desk');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `profile_image`, `status`, `created_at`, `updated_at`, `username`, `department`) VALUES ('usr-admin', 'Admin User', 'admin@vetcarepro.com', '$2b$10$SANWxQ4SBys0iJXPAn/QaeEJf8hgFjlCeAQ4kLZuFBlvZObUA3x66', 'Admin', '555-01', NULL, 'Active', '2026-06-04 10:56:05', '2026-06-04 10:56:05', NULL, NULL);
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `profile_image`, `status`, `created_at`, `updated_at`, `username`, `department`) VALUES ('usr-asst', 'Assistant User', 'assistant@vetcarepro.com', '$2b$10$SANWxQ4SBys0iJXPAn/QaeEJf8hgFjlCeAQ4kLZuFBlvZObUA3x66', 'Vet Assistant', '555-05', NULL, 'Active', '2026-06-04 10:56:05', '2026-06-04 10:56:05', NULL, NULL);
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `profile_image`, `status`, `created_at`, `updated_at`, `username`, `department`) VALUES ('usr-d837bb2d', 'Demo doctor', 'demodoctor@gmail.com', '$2b$10$8v.yU9F1BUY3QcnyfqtCtOsFaXKrZRjF.F7i6t2U/GEd88M1T80SW', 'Doctor', '7894561231', NULL, 'Active', '2026-06-06 10:17:39', '2026-06-08 07:00:57', 'doctor2', 'Surgery');
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `profile_image`, `status`, `created_at`, `updated_at`, `username`, `department`) VALUES ('usr-mgr', 'Manager User', 'manager@vetcarepro.com', '$2b$10$SANWxQ4SBys0iJXPAn/QaeEJf8hgFjlCeAQ4kLZuFBlvZObUA3x66', 'Manager', '555-02', NULL, 'Active', '2026-06-04 10:56:05', '2026-06-04 10:56:05', NULL, NULL);

SET FOREIGN_KEY_CHECKS=1;
