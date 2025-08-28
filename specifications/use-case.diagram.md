graph TD
    subgraph Actors
        Admin --> Librarian
        Librarian --> User
        User --> Unauthenticated_User
    end

    subgraph "Book Library System"
        UC1[Authenticate]
        UC2[Add New Book]
        UC3[View Book List]
        UC4[Search for Book]
        UC5[View Book Details]
        UC6[Update Book Details]
        UC7[Borrow Book]
        UC8[Return Book]
        UC9[Manage Users & Roles]
        UC10[View Borrowing History]
    end

    Unauthenticated_User --> UC1
    User --> UC2
    User --> UC3
    User --> UC4
    User --> UC5
    User --> UC6
    User --> UC7
    User --> UC8
    Librarian --> UC10
    Admin --> UC9