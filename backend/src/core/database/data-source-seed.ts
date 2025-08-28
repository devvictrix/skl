import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['src/database/entities/*.entity.ts'],
  migrations: ['src/core/database/migrations/*.ts'],
  synchronize: false,
});
