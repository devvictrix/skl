// backend/src/books/books.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Book } from '../database/entities/book.entity';
import { BorrowRecord } from '../database/entities/borrow-record.entity';
import { Repository, EntityManager, IsNull } from 'typeorm';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { SearchBookDto } from './dto/search-book.dto';

// Import Node.js modules for file handling
import { promises as fs } from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid'; // Import uuid

export interface PaginatedBooksResult {
  data: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book) private readonly bookRepository: Repository<Book>,
    @InjectRepository(BorrowRecord)
    private readonly borrowRecordRepository: Repository<BorrowRecord>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(
    createBookDto: CreateBookDto,
    file: Express.Multer.File,
  ): Promise<Book> {
    const existingBook = await this.bookRepository.findOneBy({
      isbn: createBookDto.isbn,
    });
    if (existingBook) {
      throw new ConflictException('A book with this ISBN already exists.');
    }

    let coverImagePath: string | null = null;

    if (file) {
      const allowedExtensions = ['.png', '.jpeg', '.jpg'];
      const maxFileSize = 5 * 1024 * 1024; // 5 MB
      const fileExt = path.extname(file.originalname).toLowerCase();

      if (!allowedExtensions.includes(fileExt)) {
        throw new BadRequestException(
          'Invalid file type. Only PNG, JPEG, or JPG are allowed.',
        );
      }
      if (file.size > maxFileSize) {
        throw new BadRequestException(
          'File is too large. Maximum size is 5MB.',
        );
      }

      const uniqueFilename = `${uuidv4()}${fileExt}`;
      const savePath = path.join('./storage/covers', uniqueFilename);

      try {
        await fs.writeFile(savePath, file.buffer);
        coverImagePath = `/storage/covers/${uniqueFilename}`;
      } catch (error) {
        console.error('Failed to save file:', error);
        throw new InternalServerErrorException(
          'Could not save the cover image.',
        );
      }
    }

    const bookData = {
      ...createBookDto,
      publicationYear: parseInt(createBookDto.publicationYear as any, 10),
      quantity: parseInt(createBookDto.quantity as any, 10),
    };

    const book = this.bookRepository.create({
      ...bookData,
      availableQuantity: bookData.quantity,
      coverImage: coverImagePath,
    });

    return this.bookRepository.save(book);
  }

  async findAll(query: SearchBookDto): Promise<PaginatedBooksResult> {
    const { title, author, page = 1, limit = 10 } = query;
    const queryBuilder = this.bookRepository.createQueryBuilder('book');

    if (title) {
      queryBuilder.andWhere('book.title ILIKE :title', { title: `%${title}%` });
    }
    if (author) {
      queryBuilder.andWhere('book.author ILIKE :author', {
        author: `%${author}%`,
      });
    }

    queryBuilder.skip((page - 1) * limit).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Book> {
    const book = await this.bookRepository.findOneBy({ id });
    if (!book) throw new NotFoundException(`Book with ID ${id} not found.`);
    return book;
  }

  async update(id: number, updateBookDto: UpdateBookDto): Promise<Book> {
    const book = await this.findOne(id);
    if (updateBookDto.quantity !== undefined) {
      const borrowedCount = book.quantity - book.availableQuantity;
      if (updateBookDto.quantity < borrowedCount) {
        throw new BadRequestException(
          'New quantity cannot be less than the number of borrowed books.',
        );
      }
      book.availableQuantity = updateBookDto.quantity - borrowedCount;
    }
    Object.assign(book, updateBookDto);
    return this.bookRepository.save(book);
  }

  async borrow(bookId: number, userId: number): Promise<BorrowRecord> {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const book = await transactionalEntityManager.findOne(Book, {
          where: { id: bookId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!book)
          throw new NotFoundException(`Book with ID ${bookId} not found.`);
        if (book.availableQuantity <= 0)
          throw new BadRequestException(
            'No copies of this book are available.',
          );

        const existingRecord = await transactionalEntityManager.findOne(
          BorrowRecord,
          {
            where: {
              book: { id: bookId },
              user: { id: userId },
              returnedAt: IsNull(),
            },
          },
        );

        if (existingRecord)
          throw new ConflictException('You have already borrowed this book.');

        book.availableQuantity -= 1;
        await transactionalEntityManager.save(book);

        const borrowRecord = transactionalEntityManager.create(BorrowRecord, {
          book: { id: bookId },
          user: { id: userId },
        });
        return transactionalEntityManager.save(borrowRecord);
      },
    );
  }

  async return(bookId: number, userId: number): Promise<BorrowRecord> {
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        const book = await transactionalEntityManager.findOne(Book, {
          where: { id: bookId },
          lock: { mode: 'pessimistic_write' },
        });
        if (!book)
          throw new NotFoundException(`Book with ID ${bookId} not found.`);

        const borrowRecord = await transactionalEntityManager.findOne(
          BorrowRecord,
          {
            where: {
              book: { id: bookId },
              user: { id: userId },
              returnedAt: IsNull(),
            },
          },
        );

        if (!borrowRecord)
          throw new NotFoundException(
            'No active borrow record found for this user and book.',
          );

        if (book.availableQuantity >= book.quantity) {
          throw new InternalServerErrorException(
            'Data inconsistency detected: Cannot return a book when all copies are already available.',
          );
        }

        book.availableQuantity += 1;
        await transactionalEntityManager.save(book);

        borrowRecord.returnedAt = new Date();
        return transactionalEntityManager.save(borrowRecord);
      },
    );
  }

  getBorrowHistory(): Promise<BorrowRecord[]> {
    return this.borrowRecordRepository.find({ relations: ['user', 'book'] });
  }
}
