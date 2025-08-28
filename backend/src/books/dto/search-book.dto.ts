import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '../../core/dto/pagination.dto';

export class SearchBookDto extends PaginationDto {
  @ApiProperty({ required: false, description: 'Search by book title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false, description: 'Search by author name' })
  @IsString()
  @IsOptional()
  author?: string;
}
