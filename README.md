# ACK's AI - AI-Powered SaaS Platform

<img width="1777" height="907" alt="image" src="https://github.com/user-attachments/assets/122df56d-8222-42bd-8016-4fbb0a228cf6" />

A full-stack AI-powered SaaS application built with the PERN stack (PostgreSQL, Express.js, React, Node.js) that offers various AI tools for content creation and image processing.

## 🚀 Features

### AI Content Generation

- **Article Writer**: Generate high-quality articles with customizable length
- **Blog Title Generator**: Create catchy titles for blog posts across different categories
- **Resume Reviewer**: AI-powered resume analysis and feedback

### AI Image Tools

- **Image Generation**: Create stunning visuals from text descriptions with multiple style options
- **Background Removal**: Remove backgrounds from images automatically
- **Object Removal**: Intelligently remove unwanted objects from photos

### Additional Features

- **User Authentication**: Secure authentication with Clerk
- **Subscription Management**: Free and Premium plans with usage limits
- **Community Gallery**: Share and discover AI-generated images
- **Real-time Dashboard**: Track usage and view creation history

  <img width="1676" height="787" alt="image" src="https://github.com/user-attachments/assets/bc3f8daa-c274-4e7e-b417-ef5ab52cb1d9" />


## 🛠️ Tech Stack

### Frontend

- **React 19** with Vite
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Clerk** for authentication
- **Axios** for API calls
- **React Hot Toast** for notifications
- **React Markdown** for content rendering
- **Lucide React** for icons

### Backend

- **Node.js** with Express.js
- **PostgreSQL** with Neon Database
- **Clerk** for authentication middleware
- **Multer** for file uploads
- **Cloudinary** for image processing and storage

### AI Services

- **Google Gemini**
- **Google Imagen**
- **Cloudinary AI Features**

## 📁 Project Structure

```
ai-saas-app-pern-stack/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   └── assets/         # Static assets
│   ├── public/             # Public assets
│   └── package.json
├── server/                 # Backend Node.js application
│   ├── controllers/        # Route controllers
│   ├── middlewares/        # Custom middleware
│   ├── routes/             # API routes
│   ├── configs/            # Configuration files
│   └── package.json
├── LICENSE
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database (Neon recommended)
- Clerk account for authentication
- Google AI API keys
- Cloudinary account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/charith-codex/ai-saas-app-pern-stack.git
   cd ai-saas-app-pern-stack
   ```

2. **Install server dependencies**

   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd client
   npm install
   ```

### Environment Configuration

#### Server Environment Variables

Create a `.env` file in the `server` directory:

```env
# Database
DATABASE_URL=your_neon_database_url

# Clerk Authentication
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# AI APIs
GEMINI_API_KEY=your_gemini_api_key

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

#### Client Environment Variables

Create a `.env` file in the `client` directory:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_BASE_URL=http://localhost:3000
```

### Database Setup

1. Create a PostgreSQL database (recommend using [Neon](https://neon.tech))
2. Create the required tables:

```sql
CREATE TABLE creations (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    prompt TEXT NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    publish BOOLEAN DEFAULT FALSE,
    likes TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Running the Application

1. **Start the server** (from the server directory):

   ```bash
   npm run server
   ```

2. **Start the client** (from the client directory):
   ```bash
   npm run dev
   ```

The application will be available at:

The application will be available at:

- **Client**: `http://localhost:5173`
- **Server**: `http://localhost:3000`

## 🔧 API Endpoints

### AI Routes

- `POST /api/ai/generate-article` - Generate articles
- `POST /api/ai/generate-blog-title` - Generate blog titles
- `POST /api/ai/generate-image` - Generate images
- `POST /api/ai/remove-image-background` - Remove image backgrounds
- `POST /api/ai/remove-image-object` - Remove objects from images
- `POST /api/ai/review-resume` - Review resumes

### User Routes

- `GET /api/user/get-user-creations` - Get user's creations
- `GET /api/user/get-published-creations` - Get published creations
- `POST /api/user/toggle-like-creation` - Toggle like on creation

## 📝 Usage

1. **Sign Up/Login**: Create an account or login using Clerk authentication
2. **Choose AI Tool**: Select from various AI tools in the dashboard
3. **Generate Content**: Enter prompts and configure options
4. **Manage Creations**: View, share, and manage your AI-generated content
5. **Upgrade Plan**: Subscribe to Premium for unlimited access

## 🔐 Authentication & Authorization

The application uses Clerk for authentication with the following features:

- User registration and login
- Plan-based access control (Free vs Premium)
- Usage tracking for free users
- Secure API endpoints with Clerk

## 📊 Subscription Plans

### Free Plan

- 10 AI generations per month
- Basic AI tools access
- Community features

### Premium Plan

- Unlimited AI generations
- Access to all AI tools

## 🚀 Deployment

### Frontend (Vercel)

The `client/vercel.json` is configured for SPA deployment:

### Backend (Vercel)

The `server/vercel.json` is configured for serverless deployment:

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Special thanks to **[GreatStack](https://www.youtube.com/@GreatStackDev)** for the excellent tutorial:

- **Tutorial**: [Build and Deploy a Full Stack AI SaaS App using React js | Complete PERN Stack Project](https://youtu.be/RkYIWg5XAnI)

Additional acknowledgments:

- [Clerk](https://clerk.com/) for authentication
- [Google AI](https://ai.google.dev/) for AI capabilities
- [Cloudinary](https://cloudinary.com/) for image processing
- [Neon](https://neon.tech/) for PostgreSQL database
- [Vercel](https://vercel.com/) for deployment platform

## 🌟 Show your support

Give a ⭐️ if this project helped you!
