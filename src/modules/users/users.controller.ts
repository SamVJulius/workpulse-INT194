import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User, UserRole } from '@database/entities/user.entity';
import { UserResponseDto } from './dto/user-response.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('employees')
    @Roles(UserRole.ADMIN)
    async getEmployees(@CurrentUser() user: User): Promise<UserResponseDto[]> {
        return this.usersService.getEmployeesByOrganization(user.organization_id);
    }
}
