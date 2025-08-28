// backend/src/books/books.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import { BooksService } from './books.service';
import { Book } from '../database/entities/book.entity';
import { BorrowRecord } from '../database/entities/borrow-record.entity';
import {
  NotFoundException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { User, UserRole } from '../database/entities/user.entity';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';

jest.mock('fs', () => {
  const originalModule = jest.requireActual('fs');
  return {
    ...originalModule,
    promises: {
      ...originalModule.promises,
      writeFile: jest.fn(),
    },
  };
});
jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

type MockRepository<T = any> = {
  findOneBy: jest.Mock;
  findOne: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  find: jest.Mock;
  createQueryBuilder: jest.Mock;
};

type MockEntityManager = {
  findOne: jest.Mock;
  save: jest.Mock;
  create: jest.Mock;
  transaction: jest.Mock;
};

const createMockRepository = <T = any>(): MockRepository<T> => ({
  findOneBy: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn(),
  })),
});

const createMockEntityManager = (): MockEntityManager => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn((entity, data) => ({ ...data, constructor: entity })),
  transaction: jest.fn().mockImplementation(async (callback) => {
    const transactionalEntityManager = createMockEntityManager();
    return callback(transactionalEntityManager);
  }),
});

const mockUser: User = {
  id: 1,
  username: 'testuser',
  password: 'hashedpassword',
  role: UserRole.MEMBER,
  borrowRecords: [],
  hashPassword: jest.fn(),
};

const mockBook: Book = {
  id: 1,
  title: 'Test Book',
  author: 'Test Author',
  isbn: '1234567890',
  publicationYear: 2024,
  quantity: 5,
  availableQuantity: 5,
  coverImage: 'path/to/image.jpg',
  borrowRecords: [],
};

describe('BooksService', () => {
  let service: BooksService;
  let bookRepository: MockRepository<Book>;
  let entityManager: MockEntityManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: getRepositoryToken(Book), useFactory: createMockRepository },
        {
          provide: getRepositoryToken(BorrowRecord),
          useFactory: createMockRepository,
        },
        { provide: EntityManager, useFactory: createMockEntityManager },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
    bookRepository = module.get(getRepositoryToken(Book));
    entityManager = module.get(EntityManager);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a book with a cover image', async () => {
      const createDto = {
        title: 'New Book',
        author: 'New Author',
        quantity: 10,
        publicationYear: 2025,
        isbn: '111',
      };
      const file = {
        originalname: 'cover.png',
        buffer: Buffer.from('test-image-data'),
        size: 100,
      } as any;

      bookRepository.findOneBy.mockResolvedValue(null);

      (uuidv4 as jest.Mock).mockReturnValue('mock-uuid-1234');
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      bookRepository.create.mockReturnValue({
        ...createDto,
        availableQuantity: 10,
      });

      bookRepository.save.mockResolvedValue({
        id: 2,
        ...createDto,
        availableQuantity: createDto.quantity,
        coverImage: '/storage/covers/mock-uuid-1234.png',
      });

      const result = await service.create(createDto, file);

      expect(fs.writeFile).toHaveBeenCalled();
      expect(result.coverImage).toBe('/storage/covers/mock-uuid-1234.png');
    });

    it('should create a book without a cover image (sets to null)', async () => {
      const createDto = {
        title: 'New Book',
        author: 'New Author',
        quantity: 10,
        publicationYear: 2025,
        isbn: '111',
      };

      bookRepository.findOneBy.mockResolvedValue(null);
      bookRepository.create.mockReturnValue({
        ...createDto,
        availableQuantity: 10,
      });
      bookRepository.save.mockResolvedValue({
        id: 2,
        ...createDto,
        coverImage: null,
      });

      const result = await service.create(createDto, undefined as any);

      expect(result.coverImage).toBeNull();
      expect(fs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update a book and correctly recalculate available quantity', async () => {
      const bookToUpdate = { ...mockBook, quantity: 10, availableQuantity: 8 };
      const updateDto = { quantity: 12 };
      jest.spyOn(service, 'findOne').mockResolvedValue(bookToUpdate as Book);
      await service.update(mockBook.id, updateDto);
      expect(bookRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockBook.id,
          quantity: 12,
          availableQuantity: 10,
        }),
      );
    });

    it('should throw BadRequestException if new quantity is less than borrowed count', async () => {
      const bookToUpdate = { ...mockBook, quantity: 10, availableQuantity: 8 };
      const updateDto = { quantity: 1 };
      jest.spyOn(service, 'findOne').mockResolvedValue(bookToUpdate as Book);
      await expect(service.update(mockBook.id, updateDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('borrow', () => {
    it('should successfully borrow a book', async () => {
      const transactionalEntityManager = createMockEntityManager();
      entityManager.transaction.mockImplementation((cb) =>
        cb(transactionalEntityManager),
      );
      transactionalEntityManager.findOne
        .mockResolvedValueOnce(mockBook)
        .mockResolvedValueOnce(null);
      await service.borrow(mockBook.id, mockUser.id);
      expect(transactionalEntityManager.findOne).toHaveBeenCalledWith(
        Book,
        expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
      );
      expect(transactionalEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockBook.id, availableQuantity: 4 }),
      );
      expect(transactionalEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          book: { id: mockBook.id },
          user: { id: mockUser.id },
        }),
      );
    });

    it('should throw BadRequestException if book has 0 available quantity', async () => {
      const unavailableBook = { ...mockBook, availableQuantity: 0 };
      const transactionalEntityManager = createMockEntityManager();
      entityManager.transaction.mockImplementation((cb) =>
        cb(transactionalEntityManager),
      );
      transactionalEntityManager.findOne.mockResolvedValueOnce(unavailableBook);
      await expect(service.borrow(mockBook.id, mockUser.id)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if user has already borrowed the book', async () => {
      const transactionalEntityManager = createMockEntityManager();
      entityManager.transaction.mockImplementation((cb) =>
        cb(transactionalEntityManager),
      );
      transactionalEntityManager.findOne
        .mockResolvedValueOnce(mockBook)
        .mockResolvedValueOnce(new BorrowRecord());
      await expect(service.borrow(mockBook.id, mockUser.id)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if book does not exist', async () => {
      const transactionalEntityManager = createMockEntityManager();
      entityManager.transaction.mockImplementation((cb) =>
        cb(transactionalEntityManager),
      );
      transactionalEntityManager.findOne.mockResolvedValueOnce(null);
      await expect(service.borrow(999, mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('return', () => {
    const activeBorrowRecord = new BorrowRecord();
    activeBorrowRecord.id = 1;
    activeBorrowRecord.user = mockUser;
    activeBorrowRecord.book = mockBook;
    activeBorrowRecord.returnedAt = null;

    it('should successfully return a book', async () => {
      const bookBeforeReturn = { ...mockBook, availableQuantity: 4 };
      const transactionalEntityManager = createMockEntityManager();
      entityManager.transaction.mockImplementation((cb) =>
        cb(transactionalEntityManager),
      );
      transactionalEntityManager.findOne
        .mockResolvedValueOnce(bookBeforeReturn)
        .mockResolvedValueOnce(activeBorrowRecord);
      await service.return(mockBook.id, mockUser.id);
      expect(transactionalEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({ id: mockBook.id, availableQuantity: 5 }),
      );
      expect(transactionalEntityManager.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: activeBorrowRecord.id,
          returnedAt: expect.any(Date),
        }),
      );
    });

    it('should throw NotFoundException if no active borrow record is found', async () => {
      const transactionalEntityManager = createMockEntityManager();
      entityManager.transaction.mockImplementation((cb) =>
        cb(transactionalEntityManager),
      );
      transactionalEntityManager.findOne
        .mockResolvedValueOnce(mockBook)
        .mockResolvedValueOnce(null);
      await expect(service.return(mockBook.id, mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw InternalServerErrorException if trying to return a book when all copies are available', async () => {
      const bookWithAllCopies = {
        ...mockBook,
        availableQuantity: mockBook.quantity,
      };
      const transactionalEntityManager = createMockEntityManager();
      entityManager.transaction.mockImplementation((cb) =>
        cb(transactionalEntityManager),
      );
      transactionalEntityManager.findOne
        .mockResolvedValueOnce(bookWithAllCopies)
        .mockResolvedValueOnce(activeBorrowRecord);
      await expect(service.return(mockBook.id, mockUser.id)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
