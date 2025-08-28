// backend/src/database/entities/borrow-record.entity.ts

import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Book } from './book.entity';

@Entity()
export class BorrowRecord {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn()
  borrowedAt: Date;

  @CreateDateColumn({ nullable: true })
  returnedAt: Date | null;

  @ManyToOne(() => User, (user) => user.borrowRecords)
  user: User;

  @ManyToOne(() => Book, (book) => book.borrowRecords)
  book: Book;
}
