import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '@database/entities/project.entity';
import { User } from '@database/entities/user.entity';
import { CreateProjectDto } from './dto/project.dto';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
    ) { }

    async createProject(user: User, createProjectDto: CreateProjectDto): Promise<Project> {
        const project = this.projectRepository.create({
            name: createProjectDto.name,
            description: createProjectDto.description,
            organization_id: user.organization_id,
            created_by: user.id,
        });

        return this.projectRepository.save(project);
    }

    async getProjects(user: User): Promise<Project[]> {
        return this.projectRepository.find({
            where: { organization_id: user.organization_id },
            relations: ['created_by_user'],
            order: { created_at: 'DESC' },
        });
    }

    async getProjectById(projectId: string, user: User): Promise<Project> {
        const project = await this.projectRepository.findOne({
            where: {
                id: projectId,
                organization_id: user.organization_id,
            },
            relations: ['created_by_user'],
        });

        if (!project) {
            throw new NotFoundException('Project not found');
        }

        return project;
    }
}
