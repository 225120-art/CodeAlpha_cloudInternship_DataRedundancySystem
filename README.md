# Cloud Dedupe: Data Redundancy Removal System

A production-ready system to identify, classify, and prevent duplicate data entries using cryptographic hashing and cloud-scale validation logic.

## 1. System Architecture (AWS Based)

- **Ingestion**: AWS API Gateway + Lambda (or EC2/ECS) handles incoming JSON payloads.
- **Validation**: A hashing service (Node.js) generates SHA-256 fingerprints of normalized data.
- **Caching (Optional but Recommended)**: Redis (Elasticache) stores recent hashes for O(1) lookup to reduce DB load.
- **Storage**: Amazon RDS (PostgreSQL/MySQL) stores unique records and their hashes.
- **Monitoring**: CloudWatch logs ingestion stats and redundancy rates.

## 2. Tech Stack Recommendation

- **Frontend**: React 19, Tailwind CSS 4, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express.
- **Database**: 
  - *Development*: SQLite (better-sqlite3).
  - *Production*: Amazon RDS (PostgreSQL).
- **Security**: Cryptographic hashing (crypto module).

## 3. Database Schema Design

```sql
CREATE TABLE records (
    id SERIAL PRIMARY KEY,
    content JSONB NOT NULL,
    hash VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_records_hash ON records(hash);
```

## 4. Duplicate Detection Logic

1. **Normalization**: Sort object keys alphabetically to ensure `{"a":1, "b":2}` and `{"b":2, "a":1}` produce the same hash.
2. **Fingerprinting**: Apply SHA-256 hashing to the normalized string.
3. **Lookup**: Query the database for the hash.
4. **Decision**: 
   - If hash exists: Mark as **Redundant**.
   - If hash doesn't exist: Mark as **Unique** and persist.

## 5. API Endpoints

- `GET /api/records`: Fetch all verified unique records.
- `POST /api/ingest`: Ingest new data (single object or array).
- `DELETE /api/records`: Purge the database (Admin only).

## 6. Deployment Steps (AWS)

1. **EC2 Setup**: Launch an Amazon Linux 2 instance.
2. **Environment**: Install Node.js and Git.
3. **Database**: Provision an RDS PostgreSQL instance.
4. **Configuration**: Set environment variables (`DATABASE_URL`, `PORT`).
5. **Process Management**: Use `pm2` to keep the Node.js server running.
6. **Networking**: Configure Security Groups to allow traffic on port 80/443 (via Nginx reverse proxy).

## 7. GitHub Project Structure

```text
cloud-dedupe/
├── src/                # Frontend React code
│   ├── components/     # UI Components
│   └── App.tsx         # Main Dashboard
├── server.ts           # Express Backend & DB Logic
├── dedupe.db           # Local SQLite DB (Dev)
├── package.json        # Dependencies
└── README.md           # Documentation
```

## 8. Sample Test Cases

**Test Case 1: Initial Ingestion**
- Input: `{"user": "alice", "action": "login"}`
- Expected: Status `Unique`, Record added to DB.

**Test Case 2: Redundant Entry**
- Input: `{"user": "alice", "action": "login"}` (Again)
- Expected: Status `Redundant`, DB count remains same.

**Test Case 3: Different Order (Same Data)**
- Input: `{"action": "login", "user": "alice"}`
- Expected: Status `Redundant` (Normalization handles key order).

## 9. LinkedIn Video Script

**Hook**: "Stop wasting cloud storage on duplicate data!"
**Problem**: "Redundant records slow down your analytics and bloat your database costs."
**Solution**: "I built 'Cloud Dedupe'—a system that fingerprints incoming data using SHA-256. It normalizes your JSON, generates a unique hash, and ensures only 100% unique records hit your database."
**Call to Action**: "Check out the architecture diagram in the comments and let's build more efficient systems together!"
