import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '@database/entities/user.entity';

export class UserResponseDto {
    @ApiProperty({ example: 'uuid', description: 'User ID' })
    id: string;

    @ApiProperty({ example: 'user@example.com', description: 'User email' })
    email: string;

    @ApiProperty({ example: 'John Doe', description: 'User full name' })
    name: string;

    @ApiProperty({ enum: UserRole, example: UserRole.EMPLOYEE, description: 'User role' })
    role: UserRole;

    @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE, description: 'User status' })
    status: UserStatus;

    @ApiProperty({ example: '2023-01-01T00:00:00Z', description: 'Last seen timestamp', nullable: true })
    last_seen: Date | null;

    @ApiProperty({ example: 'uuid', description: 'Organization ID' })
    organization_id: string;

    @ApiProperty({ example: '2023-01-01T00:00:00Z', description: 'Creation timestamp' })
    created_at: Date;

    @ApiProperty({ example: '2023-01-01T00:00:00Z', description: 'Last update timestamp' })
    updated_at: Date;
}
