# MongoDB GUI Admin Panel

A premium, phpMyAdmin-inspired MongoDB administration interface built with Next.js. Manage your MongoDB databases, collections, and users with a familiar and intuitive UI.

![Dashboard Preview](https://raw.githubusercontent.com/atikurmsps/MongoDB-GUI-Admin-Panel/main/public/preview.png) *(Note: Add a real preview image if available)*

## 🚀 Features

- **Database Management**: 
  - Create and delete databases via a centralized dashboard.
  - View database sizes and metadata at a glance.
- **Collection Management**:
  - Full CRUD operations for collections.
  - **Import/Export**: Easily move data with JSON/CSV support.
- **Document Explorer**:
  - Browse documents in a clean, table-based view.
  - Inline editing and insertion of new documents.
  - Powerful deletion confirm flow.
- **Advanced User Management**:
  - Comprehensive user account management for each database.
  - **Role Assignment**: Manage privileges (read, readWrite, dbAdmin, etc.) easily.
  - **Live Connection URIs**: Real-time generation of complete connection strings.
  - **Click-to-Copy**: Instant copying of connection URIs from the table or modals.
  - **Password Updates**: Update user credentials directly from the UI.
- **Premium UI/UX**:
  - Responsive, phpMyAdmin-style aesthetic.
  - Condensed sidebar for efficient navigation.
  - Secure authentication (Env-based admin access).

## 🛠️ Tech Stack

- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **UI Components**: Radix UI
- **Database**: MongoDB (Official Node.js Driver)
- **Authentication**: JWT-based secure access

## ⚙️ Setup Instructions

### 1. Clone the repository
```bash
git clone https://github.com/atikurmsps/MongoDB-GUI-Admin-Panel.git
cd MongoDB-GUI-Admin-Panel
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env.local` file in the root directory and add the following:

```env
MONGODB_URI=mongodb://your_mongodb_connection_string
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret_key
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📦 Build for Production

```bash
npm run build
npm start
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/atikurmsps/MongoDB-GUI-Admin-Panel/issues).

## 📝 License

This project is licensed under the MIT License.
