import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { RolesGuard } from '@common/guards/roles.guard';
import { Roles } from '@common/decorators/roles.decorator';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User, UserRole } from '@database/entities/user.entity';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('employees')
    @Roles(UserRole.ADMIN)
    @ApiOperation({ summary: 'Get all employees in the organization (Admin only)' })
    @ApiResponse({ status: 200, description: 'List of employees.', type: [UserResponseDto] })
    async getEmployees(@CurrentUser() user: User): Promise<UserResponseDto[]> {
        return this.usersService.getEmployeesByOrganization(user.organization_id);
    }
}
