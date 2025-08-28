backend/
├── src/
│   ├── auth/
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   ├── books/
│   │   ├── dto/
│   │   │   ├── create-book.dto.ts
│   │   │   ├── search-book.dto.ts
│   │   │   └── update-book.dto.ts
│   │   ├── books.controller.ts
│   │   ├── books.module.ts
│   │   └── books.service.ts
│   ├── core/
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── data-source.ts
│   │   └── core.module.ts
│   ├── database/
│   │   └── entities/
│   │       ├── book.entity.ts
│   │       ├── borrow-record.entity.ts
│   │       └── user.entity.ts
│   ├── users/
│   │   ├── dto/
│   │   ├── users.controller.ts
│   │   ├── users.module.ts
│   │   └── users.service.ts
│   ├── app.module.ts
│   └── main.ts
├── .dockerignore
├── .env
├── .eslintignore
├── .eslintrc.js
├── Dockerfile
├── package.json
└── tsconfig.json