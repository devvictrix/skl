import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../database/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

type UserCreationResponse = { id: number; username: string; role: UserRole };

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async findOne(username: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ username });
  }

  async create(createUserDto: CreateUserDto): Promise<UserCreationResponse> {
    const existingUser = await this.usersRepository.findOneBy({
      username: createUserDto.username,
    });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }
    const user = this.usersRepository.create({
      ...createUserDto,
      role: createUserDto.role || UserRole.MEMBER,
    });
    const savedUser = await this.usersRepository.save(user);
    const { password, borrowRecords, hashPassword, ...result } = savedUser;
    return result;
  }
}
