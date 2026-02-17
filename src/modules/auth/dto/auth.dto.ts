import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@database/entities/user.entity';

export class RegisterDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123', description: 'User password (min 8 characters)', minLength: 8 })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: 'John Doe', description: 'User full name', minLength: 2 })
    @IsString()
    @MinLength(2)
    name: string;

    @ApiPropertyOptional({ enum: UserRole, default: UserRole.EMPLOYEE, description: 'User role' })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @ApiPropertyOptional({ example: 'uuid', description: 'Organization ID to join' })
    @IsUUID()
    @IsOptional()
    organization_id?: string;

    @ApiPropertyOptional({ example: 'My Org', description: 'New organization name to create' })
    @IsString()
    @IsOptional()
    organization_name?: string;

    @ApiPropertyOptional({ example: 'free', description: 'Plan type' })
    @IsString()
    @IsOptional()
    plan_type?: string;
}

export class LoginDto {
    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'password123', description: 'User password' })
    @IsString()
    password: string;

    @ApiPropertyOptional({ example: 'uuid', description: 'Organization ID' })
    @IsUUID()
    @IsOptional()
    organization_id?: string;
}
