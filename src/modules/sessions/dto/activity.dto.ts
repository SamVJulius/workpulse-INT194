import { IsEnum, IsInt, IsUrl, IsOptional, Min, IsUUID, IsDateString, ValidateNested, IsArray, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ActivityType } from '@database/entities/activity-log.entity';

export class ActivityUpdateDto {
    @IsEnum(ActivityType)
    activity_type: ActivityType;

    @IsInt()
    @Min(1)
    duration_seconds: number;

    @IsUrl()
    @IsOptional()
    url?: string;

    @IsDateString()
    @IsOptional()
    timestamp?: string;
}

export class BulkActivityItemDto {
    @IsUUID()
    client_activity_id: string;

    @IsDateString()
    timestamp: string;

    @IsEnum(ActivityType)
    activity_type: ActivityType;

    @IsInt()
    @Min(1)
    duration_seconds: number;

    @IsUrl()
    @IsOptional()
    url?: string;
}

export class BulkActivityUploadDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkActivityItemDto)
    @ArrayMaxSize(1000)
    activities: BulkActivityItemDto[];
}
