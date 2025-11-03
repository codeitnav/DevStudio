# **DevStudio – Backend (Server)**

This repository contains the **backend (server)** for DevStudio, built with **Node.js**, **Express**, **MongoDB**, and **Yjs** for real-time synchronization.

---

## **🧩 Tech Stack**

| Category           | Technology                    |
| ------------------ | ----------------------------- |
| Runtime            | Node.js                       |
| Framework          | Express.js                    |
| Database           | MongoDB with Mongoose         |
| Real-time Sync     | Yjs, y-websocket              |
| Authentication     | JWT (jsonwebtoken, bcryptjs)  |
| AI Assistant       | Google Generative AI (Gemini) |
| WebSocket          | Socket.io                     |
| Environment Config | dotenv                        |

---

## **📂 Folder Structure**

```
server/
│
├── src/
│   ├── api/
│   │   ├── controllers/
│   │   │   ├── aiController.js
│   │   │   ├── authController.js
│   │   │   └── roomController.js
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   └── verifyWsToken.js
│   │   │
│   │   ├── routes/
│   │   │   ├── aiRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   └── roomRoutes.js
│   │
│   ├── config/
│   │   ├── db.js
│   │   ├── yjs.js
│   │   └── websocketService.js
│   │
│   ├── models/
│   │   ├── Room.js
│   │   └── User.js
│   │
│   ├── services/
│   │   └── (AI, Yjs, and Room utilities)
│   │
│   └── server.js
│
├── .env.example
├── package.json
├── package-lock.json
└── README.md
```

---

## **⚙️ Environment Variables**

Create a `.env` file in the **server** root directory:

```bash
PORT=5000
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.<cluster-id>.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=<your_jwt_secret_key>
GEMINI_API_KEY=<your_gemini_api_key>
```

---

## **📦 Installation & Setup**

1. **Navigate to server folder:**

   ```bash
   cd server
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Run development server (with auto-restart):**

   ```bash
   npm run dev
   ```

4. **Run production server:**

   ```bash
   npm start
   ```

5. **Server will start on:**

   ```
   http://localhost:5000
   ```

---

## **🧠 AI Integration (Gemini API)**

The AI assistant uses **Google Gemini models** to provide context-aware coding help.

```js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
```

**Key Endpoint:**
`POST /api/ai/ask`

**Request Body:**

```json
{
  "query": "Explain this code snippet",
  "codeContext": "function hello() { console.log('Hi'); }"
}
```

**Response:**

```json
{
  "message": "This function prints 'Hi' to the console..."
}
```

The AI logic includes:

* Automatic model fallback
* Retry on overload errors (503)
* Configured safety filters

---

## **🔑 Authentication**

* **Register User:** `POST /api/auth/register`
* **Login User:** `POST /api/auth/login`
* **JWT Protection:** Routes protected using `authMiddleware.js`
* **Token Validation:** `verifyWsToken.js` for WebSocket connections

Passwords are hashed with **bcryptjs**, and JWT tokens are used for secure access.

---

## **🏠 Room Management**

* **Create Room:** `POST /api/room/create`
* **Join Room:** `POST /api/room/join`
* **Delete Room:** Only the **creator** can delete.

  * If a member attempts deletion, the frontend triggers a **“Permission Denied” modal**.

Each room is stored in MongoDB and synchronized via **Yjs documents** for real-time editing.

---

## **🕸️ WebSocket Services**

* **Library Used:** `socket.io` + `y-websocket`
* Handles collaborative coding sessions and file explorer synchronization.
* Uses custom authentication middleware (`verifyWsToken.js`) to secure connections.

---

## **💻 API Routes Overview**

| Route                | Description                   | Auth Required |
| -------------------- | ----------------------------- | ------------- |
| `/api/auth/register` | Register new user             | No            |
| `/api/auth/login`    | Login existing user           | No            |
| `/api/room/create`   | Create new collaboration room | Yes           |
| `/api/room/join`     | Join an existing room         | Yes           |
| `/api/room/delete`   | Delete owned room             | Yes           |
| `/api/ai/ask`        | Query Gemini AI for help      | Yes           |

---

## **🧰 Scripts**

| Command       | Description                  |
| ------------- | ---------------------------- |
| `npm run dev` | Start server with nodemon    |
| `npm start`   | Start production server      |
| `npm test`    | Placeholder for test scripts |

---

## **📘 Dependencies**

```json
{
  "express": "^5.1.0",
  "mongoose": "^8.18.2",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^3.0.2",
  "cors": "^2.8.5",
  "socket.io": "^4.8.1",
  "dotenv": "^17.2.2",
  "@google/generative-ai": "^0.24.1",
  "yjs": "^13.6.27",
  "y-websocket": "^1.5.4",
  "y-mongodb-provider": "^0.2.1"
}
```

---

## **🧩 Integration with Frontend**

Frontend communicates with backend via:

* **HTTP API:** For authentication, room management, and AI queries
* **WebSocket:** For real-time code and file synchronization

Ensure environment variables match:

| Frontend (.env)                                 | Backend (.env)                     |
| ----------------------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_API_URL=http://localhost:5000/api` | `PORT=5000`                        |
| `NEXT_PUBLIC_WS_URL=ws://localhost:5000`        | `CLIENT_URL=http://localhost:3000` |

---
