import { IsEnum, IsInt, IsUrl, IsOptional, Min, IsUUID, IsDateString, ValidateNested, IsArray, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType } from '@database/entities/activity-log.entity';

export class ActivityUpdateDto {
    @ApiProperty({ enum: ActivityType, example: ActivityType.ACTIVE, description: 'Type of activity' })
    @IsEnum(ActivityType)
    activity_type: ActivityType;

    @ApiProperty({ example: 60, description: 'Duration in seconds', minimum: 1 })
    @IsInt()
    @Min(1)
    duration_seconds: number;

    @ApiPropertyOptional({ example: 'https://example.com', description: 'URL or Window Title' })
    @IsUrl()
    @IsOptional()
    url?: string;

    @ApiPropertyOptional({ example: '2023-01-01T00:00:00Z', description: 'Timestamp of activity' })
    @IsDateString()
    @IsOptional()
    timestamp?: string;
}

export class BulkActivityItemDto {
    @ApiProperty({ example: 'uuid', description: 'Client-side unique activity ID' })
    @IsUUID()
    client_activity_id: string;

    @ApiProperty({ example: '2023-01-01T00:00:00Z', description: 'Timestamp of activity' })
    @IsDateString()
    timestamp: string;

    @ApiProperty({ enum: ActivityType, example: ActivityType.ACTIVE, description: 'Type of activity' })
    @IsEnum(ActivityType)
    activity_type: ActivityType;

    @ApiProperty({ example: 60, description: 'Duration in seconds', minimum: 1 })
    @IsInt()
    @Min(1)
    duration_seconds: number;

    @ApiPropertyOptional({ example: 'https://example.com', description: 'URL or Window Title' })
    @IsUrl()
    @IsOptional()
    url?: string;
}

export class BulkActivityUploadDto {
    @ApiProperty({ type: [BulkActivityItemDto], description: 'List of activities to upload' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => BulkActivityItemDto)
    @ArrayMaxSize(1000)
    activities: BulkActivityItemDto[];
}
