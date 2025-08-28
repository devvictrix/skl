// backend/src/core/database/data-source.ts

import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config({ path: '.env' });

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: ['dist/database/entities/*.entity.js'],
  migrations: ['dist/core/database/migrations/*.js'],
  synchronize: false,
});
