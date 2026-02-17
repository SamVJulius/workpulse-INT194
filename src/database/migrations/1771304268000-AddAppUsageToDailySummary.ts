import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAppUsageToDailySummary1771304268000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add app_usage JSONB column to daily_summaries table
        await queryRunner.query(`
            ALTER TABLE daily_summaries 
            ADD COLUMN app_usage JSONB DEFAULT '[]'::jsonb;
        `);

        // Create GIN index for efficient JSONB queries
        await queryRunner.query(`
            CREATE INDEX idx_daily_summaries_app_usage 
            ON daily_summaries USING GIN (app_usage);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the index
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_daily_summaries_app_usage;
        `);

        // Drop the column
        await queryRunner.query(`
            ALTER TABLE daily_summaries 
            DROP COLUMN IF EXISTS app_usage;
        `);
    }
}
