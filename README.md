# RxManager Pro - Enterprise Hospital Pharmacy ERP

A high-performance, production-grade Hospital Pharmacy Enterprise Resource Planning (ERP) system built using Java Spring Boot and MongoDB Cloud Atlas. This system is designed to streamline end-to-end pharmacy operations, tracking everything from supplier supply chains to critical, doctor-authorized ward distributions while enforcing rigorous financial accounting, medical safety controls, and statutory tax compliance.

## 🚀 Key Features

### 📦 Smart Inventory & Supply Chain Management
* **Smart Stock Guard:** Implements a safety reserve threshold (20 units) for all life-saving medications. Standard counter sales are capped when stock hits this buffer to guarantee availability for critical emergencies.
* **Emergency Overrides & Indents:** Restricts high-priority stock issuance via **Emergency Ward Indents**, requiring explicit **Doctor Authorization** and creating a clear cryptographic audit trail.
* **Supplier & Purchase Management:** Tracks purchase orders, automatically recalculates batch numbers, updates cost prices on stock intake, handles purchase returns, and flags upcoming medication expiry dates proactively.

### 💼 Comprehensive Financial & Tax Ledger
* **Balanced Daily Cashbooks:** Automates closing balances by segregating day-to-day pharmacy counter cash inflows from credit balances and internal hospital usage.
* **GSTR-3B & Tax Compliance Reporting:** Computes operational SGST/CGST breakdown parameters automatically on sales logs, generating structured ledger sheets for clean monthly **GSTR-3B filings**.
* **Credit Customer Management:** Tracks running credit accounts for recurring hospital patients, logs outstanding debt sheets, and archives step-by-step payment history.
* **Automated Billing & PDF Invoicing:** Uses an internal styling template to generate and export professional, GST-compliant transactional PDFs for all commercial transactions.

### 👥 Staff, Attendance & Security Architecture
* **Role-Based Access Control (RBAC):** Restricts operational views using hard security boundaries across enterprise profiles (`ROLE_ADMIN`, `ROLE_PHARMACIST`, and `ROLE_STAFF`).
* **Staff Profiles & Attendance Monitoring:** Tracks employee shifts, clock-in/clock-out timestamps, daily attendance records, and integrates referral audit tracking for transparent staff performance reviews.

---

## 🛠️ Tech Stack

* **Backend Core:** Java 24, Spring Boot 3.5.13, Spring Data MongoDB
* **Security Infrastructure:** Spring Security 6.5, JSON Web Tokens (JWT Validation Gateway), BCrypt Password Hashing
* **Database & Cloud Storage:** MongoDB Atlas (Cloud Tiered Replication Cluster Architecture)
* **Reporting Engines:** iText PDF Core, Apache POI (Excel Ledger Data Extractions)
* **Build Automation & Tools:** Maven, Project Lombok, Developer LiveReload Configuration Tools

---

## 📈 Enterprise Accounting & Distribution Logic

The application divides the asset flow into three distinct pipelines to ensure real-time inventory balances precisely match cash registers:

1. **Commercial Counter Sales:** Direct customer-facing transactions calculating flat tax indices, processing credit extensions, and issuing point-of-sale receipts.
2. **Normal Ward Indents:** Standard internal inventory distribution responding to routine floor nurse restocking requests across standard hospital wings.
3. **Emergency Indents:** Rapid-response medical asset allocation bypassing general access gates using forced Doctor ID validation logs.

---

## ⚙️ Environment Configuration

The ERP infrastructure utilizes explicit environment routing flags. Create an enterprise environment variable profile or a secure `.env` file in your root workspace:

```properties
# ── ☁️ PRODUCTION MONGO ATLAS CLOUD CONFIG ──
spring.data.mongodb.uri=mongodb+srv://utpalkumarkashyap53_db_user:j053oBrdsSCDKumH@rxmanagerclusture.nkxqgol.mongodb.net/pharmacy_erp?retryWrites=true&w=majority&tlsAllowInvalidHostnames=true

# ── 📧 AUTOMATED MAIL SERVICE CONFIG (SMTP) ──
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_system_automation_email@gmail.com
spring.mail.password=your_google_app_specific_password

# ── 💾 ENHANCED BACKUP INFRASTRUCTURE ──
backup.email.recipient=admin_audit_mailbox@gmail.com
backup.dir=D:/Java-Workspace/pharmacy-erp/Backups

# ── 🔑 JWT SECURITY GATEWAY VALIDATION ──
jwt.secret=your_super_secret_high_entropy_256_bit_signing_key_here
jwt.expiration-ms=86400000
