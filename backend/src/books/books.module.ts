import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { Book } from '../database/entities/book.entity';
import { BorrowRecord } from '../database/entities/borrow-record.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Book, BorrowRecord]), AuthModule],
  controllers: [BooksController],
  providers: [BooksService],
})
export class BooksModule {}
