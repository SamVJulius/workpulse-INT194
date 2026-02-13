import { UserRole, UserStatus } from '@database/entities/user.entity';

export class UserResponseDto {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    last_seen: Date | null;
    organization_id: string;
    created_at: Date;
    updated_at: Date;
}
