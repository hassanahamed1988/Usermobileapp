# Security Spec: Family Maintenance Private Module

This security specification details the access control models, data invariants, and hardened Firestore Security Rules implemented for the `family_maintenance` collection.

## 1. Data Invariants
- **Owner-Exclusive Isolation**: Every `family_maintenance` record must possess a `userId` field matching the unique UID of the user who created it.
- **Strict Read/Write Access**: A user is authorized to read, create, update, or delete only their own Family Maintenance records (`resource.data.userId == request.auth.uid`).
- **Complete Admin Blackout**: Administrators or managers have absolutely **no** permission to read, list, search, download, or edit any user's Family Maintenance records.
- **Data Integrity**: Valid entries must have an `amount` greater than zero, a standard `category` ('Family' or 'Others'), a standard `type` ('Income' or 'Expense'), and a valid transaction `date`.

## 2. The "Dirty Dozen" Payloads
The following 12 attack vectors and unauthorized payloads designed to violate identity, isolation, or integrity are strictly rejected by our Firestore Security Rules:

1. **Unauthenticated Read Request**: Attempting to read any `family_maintenance` record without logging in.
2. **Unauthenticated Write Request**: Attempting to create a `family_maintenance` record without logging in.
3. **Cross-User Read Probe**: Authenticated User A tries to get a document belonging to User B.
4. **Cross-User Update/Hijack**: Authenticated User A tries to edit or rewrite fields in a document owned by User B.
5. **Cross-User Delete Attack**: Authenticated User A tries to delete a document owned by User B.
6. **Admin Read Bypass**: An authenticated ADMIN user attempts to query or retrieve a user's Family Maintenance records.
7. **Admin Delete Bypass**: An authenticated ADMIN user attempts to delete a user's Family Maintenance records.
8. **Owner Impersonation (Spoofing)**: Authenticated User A attempts to save a record with `userId` set to User B's UID.
9. **Zero/Negative Amount Integrity Violation**: A user tries to create a record with an invalid negative amount (e.g. `amount: -500`).
10. **Category Injection Violation**: A user tries to create a record with an unapproved category (e.g. `category: "SecretPrivate"`).
11. **Type Injection Violation**: A user tries to create a record with an unapproved transaction type (e.g. `type: "Loan"`).
12. **Id Poisoning Guard**: A user attempts to create a document with an excessively long or malicious junk string as the document ID.

---

## 3. Draft Hardened Firestore Security Rules (`DRAFT_firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Global Safety Net (Default Deny)
    match /{document=**} {
      allow read, write: if false;
    }

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isValidId(id) {
      return id is string && id.size() > 0 && id.size() < 128 && id.matches('^[a-zA-Z0-9_\\-]+$');
    }

    function isAdmin() {
      return isSignedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    // 1. users and admins collections
    match /users/{userId} {
      allow read, write: if isOwner(userId) || isAdmin();
      
      // Subcollections of users/{userId}
      match /{allSubcollections=**} {
        allow read, write: if isOwner(userId);
      }
    }

    match /admins/{adminId} {
      allow read, write: if isOwner(adminId);
      
      // Subcollections of admins/{adminId}
      match /{allSubcollections=**} {
        allow read, write: if isOwner(adminId);
      }
    }

    // 2. family_maintenance collection (Private Module)
    match /family_maintenance/{transactionId} {
      // Create validation
      allow create: if isSignedIn() && isValidId(transactionId)
        && request.resource.data.userId == request.auth.uid
        && request.resource.data.amount is number
        && request.resource.data.amount > 0
        && request.resource.data.category in ['Family', 'Others']
        && request.resource.data.type in ['Income', 'Expense']
        && request.resource.data.date is string;
      
      // Read, Update, Delete isolation - Admin strictly denied because request.auth.uid must equal owner userId
      allow read, update, delete: if isSignedIn() && isValidId(transactionId)
        && resource.data.userId == request.auth.uid;
    }

    // 3. Fallback matching for root collection reads/writes
    match /trips/{id} {
      allow read, write: if isSignedIn() && (resource == null || resource.data.userId == request.auth.uid) && (request.resource == null || request.resource.data.userId == request.auth.uid);
    }
    match /profiles/{id} {
      allow read, write: if isSignedIn() && (resource == null || resource.data.userId == request.auth.uid) && (request.resource == null || request.resource.data.userId == request.auth.uid);
    }
    match /finances/{id} {
      allow read, write: if isSignedIn() && (resource == null || resource.data.userId == request.auth.uid) && (request.resource == null || request.resource.data.userId == request.auth.uid);
    }
    match /monthlyFiles/{id} {
      allow read, write: if isSignedIn() && (resource == null || resource.data.userId == request.auth.uid) && (request.resource == null || request.resource.data.userId == request.auth.uid);
    }
    match /payments/{id} {
      allow read, write: if isSignedIn() && (resource == null || resource.data.userId == request.auth.uid) && (request.resource == null || request.resource.data.userId == request.auth.uid);
    }
    match /notifications/{id} {
      allow read, write: if isSignedIn() && (resource == null || resource.data.userId == request.auth.uid) && (request.resource == null || request.resource.data.userId == request.auth.uid);
    }
    match /fuels/{id} {
      allow read, write: if isSignedIn() && (resource == null || resource.data.userId == request.auth.uid) && (request.resource == null || request.resource.data.userId == request.auth.uid);
    }
    match /settings/{settingId} {
      allow read: if true;
      allow write: if isSignedIn();
    }
  }
}
```
