import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '@database/entities/user.entity';
import { Organization } from '@database/entities/organization.entity';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(Organization)
        private organizationRepository: Repository<Organization>,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        const { email, password, name, role, organization_id, organization_name, plan_type } = registerDto;

        let orgId = organization_id;

        // If no organization_id provided, create new organization
        if (!orgId) {
            if (!organization_name) {
                throw new BadRequestException('organization_name is required when creating a new organization');
            }

            const organization = this.organizationRepository.create({
                name: organization_name,
                plan_type: plan_type || 'free',
            });

            const savedOrg = await this.organizationRepository.save(organization);
            orgId = savedOrg.id;
        }

        // Check if user already exists
        const existingUser = await this.userRepository.findOne({
            where: { email, organization_id: orgId },
        });

        if (existingUser) {
            throw new ConflictException('User already exists in this organization');
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, 10);

        // Create user
        const user = this.userRepository.create({
            email,
            password_hash,
            name,
            role: role || UserRole.EMPLOYEE,
            organization_id: orgId,
        });

        const savedUser = await this.userRepository.save(user);

        // Generate JWT
        const token = this.generateToken(savedUser);

        return {
            access_token: token,
            user: {
                id: savedUser.id,
                email: savedUser.email,
                name: savedUser.name,
                role: savedUser.role,
                organization_id: savedUser.organization_id,
            },
        };
    }

    async login(loginDto: LoginDto) {
        const { email, password, organization_id } = loginDto;

        const whereClause: any = { email };
        if (organization_id) {
            whereClause.organization_id = organization_id;
        }

        const user = await this.userRepository.findOne({
            where: whereClause,
            relations: ['organization'],
        });

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.generateToken(user);

        return {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                organization_id: user.organization_id,
            },
        };
    }

    private generateToken(user: User): string {
        const payload = {
            sub: user.id,
            email: user.email,
            organization_id: user.organization_id,
            role: user.role,
        };

        return this.jwtService.sign(payload);
    }
}
