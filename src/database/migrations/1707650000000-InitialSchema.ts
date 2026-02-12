import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1707650000000 implements MigrationInterface {
  name = 'InitialSchema1707650000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create UUID extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create organizations table
    await queryRunner.query(`
      CREATE TABLE "organizations" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" varchar(255) NOT NULL,
        "plan_type" varchar(50) NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now()
      )
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM('admin', 'employee')
    `);

    await queryRunner.query(`
      CREATE TYPE "user_status_enum" AS ENUM('active', 'inactive', 'suspended')
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "organization_id" uuid NOT NULL,
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "name" varchar(255) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'employee',
        "status" "user_status_enum" NOT NULL DEFAULT 'active',
        "last_seen" timestamp,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_users_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_org_email" ON "users" ("organization_id", "email")
    `);

    // Create projects table
    await queryRunner.query(`
      CREATE TABLE "projects" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "organization_id" uuid NOT NULL,
        "name" varchar(255) NOT NULL,
        "description" text,
        "created_by" uuid NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_projects_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_projects_created_by" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    // Create work_sessions table
    await queryRunner.query(`
      CREATE TYPE "session_status_enum" AS ENUM('active', 'stopped')
    `);

    await queryRunner.query(`
      CREATE TABLE "work_sessions" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "organization_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "project_id" uuid,
        "start_time" timestamp NOT NULL,
        "end_time" timestamp,
        "total_active_seconds" integer NOT NULL DEFAULT 0,
        "total_idle_seconds" integer NOT NULL DEFAULT 0,
        "last_activity_at" timestamp,
        "status" "session_status_enum" NOT NULL DEFAULT 'active',
        "version" integer NOT NULL DEFAULT 1,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "updated_at" timestamp NOT NULL DEFAULT now(),
        CONSTRAINT "FK_sessions_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sessions_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sessions_project" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sessions_user_status" ON "work_sessions" ("user_id", "status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_sessions_last_activity" ON "work_sessions" ("last_activity_at")
    `);

    // Create activity_logs table with partitioning
    await queryRunner.query(`
      CREATE TYPE "activity_type_enum" AS ENUM('active', 'idle')
    `);

    await queryRunner.query(`
      CREATE TABLE "activity_logs" (
        "id" uuid DEFAULT uuid_generate_v4(),
        "session_id" uuid NOT NULL,
        "timestamp" timestamp NOT NULL,
        "activity_type" "activity_type_enum" NOT NULL,
        "duration_seconds" integer NOT NULL,
        "url" varchar(2048),
        "client_activity_id" varchar(255),
        CONSTRAINT "FK_activity_logs_session" FOREIGN KEY ("session_id") REFERENCES "work_sessions"("id") ON DELETE CASCADE
      ) PARTITION BY RANGE (timestamp)
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_activity_logs_session_timestamp" ON "activity_logs" ("session_id", "timestamp")
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_activity_logs_session_client_id" ON "activity_logs" ("session_id", "client_activity_id", "timestamp") WHERE "client_activity_id" IS NOT NULL
    `);

    // Create partitions for activity_logs (current month and next 3 months)
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const partitionDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const nextPartitionDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      const partitionName = `activity_logs_${partitionDate.getFullYear()}_${String(partitionDate.getMonth() + 1).padStart(2, '0')}`;

      await queryRunner.query(`
        CREATE TABLE "${partitionName}" PARTITION OF "activity_logs"
        FOR VALUES FROM ('${partitionDate.toISOString()}') TO ('${nextPartitionDate.toISOString()}')
      `);
    }

    // Create daily_summaries table
    await queryRunner.query(`
      CREATE TABLE "daily_summaries" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "organization_id" uuid NOT NULL,
        "user_id" uuid NOT NULL,
        "date" date NOT NULL,
        "total_work_seconds" integer NOT NULL DEFAULT 0,
        "active_seconds" integer NOT NULL DEFAULT 0,
        "idle_seconds" integer NOT NULL DEFAULT 0,
        "productivity_score" decimal(5,2) NOT NULL DEFAULT 0,
        CONSTRAINT "FK_daily_summaries_organization" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_daily_summaries_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_daily_summaries_user_date" ON "daily_summaries" ("user_id", "date")
    `);

    // Create alerts table
    await queryRunner.query(`
      CREATE TYPE "alert_type_enum" AS ENUM('idle', 'overtime')
    `);

    await queryRunner.query(`
      CREATE TABLE "alerts" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "type" "alert_type_enum" NOT NULL,
        "message" text NOT NULL,
        "created_at" timestamp NOT NULL DEFAULT now(),
        "resolved_at" timestamp,
        CONSTRAINT "FK_alerts_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "alerts"`);
    await queryRunner.query(`DROP TYPE "alert_type_enum"`);
    await queryRunner.query(`DROP TABLE "daily_summaries"`);

    // Drop activity_logs partitions
    const now = new Date();
    for (let i = 0; i < 4; i++) {
      const partitionDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const partitionName = `activity_logs_${partitionDate.getFullYear()}_${String(partitionDate.getMonth() + 1).padStart(2, '0')}`;
      await queryRunner.query(`DROP TABLE IF EXISTS "${partitionName}"`);
    }

    await queryRunner.query(`DROP TABLE "activity_logs"`);
    await queryRunner.query(`DROP TYPE "activity_type_enum"`);
    await queryRunner.query(`DROP TABLE "work_sessions"`);
    await queryRunner.query(`DROP TYPE "session_status_enum"`);
    await queryRunner.query(`DROP TABLE "projects"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "user_status_enum"`);
    await queryRunner.query(`DROP TYPE "user_role_enum"`);
    await queryRunner.query(`DROP TABLE "organizations"`);
  }
}
