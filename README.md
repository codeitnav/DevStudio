# DevStudio - Real-Time Collaborative Code Editor

DevStudio is a **real-time collaborative code editor** that brings the power of **instant synchronization, WebSockets, and state management** into one seamless application. Inspired by tools like **VS Code Live Share** and **Google Docs**, this project proves your ability to design **modern, scalable, and interactive applications** that go far beyond simple CRUD apps.

---

## 🚀 Why DevStudio?

India and the world are moving fast towards **remote work and collaboration-first environments**. DevStudio addresses one of the biggest developer needs:  
> *"How can teams code together in real-time, with instant updates, while maintaining reliability, security, and performance?"*

**This project highlights**:

- **Real-Time Systems (WebSockets):** Mastery of live, bidirectional communication.
- **State Synchronization:** Handling concurrency where multiple users type at the same time.
- **Third-Party Integrations:** Use of the **Monaco Editor** (that powers VS Code).
- **Scalable Backend:** Built with **Node.js, Express, MongoDB, Redis, and Socket.io**.
- **Modern Frontend:** Built with **React (Vite + TypeScript + Zustand + TailwindCSS)**.

---

## ✨ Features

- 🔴 **Live Collaboration** – Multiple users can edit the same code file in real-time.  
- 📝 **Monaco Editor Integration** – A professional editor experience, the same as VS Code.  
- 🔄 **Conflict-Free State Sync** – Powered by **Yjs** for distributed real-time editing.  
- 🔐 **Authentication & Security** – JWT-based authentication with secure data flow.  
- ⚡ **Low Latency** – Redis caching and WebSocket optimization for fast updates.  
- 📡 **Scalable Architecture** – Can handle multiple rooms and large teams.  
- 📧 **Email Notifications** – Nodemailer integration for inviting collaborators.  
- 🛡️ **Production-Ready** – With Helmet, CORS, rate-limiting, and logging (morgan).  

---

## 🛠️ Tech Stack

### **Frontend**
- React 18 + Vite + TypeScript
- Zustand (state management)
- React Query (data fetching & caching)
- TailwindCSS (UI styling)
- Monaco Editor (`@monaco-editor/react`)
- Socket.IO Client
- Zod + React Hook Form (form validation)

### **Backend**
- Node.js + Express
- MongoDB + Mongoose
- Redis (caching and session management)
- Socket.IO (real-time communication)
- Yjs + y-websocket + y-mongodb-provider (CRDT for collaborative editing)
- JWT (authentication)
- Nodemailer (email service)

---

## 📂 Project Structure
```bash
DevStudio/
│── frontend/ # React + Vite + TypeScript
│ ├── src/ # Components, pages, hooks, utils
│ ├── public/ # Static assets
│ └── package.json
│
│── backend/ # Node.js + Express + MongoDB
│ ├── src/ # Controllers, models, routes, server.js
│ ├── .env # Environment variables
│ └── package.json
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repo
```bash
git clone https://github.com/codeitnav/DevStudio.git
cd DevStudio
```

2️⃣ Setup Backend
```bash
cd backend
npm install
cp .env.example .env   # configure environment variables
npm run dev            # start backend in dev mode
```
3️⃣ Setup Frontend
```bash
cd frontend
npm install
npm run dev            # start frontend dev server
```
🔑 Environment Variables

Backend .env example:
```bash
PORT=5000
MONGO_URI=mongodb://localhost:27017/devstudio
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_password
```

## 📈 Future Enhancements

🔍 Code syntax highlighting and linting in real-time.

🎥 Integrated video/audio chat with WebRTC.

☁️ Cloud storage integration (AWS/GCP).

🏗️ Dockerized deployment.