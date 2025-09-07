# DevStudio Frontend

A modern collaborative code editor built with React, TypeScript, and real-time collaboration features.

## Features

- 🚀 Real-time collaborative code editing
- 👥 Multi-user presence and awareness
- 📁 File and folder management
- 🔐 User authentication and guest access
- 🎨 Monaco Editor with syntax highlighting
- 📱 Responsive design for all devices
- ⚡ Built with Vite for fast development

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Monaco Editor** for code editing
- **Yjs** for collaborative editing (CRDT)
- **Socket.io** for real-time communication
- **React Router** for navigation
- **Zustand** for state management
- **React Query** for server state
- **React Hook Form** with Zod validation

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
├── components/     # React components
├── services/       # API and service layer
├── hooks/          # Custom React hooks
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── lib/            # Third-party library configurations
├── App.tsx         # Main App component
└── main.tsx        # Application entry point
```

## Environment Variables

- `VITE_API_URL` - Backend API URL
- `VITE_SOCKET_URL` - Socket.io server URL
- `VITE_APP_NAME` - Application name

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Submit pull requests for review