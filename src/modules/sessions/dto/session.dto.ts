import { IsUUID, IsOptional, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class StartSessionDto {
    @ApiPropertyOptional({ example: 'uuid', description: 'Project ID to associate with the session' })
    @IsUUID()
    @IsOptional()
    project_id?: string;

    @ApiPropertyOptional({ example: '2023-01-01T00:00:00Z', description: 'Session start time (ISO 8601)' })
    @IsDateString()
    @IsOptional()
    start_time?: string;
}

export class StopSessionDto {
    @ApiPropertyOptional({ example: '2023-01-01T00:00:00Z', description: 'Session end time (ISO 8601)' })
    @IsDateString()
    @IsOptional()
    end_time?: string;
}
