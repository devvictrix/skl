// backend/src/users/users.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User, UserRole } from '../database/entities/user.entity';
import { ConflictException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

type MockRepository<T = any> = {
  findOneBy: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
};

const createMockRepository = <T = any>(): MockRepository<T> => ({
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useFactory: createMockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      username: 'newuser',
      password: 'password123',
      role: UserRole.ADMIN,
    };

    const savedUser = {
      id: 1,
      ...createUserDto,
    };

    it('should create and return a new user, excluding the password', async () => {
      userRepository.findOneBy.mockResolvedValue(null);
      userRepository.create.mockReturnValue(createUserDto as any);
      userRepository.save.mockResolvedValue(savedUser as any);

      const result = await service.create(createUserDto);

      expect(userRepository.findOneBy).toHaveBeenCalledWith({
        username: createUserDto.username,
      });
      expect(userRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(userRepository.save).toHaveBeenCalledWith(createUserDto);

      expect(result).toEqual({
        id: savedUser.id,
        username: savedUser.username,
        role: savedUser.role,
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should throw ConflictException if username already exists', async () => {
      userRepository.findOneBy.mockResolvedValue(savedUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should default to MEMBER role if no role is provided', async () => {
      const noRoleDto: CreateUserDto = {
        username: 'anotheruser',
        password: 'password123',
      };
      const userWithDefaultRole = { ...noRoleDto, role: UserRole.MEMBER };

      userRepository.findOneBy.mockResolvedValue(null);
      userRepository.create.mockReturnValue(userWithDefaultRole);
      userRepository.save.mockResolvedValue({ id: 2, ...userWithDefaultRole });

      await service.create(noRoleDto);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.MEMBER,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      const user = {
        id: 1,
        username: 'test',
        password: 'pw',
        role: UserRole.MEMBER,
      };
      userRepository.findOneBy.mockResolvedValue(user);

      const result = await service.findOne('test');
      expect(result).toEqual(user);
    });

    it('should return null if user is not found', async () => {
      userRepository.findOneBy.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');
      expect(result).toBeNull();
    });
  });
});
