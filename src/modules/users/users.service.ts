import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@database/entities/user.entity';
import { UserResponseDto } from './dto/user-response.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    async getEmployeesByOrganization(organizationId: string): Promise<UserResponseDto[]> {
        const users = await this.userRepository.find({
            where: { organization_id: organizationId },
            order: { created_at: 'DESC' },
        });

        // Map users to response DTO, excluding password_hash
        return users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            last_seen: user.last_seen,
            organization_id: user.organization_id,
            created_at: user.created_at,
            updated_at: user.updated_at,
        }));
    }
}
