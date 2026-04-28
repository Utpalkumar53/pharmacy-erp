# Pharmacy ERP (Hospital Management System)

A professional Java Spring Boot ERP designed for hospital pharmacies to manage inventory, sales, and internal ward distribution with a focus on data integrity and medical safety.

## 🚀 Key Features

- **Smart Stock Guard:** Implements a safety reserve (20 units) for all medicines. Normal sales are blocked when stock is low to ensure life-saving drugs remain available.
- **Emergency Overrides:** Allows critical stock issuance only with **Doctor Authorization**, creating a secure audit trail.
- **Balanced Financial Ledger:** Separates 'Counter Sales' from 'Internal Hospital Usage' for accurate balance sheets and GST reporting.
- **Automated PDF Invoicing:** Generates professional GST-compliant invoices for every transaction.
- **Expiry & Low-Stock Alerts:** Proactive tracking to prevent the sale of expired medication.

## 🛠️ Tech Stack

- **Backend:** Java 17, Spring Boot 3, Spring Security
- **Database:** MongoDB (NoSQL)
- **Security:** Role-Based Access Control (RBAC)
- **Build Tool:** Maven

## 📈 Accounting Logic
The system accounts for three distinct revenue streams to ensure the bank balance matches the inventory:
1. **Commercial Sales:** Direct cash/credit transactions at the pharmacy counter.
2. **Normal Ward Indents:** Standard internal distribution to hospital floors.
3. **Emergency Indents:** High-priority, doctor-authorized medical issuance.

## 📝 How to Run
1. Clone the repository: `git clone [your-link]`
2. Ensure MongoDB is running on `localhost:27017`.
3. Run the application: `./mvnw spring-boot:run`