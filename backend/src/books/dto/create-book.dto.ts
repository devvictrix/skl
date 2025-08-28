// backend/src/books/dto/create-book.dto.ts

import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsPositive,
  Min,
  MinLength,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateBookDto {
  @ApiProperty({ example: 'The Lord of the Rings' })
  @IsString()
  @IsNotEmpty({ message: 'Title should not be empty.' })
  @MinLength(1, { message: 'Title is too short.' })
  title: string;

  @ApiProperty({ example: 'J.R.R. Tolkien' })
  @IsString()
  @IsNotEmpty({ message: 'Author should not be empty.' })
  @MinLength(2, { message: 'Author name is too short.' })
  author: string;

  @ApiProperty({ example: '978-0-618-64015-7' })
  @IsString()
  @IsNotEmpty({ message: 'ISBN should not be empty.' })
  isbn: string;

  @ApiProperty({ example: 1954 })
  @Type(() => Number)
  @IsInt({ message: 'Publication year must be an integer.' })
  @Min(0, { message: 'Publication year cannot be negative.' })
  @Max(new Date().getFullYear() + 5, {
    message: 'Publication year seems too far in the future.',
  })
  publicationYear: number;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsInt({ message: 'Quantity must be an integer.' })
  @IsPositive({ message: 'Quantity must be a positive number.' })
  quantity: number;
}
