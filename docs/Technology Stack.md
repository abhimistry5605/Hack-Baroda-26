# Technology Stack

SafeDeploy is built on the robust MERN stack, offering rapid prototyping and scalability suitable for hackathons and production environments alike.

## Frontend
- **Framework**: React.js (built with Vite for fast builds and hot module replacement)
- **Routing**: React Router (v6) for seamless single-page application navigation
- **Styling**: Tailwind CSS (v4) for custom modern dashboard components and dark-mode features
- **Icons**: Lucide React for consistent and crisp vector icons
- **State Management**: React Context / Hooks for lightweight status sync

## Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (RESTful endpoints, modular routers, error middlewares)
- **Database Client**: Mongoose (strict schema-based modeling for MongoDB)
- **Development Tooling**: Nodemon (hot-reloads code on server changes)

## Database
- **Engine**: MongoDB (Document-store model fits unstructured log outputs, stack traces, and variable metadata)
- **Indexing**: Full-text and regex-enabled searches over log fields and resolution documents

## AI & Query Search
- **AI Simulator**: An internal text-matching, tag-filtering, and response-synthesis controller simulating LLM logic. Easily expandable to OpenAI API or Pinecone vector DB indices by swapping the service connector.
