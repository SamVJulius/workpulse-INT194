import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { User } from '@database/entities/user.entity';
import { CreateProjectDto } from './dto/project.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
    constructor(private readonly projectsService: ProjectsService) { }

    @Post()
    async createProject(
        @CurrentUser() user: User,
        @Body() createProjectDto: CreateProjectDto,
    ) {
        return this.projectsService.createProject(user, createProjectDto);
    }

    @Get()
    async getProjects(@CurrentUser() user: User) {
        return this.projectsService.getProjects(user);
    }
}
