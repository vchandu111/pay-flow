
```
# Step 1 — Build PayFlow

## Product Definition

**PayFlow** is a fictional digital wallet and money-transfer platform.

A customer can:

1. Create an account
2. Log in
3. View their wallet
4. Add money
5. Transfer money
6. Manage beneficiaries
7. View transactions
8. Download statements
9. Manage profile
10. Receive notifications

Internal teams can manage customers and transactions through an operations portal.

---

# 1. Application scope

I'd keep the first version to **six core domains**.

```text
PayFlow
│
├── Authentication
│
├── Customer
│
├── Wallet
│
├── Transfers
│
├── Transactions
│
└── Operations
```

Don't build KYC, fraud detection, payment-provider integrations, etc. initially.

Those can be added after the core application works.

---

# 2. Customer application

### Dashboard

The customer should immediately see:

```text
Good morning, Alex

Wallet Balance
₹24,500.00

[ Add Money ]  [ Send Money ]

Recent Transactions

+ ₹5,000     Salary Credit
- ₹1,200     Amazon
- ₹500       Rahul
+ ₹2,000     Refund
```

### Navigation

```text
Dashboard
Wallet
Send Money
Beneficiaries
Transactions
Statements
Profile
```

---

# 3. Authentication

Build a proper authentication flow.

### Registration

```text
Name
Email
Phone
Password
Confirm Password
```

### Login

```text
Email
Password
```

### Session

After login:

```text
User
 ↓
Authentication
 ↓
Session
 ↓
Authenticated application
```

For the clean version, use a conventional, secure implementation rather than intentionally weak JWT/session handling.

---

# 4. Customer profile

```text
Profile

Name
Email
Phone
Date of Birth
Address
```

Allow the customer to:

* View profile
* Edit profile
* Change password
* Update phone number

Keep sensitive financial information out of the profile initially.

---

# 5. Wallet

Each customer gets one wallet.

```text
Wallet
────────────────────

Available Balance

₹24,500.00

Currency
INR

Wallet ID
WLT-10293
```

### Wallet operations

```text
Add Money
Withdraw
View Transactions
```

For the first version, **don't connect to a real payment provider**.

Use a simulated payment mechanism:

```text
Add Money
     ↓
Mock Payment Provider
     ↓
Payment Successful
     ↓
Wallet Credited
```

This keeps the application deterministic for training.

---

# 6. Send Money

This should be one of the most important workflows.

```text
Send Money

Recipient
[ Search by email / phone ]

Amount
[ ₹ ]

Note
[ Optional ]

        [ Continue ]
```

Then:

```text
Transfer Summary

From
Alex's Wallet

To
Rahul

Amount
₹2,500

Fee
₹0

Total
₹2,500

        [ Confirm Transfer ]
```

Then:

```text
Processing...
     ↓
Success

₹2,500 sent successfully.
Transaction ID: TXN-82931
```

---

# 7. Beneficiaries

Customers should be able to save frequent recipients.

```text
Beneficiaries

Rahul
rahul@example.com

Priya
priya@example.com

Arjun
arjun@example.com

[ Add Beneficiary ]
```

Adding one:

```text
Name
Email / Phone

[ Add ]
```

---

# 8. Transactions

Create a proper transaction history.

```text
Transactions

Date       Description       Type       Amount

Sep 25     Rahul             Transfer   -₹2,500
Sep 24     Wallet Top-up     Credit     +₹5,000
Sep 23     Priya             Transfer   -₹1,000
Sep 22     Refund            Credit     +₹750
```

Filters:

```text
Date
Type
Status
Amount
```

Transaction detail:

```text
Transaction

TXN-82931

Status       Completed
Type         Transfer
Amount       ₹2,500
From         Alex
To           Rahul
Date         Sep 25, 2026
Reference    PAY-82931
Note         Dinner
```

---

# 9. Statements

Allow customers to generate/download a statement.

```text
Statements

September 2026
[ Download ]

August 2026
[ Download ]

July 2026
[ Download ]
```

Initially, a simple generated PDF/CSV is enough.

This feature will become useful later for security testing around **authorization and document access**.

---

# 10. Notifications

Simple notification center:

```text
Notifications

Transfer successful
₹2,500 sent to Rahul.

Wallet credited
₹5,000 added to your wallet.

New beneficiary added
Rahul was added to your beneficiaries.
```

Don't build real email/SMS integrations yet.

---

# 11. Operations portal

This is important because it gives the application an **enterprise dimension**.

Separate route:

```text
/operations
```

Dashboard:

```text
Operations Dashboard

Total Customers       12,842
Active Wallets        11,903
Transactions Today    8,421
Transaction Volume    ₹18.4M
Failed Transactions   37
```

### Customers

```text
Customers

Search
────────────────────────────

Alex Johnson
alex@example.com
Active

Rahul Sharma
rahul@example.com
Active
```

Customer detail:

```text
Customer

Alex Johnson
alex@example.com

Wallet Balance
₹24,500

Transactions
156

Account Status
Active
```

---

# 12. Operations transaction view

Operations users should be able to search transactions.

```text
Transactions

TXN-82931
Alex → Rahul
₹2,500
Completed

TXN-82930
Priya → Alex
₹1,000
Completed
```

Clicking a transaction:

```text
Transaction Details

Transaction ID
TXN-82931

Sender
Alex

Receiver
Rahul

Amount
₹2,500

Status
Completed

Created
Sep 25, 2026
```

This creates an important distinction between:

```text
Customer functionality
```

and

```text
Operations functionality
```

which you'll need later for authorization testing.

---

# 13. Suggested architecture

For the **first clean version**, I'd use a modular monolith.

```text
                  React Application
                         │
                         ▼
                  Node.js Backend
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
   Auth Module      Wallet Module     Transfer Module
       │                 │                 │
       │                 ├─────────────────┤
       │                 │
       ▼                 ▼
                    PostgreSQL
```

Repository:

```text
payflow/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── features/
│   │   ├── services/
│   │   └── hooks/
│
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── wallets/
│   │   ├── beneficiaries/
│   │   ├── transfers/
│   │   ├── transactions/
│   │   ├── statements/
│   │   ├── notifications/
│   │   └── operations/
│
├── database/
│
├── tests/
│
└── README.md
```

---

# 14. Database relationships

The initial model can be:

```text
User
 │
 ├───────────────┐
 │               │
 ▼               ▼
Wallet       Beneficiary
 │
 │
 ▼
Transaction
 │
 ├── sender
 └── receiver
```

More explicitly:

```text
users
  │
  ├── wallets
  │
  ├── beneficiaries
  │
  ├── notifications
  │
  └── transactions
```

A transaction should reference wallets rather than simply storing arbitrary sender/receiver information.

For example:

```text
transactions

id
sender_wallet_id
receiver_wallet_id
amount
currency
type
status
reference
description
created_at
completed_at
```

That gives you meaningful relationships for the later context graph.

---

# 15. Seed data

This is important for the training environment.

Create perhaps:

### Customers

```text
Alex Johnson
Rahul Sharma
Priya Patel
Arjun Rao
Sneha Reddy
```

### Operations users

```text
Support Agent
Finance Analyst
Fraud Analyst
Administrator
```

### Wallets

Each customer has a wallet.

### Transactions

Generate perhaps 100–500 realistic transactions.

This makes the application feel alive.

---

# 16. Clean baseline rules

Before moving to the security curriculum, establish a strict rule:

> **The baseline application should not intentionally contain vulnerabilities.**

That means:

* Proper authentication
* Proper authorization
* Input validation
* Parameterized queries
* Secure password hashing
* Secure session/token handling
* Server-side authorization
* Proper error handling
* Safe file handling
* Dependency versions without known vulnerabilities
* No secrets committed to Git
* Security headers
* Reasonable rate limiting
* Audit logging
* Tests

The point isn't to claim the application is mathematically "secure." Rather, you establish a **reviewed, security-conscious baseline** that becomes the reference implementation.

---

# 17. Add tests before introducing vulnerabilities

This is particularly important for your M8 module.

For example:

```text
tests/
│
├── auth/
├── wallet/
├── transfers/
├── beneficiaries/
├── transactions/
├── statements/
└── operations/
```

And:

```text
Transfer
  ├── successful transfer
  ├── insufficient balance
  ├── invalid recipient
  ├── invalid amount
  └── transaction recorded correctly
```

Later, when you deliberately introduce a vulnerability, these tests become part of the evidence that your modification didn't break existing behavior.

---

# 18. Then create the security-training version

Once the clean application is complete, **freeze it**.

For example:

```text
main
│
└── v1.0.0-clean-baseline
```

Then create:

```text
security-lab
```

From there, introduce vulnerabilities one at a time.

```text
v1.0.0-clean
       │
       ├── VULN-001
       │
       ├── VULN-002
       │
       ├── VULN-003
       │
       └── ...
```

This gives you something extremely useful pedagogically:

```text
CLEAN VERSION
      │
      │ introduce vulnerability
      ▼
VULNERABLE VERSION
      │
      │ scanner
      ▼
FINDING
      │
      │ AI analysis
      ▼
ROOT CAUSE
      │
      ▼
FIX
      │
      ▼
VERIFICATION
      │
      ▼
CLEAN VERSION
```

That should be the **core lifecycle of your entire curriculum**.

### I would build the application in this order

**Phase 1 — Foundation**

1. Project setup
2. Database
3. Authentication
4. User/profile
5. Wallet

**Phase 2 — Money movement**

6. Beneficiaries
7. Transfers
8. Transactions
9. Mock payment provider

**Phase 3 — Enterprise functionality**

10. Statements
11. Notifications
12. Operations portal
13. Roles

**Phase 4 — Quality baseline**

14. Unit tests
15. Integration tests
16. E2E tests
17. API documentation
18. Seed data
19. Logging/audit
20. Clean security review

**Only after all of that:** freeze the clean baseline and start **deliberately introducing the security issues**.

This approach also makes your later **M4 Codebase Intelligence & Context Graphs** much stronger, because learners aren't analyzing a contrived 5-file vulnerability demo—they're analyzing a coherent application with real relationships between authentication, wallets, transactions, users, operations, and external integrations.
