# **DevStudio**

**DevStudio** is a real-time collaborative coding platform that enables developers to create rooms, invite team members, and code together in real time. It offers a fully synchronized **collaborative file explorer**, **integrated AI assistant**, and a seamless **multi-user editing experience** powered by **Y.js**, **WebSockets**, and **Next.js**.

---

## **🚀 Features**

* **Real-time Collaboration:**
  Code with your teammates simultaneously with instant synchronization using Y.js and WebSockets.

* **Room Management:**
  Create or join rooms, manage participants, and collaborate securely.

* **Collaborative File Explorer:**
  Browse, create, rename, and delete files in real time within shared rooms.

* **AI Chat Assistant:**
  Get AI-powered code suggestions, explanations, and debugging help directly in your workspace.

* **User Authentication:**
  Secure login and signup functionality with JWT authentication and password hashing.

* **Modern UI/UX:**
  Built with **Next.js 15**, **Tailwind CSS 4**, and **TypeScript** for a smooth developer experience.

---

## **🧠 Tech Stack**

### **Frontend**

* **Framework:** Next.js 15 (Turbopack)
* **Language:** TypeScript
* **Styling:** Tailwind CSS, shadcn/ui
* **Editor:** Monaco Editor
* **State Management:** React Context API
* **Realtime Engine:** Y.js + y-websocket + y-webrtc
* **AI Integration:** Axios + REST API (Gemini)

### **Backend**

* **Framework:** Express.js
* **Database:** MongoDB with Mongoose
* **Auth:** JWT, bcryptjs
* **Realtime:** Socket.io + y-websocket
* **AI Engine:** Google Generative AI (Gemini)
* **Utilities:** nanoid

---

## **📁 Project Structure**

### **Client (Frontend)**

```
client/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── playground/[roomId]/
│   │   ├── signup/
│   ├── components/
│   │   ├── ui/
│   │   ├── context/
│   ├── hooks/
│   ├── lib/
│   │   ├── services/
│   ├── constants.ts
│   ├── globals.css
```

### **Server (Backend)**

```
server/
├── src/
│   ├── api/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   ├── config/
│   ├── models/
│   ├── services/
│   ├── server.js
```

---

## **⚙️ Environment Variables**

### **Frontend (`client/.env`)**

```
PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_WS_URL=ws://localhost:5000
```

### **Backend (`server/.env`)**

```
PORT=5000
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.<cluster-id>.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=<your_jwt_secret_key>
GEMINI_API_KEY=<your_gemini_api_key>
```

---

## **🧩 AI Chat Integration**

The AI assistant uses **Google Generative AI (Gemini)** for contextual coding help.
It supports automatic model fallback and exponential retry in case of API overloads or transient failures.

```js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
```

---

## **🖥️ Running the Project**

### **1. Clone the Repository**

```bash
git clone https://github.com/codeitnav/DevStudio.git
cd DevStudio
```

### **2. Setup the Server**

```bash
cd server
npm install
npm run dev
```

### **3. Setup the Client**

```bash
cd client
npm install
npm run dev
```

The frontend will run on **[http://localhost:3000](http://localhost:3000)**
The backend will run on **[http://localhost:5000](http://localhost:5000)**

---

## **🌐 Realtime Collaboration Architecture**

| Layer    | Technology             | Purpose                      |
| -------- | ---------------------- | ---------------------------- |
| Frontend | Y.js, y-monaco         | Shared code editing          |
| Backend  | y-websocket, Socket.io | Data synchronization         |
| Database | MongoDB                | User, Room, and File storage |
| AI Layer | Gemini API             | AI assistant responses       |

---

## **📚 Future Enhancements**

* Realtime voice/video collaboration
* Integrated GitHub file import/export

---

## **👨‍💻 Author**

**Navya Srivastava**
[LinkedIn](https://www.linkedin.com/in/navya-srivastava2810/) | [GitHub](https://github.com/codeitnav)

---