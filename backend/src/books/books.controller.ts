// backend/src/books/books.controller.ts

import {
  Controller,
  Post,
  UseGuards,
  Body,
  Get,
  Param,
  Patch,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
} from '@nestjs/swagger';
import { BooksService } from './books.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities/user.entity';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { User } from '../auth/decorators/user.decorator';
import { SearchBookDto } from './dto/search-book.dto';

@ApiTags('Books')
@ApiBearerAuth()
@Controller('books')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('coverimage'))
  @ApiOperation({ summary: 'Add a new book (Librarian/Admin only)' })
  @ApiConsumes('multipart/form-data')
  create(
    @Body() createBookDto: CreateBookDto,
    @UploadedFile() coverimage: Express.Multer.File,
  ) {
    return this.booksService.create(createBookDto, coverimage);
  }

  @Get()
  @ApiOperation({ summary: 'Search and list all books' })
  findAll(@Query() query: SearchBookDto) {
    return this.booksService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific book' })
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a book (Librarian/Admin only)' })
  update(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto) {
    return this.booksService.update(+id, updateBookDto);
  }

  @Post(':id/borrow')
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Borrow a book' })
  borrow(@Param('id') id: string, @User() user) {
    return this.booksService.borrow(+id, user.userId);
  }

  @Post(':id/return')
  @Roles(UserRole.MEMBER, UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Return a book' })
  return(@Param('id') id: string, @User() user) {
    return this.booksService.return(+id, user.userId);
  }

  @Get('borrowed/history')
  @Roles(UserRole.LIBRARIAN, UserRole.ADMIN)
  @ApiOperation({ summary: 'View borrowing history (Librarian/Admin only)' })
  getBorrowHistory() {
    return this.booksService.getBorrowHistory();
  }
}
