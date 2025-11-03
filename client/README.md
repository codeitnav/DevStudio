# **DevStudio – Frontend**

This repository contains the **frontend** built with **Next.js (TypeScript)**, **Tailwind CSS**, and **Yjs** for real-time synchronization.

---

## **🧩 Tech Stack**

| Category         | Technology                           |
| ---------------- | ------------------------------------ |
| Framework        | Next.js (v15)                        |
| Language         | TypeScript                           |
| State Management | React Context API                    |
| Styling          | Tailwind CSS                         |
| Real-time Sync   | Yjs, y-websocket, y-monaco, y-webrtc |
| Editor           | Monaco Editor                        |
| AI Integration   | Gemini API                           |
| Authentication   | JWT-based                            |
| Utilities        | Axios, nanoid, boring-avatars        |

---

## **📂 Folder Structure**

```
client/
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── dashboard/
│   │   ├── playground/[roomId]/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │
│   ├── context/
│   │   └── AuthContext.tsx
│   │
│   ├── hooks/
│   │   ├── useYjs.ts
│   │   └── y-monaco.ts
│   │
│   ├── lib/
│   │   ├── services/
│   ├── constants.ts
│   │
│   └── globals.css
│
├── .env.example
├── next.config.ts
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## **⚙️ Environment Variables**

Create a `.env` file in the **client** root directory:

```bash
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

---

## **📦 Installation**

1. **Navigate to client folder:**

   ```bash
   cd client
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start development server:**

   ```bash
   npm run dev
   ```

4. **Access the app:**

   ```
   http://localhost:3000
   ```

---

## **🧠 AI Chat Integration**

The AI assistant (DevStudio AI) uses **Gemini API** through the backend.
Frontend interacts via `POST /api/ai/ask` to fetch AI-generated suggestions, explanations, and refactoring tips directly in the chat panel.

---

## **🔐 Authentication Flow**

* New users register via `/signup`.
* JWT tokens are stored securely in the browser (HTTP-only cookie or local storage).
* Protected routes are wrapped in authentication context to restrict unauthorized access.

---

## **💻 Development Scripts**

| Command         | Description                                           |
| --------------- | ----------------------------------------------------- |
| `npm run dev`   | Start development server using Next.js with Turbopack |
| `npm run build` | Build optimized production bundle                     |
| `npm start`     | Start the production server                           |

---

## **🧠 Key Libraries**

* **Next.js 15** – Frontend framework
* **Yjs & y-websocket** – Real-time CRDT synchronization
* **Monaco Editor** – Code editing interface
* **Google Generative AI (Gemini)** – AI pair programmer
* **Tailwind CSS** – Styling framework
* **Axios** – API communication
* **JWT Decode** – Token handling
* **Lucide Icons & Radix UI** – UI components

---