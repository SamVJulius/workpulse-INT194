import { IsUUID, IsOptional, IsDateString } from 'class-validator';

export class StartSessionDto {
    @IsUUID()
    @IsOptional()
    project_id?: string;

    @IsDateString()
    @IsOptional()
    start_time?: string;
}

export class StopSessionDto {
    @IsDateString()
    @IsOptional()
    end_time?: string;
}
