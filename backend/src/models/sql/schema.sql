-- USERS & & AUTH
CREATE TABLE IF NOT EXISTS Users (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(255) UNIQUE NOT NULL,
    Password_Hash VARCHAR(255) NOT NULL,
    Role ENUM('Patient', 'Doctor', 'Admin') NOT NULL,
    Reference_ID INT, -- Can trigger lookups to Patient/Doctor tables
    Is_Active BOOLEAN DEFAULT TRUE,
    Created_At DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- PATIENT
CREATE TABLE IF NOT EXISTS Patient (
    Patient_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT UNIQUE, -- Link to Auth
    Full_Name VARCHAR(255) NOT NULL,
    DOB DATE NOT NULL,
    -- Age is calculated virtually in logic or view, but schema asked for column. 
    -- VIRTUAL column support depends on MySQL version. If 5.7+, works. Safe to use.
    Age INT, 
    Gender ENUM('Male', 'Female', 'Other') NOT NULL,
    Blood_Group VARCHAR(5),
    Phone_No VARCHAR(20),
    Lifestyle_Activity VARCHAR(255),
    Diet_Pref VARCHAR(255),
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID)
);

-- DOCTOR
CREATE TABLE IF NOT EXISTS Doctor (
    Doctor_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT UNIQUE, -- Link to Auth
    Full_Name VARCHAR(255) NOT NULL,
    Specialization VARCHAR(255),
    License_No VARCHAR(50) UNIQUE NOT NULL,
    Gender ENUM('Male', 'Female', 'Other'),
    Years_Experience INT,
    Consult_Hrs VARCHAR(100),
    Hospital_Affiliation VARCHAR(255),
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID)
);

-- CLINICAL_RECORD
CREATE TABLE IF NOT EXISTS Clinical_Record (
    Record_ID INT AUTO_INCREMENT PRIMARY KEY,
    Patient_ID INT NOT NULL,
    Doctor_ID INT NOT NULL,
    Visit_Date DATETIME DEFAULT CURRENT_TIMESTAMP,
    Diagnosis_ICD10 VARCHAR(50),
    Symptoms_Text TEXT,
    Doctor_Remarks TEXT,
    Follow_Up_Date DATE,
    FOREIGN KEY (Patient_ID) REFERENCES Patient(Patient_ID),
    FOREIGN KEY (Doctor_ID) REFERENCES Doctor(Doctor_ID)
);

-- MEDICATION
CREATE TABLE IF NOT EXISTS Medication (
    Med_ID INT AUTO_INCREMENT PRIMARY KEY,
    Drug_Name VARCHAR(255) NOT NULL,
    Generic_Name VARCHAR(255),
    Dosage_Form VARCHAR(50),
    Side_Effects TEXT,
    Contraindications TEXT
);

-- PRESCRIPTION
CREATE TABLE IF NOT EXISTS Prescription (
    Record_ID INT NOT NULL,
    Med_ID INT NOT NULL,
    Dosage VARCHAR(100),
    Frequency VARCHAR(100),
    Duration VARCHAR(100),
    PRIMARY KEY (Record_ID, Med_ID),
    FOREIGN KEY (Record_ID) REFERENCES Clinical_Record(Record_ID),
    FOREIGN KEY (Med_ID) REFERENCES Medication(Med_ID)
);

-- UPLOAD_METADATA
CREATE TABLE IF NOT EXISTS Upload_Metadata (
    Upload_ID INT AUTO_INCREMENT PRIMARY KEY,
    Patient_ID INT NOT NULL,
    File_Name VARCHAR(255) NOT NULL,
    File_Size_KB FLOAT,
    Upload_Timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    Total_Rows INT,
    Processing_Status ENUM('Pending', 'Processed', 'Failed') DEFAULT 'Pending',
    FOREIGN KEY (Patient_ID) REFERENCES Patient(Patient_ID)
);

-- APPOINTMENT
CREATE TABLE IF NOT EXISTS Appointment (
    Appt_ID INT AUTO_INCREMENT PRIMARY KEY,
    Patient_ID INT NOT NULL,
    Doctor_ID INT NOT NULL,
    Trigger_Insight_ID VARCHAR(50), -- Linked to MongoDB ObjectId string
    Scheduled_Time DATETIME NOT NULL,
    Status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    Visit_Reason VARCHAR(255),
    Priority_Level ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    FOREIGN KEY (Patient_ID) REFERENCES Patient(Patient_ID),
    FOREIGN KEY (Doctor_ID) REFERENCES Doctor(Doctor_ID)
);
