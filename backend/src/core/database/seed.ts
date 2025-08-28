// backend/src/core/database/seed.ts

import AppDataSource from './data-source-seed';
import { User, UserRole } from '../../database/entities/user.entity';
import { Book } from '../../database/entities/book.entity';

/**
 * The main function to seed the database.
 * It initializes the data source, seeds users and books, and then closes the connection.
 */
async function seedDatabase() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection initialized for seeding.');

    const userRepository = AppDataSource.getRepository(User);
    const bookRepository = AppDataSource.getRepository(Book);

    const usersToSeed = [
      { username: 'admin', password: 'password123', role: UserRole.ADMIN },
      {
        username: 'librarian',
        password: 'password123',
        role: UserRole.LIBRARIAN,
      },
      { username: 'member', password: 'password123', role: UserRole.MEMBER },
    ];

    console.log('Seeding users...');
    for (const userData of usersToSeed) {
      const userExists = await userRepository.findOneBy({
        username: userData.username,
      });
      if (!userExists) {
        const newUser = userRepository.create(userData);
        await userRepository.save(newUser);
        console.log(`- User "${userData.username}" created.`);
      } else {
        console.log(`- User "${userData.username}" already exists. Skipping.`);
      }
    }
    console.log('User seeding complete.');

    const booksToSeed = [
      {
        title: 'The Lord of the Rings',
        author: 'J.R.R. Tolkien',
        isbn: '978-0618640157',
        publicationYear: 1954,
        quantity: 5,
        availableQuantity: 5,
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        isbn: '978-0446310789',
        publicationYear: 1960,
        quantity: 3,
        availableQuantity: 3,
      },
      {
        title: '1984',
        author: 'George Orwell',
        isbn: '978-0451524935',
        publicationYear: 1949,
        quantity: 7,
        availableQuantity: 7,
      },
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        isbn: '978-0743273565',
        publicationYear: 1925,
        quantity: 4,
        availableQuantity: 2,
      },
      {
        title: 'Dune',
        author: 'Frank Herbert',
        isbn: '978-0441013593',
        publicationYear: 1965,
        quantity: 6,
        availableQuantity: 6,
      },
    ];

    console.log('Seeding books...');
    for (const bookData of booksToSeed) {
      const bookExists = await bookRepository.findOneBy({
        isbn: bookData.isbn,
      });
      if (!bookExists) {
        const newBook = bookRepository.create(bookData);
        await bookRepository.save(newBook);
        console.log(`- Book "${bookData.title}" created.`);
      } else {
        console.log(`- Book "${bookData.title}" already exists. Skipping.`);
      }
    }
    console.log('Book seeding complete.');
  } catch (error) {
    console.error('Error during database seeding:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed.');
    }
  }
}

seedDatabase();
