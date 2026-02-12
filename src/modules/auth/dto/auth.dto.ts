import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { UserRole } from '@database/entities/user.entity';

export class RegisterDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;

    @IsString()
    @MinLength(2)
    name: string;

    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;

    @IsUUID()
    @IsOptional()
    organization_id?: string;

    @IsString()
    @IsOptional()
    organization_name?: string;

    @IsString()
    @IsOptional()
    plan_type?: string;
}

export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;

    @IsUUID()
    @IsOptional()
    organization_id?: string;
}
