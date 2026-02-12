import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailySummary } from '@database/entities/daily-summary.entity';
import { WorkSession } from '@database/entities/work-session.entity';
import { User, UserRole } from '@database/entities/user.entity';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(DailySummary)
        private dailySummaryRepository: Repository<DailySummary>,
        @InjectRepository(WorkSession)
        private sessionRepository: Repository<WorkSession>,
    ) { }

    async getDailySummary(user: User, date: string) {
        const summary = await this.dailySummaryRepository.findOne({
            where: {
                user_id: user.id,
                date: new Date(date),
            },
        });

        return summary || null;
    }

    async getUserReport(requestingUser: User, userId: string, startDate?: string, endDate?: string) {
        // Users can only view their own reports, admins can view all in their org
        if (requestingUser.id !== userId && requestingUser.role !== UserRole.ADMIN) {
            throw new ForbiddenException('You can only view your own reports');
        }

        const whereClause: any = { user_id: userId };

        if (startDate && endDate) {
            whereClause.date = {
                $gte: new Date(startDate),
                $lte: new Date(endDate),
            };
        }

        const summaries = await this.dailySummaryRepository.find({
            where: whereClause,
            order: { date: 'DESC' },
            take: 30,
        });

        return summaries;
    }

    async getOrganizationReport(user: User, startDate?: string, endDate?: string) {
        if (user.role !== UserRole.ADMIN) {
            throw new ForbiddenException('Only admins can view organization reports');
        }

        const queryBuilder = this.dailySummaryRepository
            .createQueryBuilder('summary')
            .leftJoinAndSelect('summary.user', 'user')
            .where('summary.organization_id = :orgId', { orgId: user.organization_id });

        if (startDate && endDate) {
            queryBuilder.andWhere('summary.date BETWEEN :startDate AND :endDate', {
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            });
        }

        queryBuilder.orderBy('summary.date', 'DESC').addOrderBy('user.name', 'ASC');

        return queryBuilder.getMany();
    }
}
