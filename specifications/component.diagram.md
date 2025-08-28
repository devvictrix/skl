graph TD
    subgraph "Browser (Client-Side)"
        A1["React Frontend (Vite + MUI)"]
    end

    subgraph "Backend (NestJS API)"
        B1["API Gateway (RESTful)"]
        B2["Auth Service"]
        B3["Books Service <br>(Handles Core Logic, Inventory, and History)"]
        B4["Users Service"]
    end

    subgraph "Data & Storage"
        C1[(PostgreSQL Database)]
        C2[("Local File Storage <br> (for cover images)")]
    end

    %% --- Connections ---

    A1 --> B1

    B1 --> B2
    B1 --> B3
    B1 --> B4

    B2 --> C1
    B3 --> C1
    B3 --> C2
    B4 --> C1