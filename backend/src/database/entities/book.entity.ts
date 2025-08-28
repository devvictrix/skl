import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BorrowRecord } from './borrow-record.entity';

@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  author: string;

  @Column({ unique: true })
  isbn: string;

  @Column()
  publicationYear: number;

  @Column()
  quantity: number;

  @Column()
  availableQuantity: number;

  @Column({ type: 'varchar', nullable: true })
  coverImage: string | null;

  @OneToMany(() => BorrowRecord, (record) => record.book)
  borrowRecords: BorrowRecord[];
}
