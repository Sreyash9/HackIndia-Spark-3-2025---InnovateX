# Mindlancer - Freelancer Marketplace Platform

A dynamic freelancer marketplace that connects businesses with top talent, enhanced with AI-powered career development tools.

## Features

- Multi-role authentication system (Freelancers & Businesses)
- AI-powered job matching algorithm
- Real-time job request and hiring workflow
- Secure payment processing with Razorpay
- Responsive design with interactive features
- Portfolio management for freelancers

## Prerequisites

- Node.js (v18 or later)
- PostgreSQL (v14 or later)
- npm or yarn package manager

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd mindlancer
```

2. Install dependencies:
```bash
npm install
```

3. Set up your environment variables:
```bash
# Copy the example env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

4. Set up PostgreSQL:
- Create a new PostgreSQL database
- Update the DATABASE_URL in your .env file with your database credentials
- The format should be: `postgresql://user:password@localhost:5432/database`

5. Push the database schema:
```bash
npm run db:push
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection URL | Yes |
| OPENAI_API_KEY | OpenAI API key for AI matching | Yes |
| RAZORPAY_KEY_ID | Razorpay public key | Yes |
| RAZORPAY_KEY_SECRET | Razorpay secret key | Yes |
| SESSION_SECRET | Secret for session encryption | Yes |
| NODE_ENV | Environment (development/production) | No |

## Project Structure

```
├── client/             # Frontend React application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── hooks/     # Custom React hooks
│   │   ├── lib/       # Utility functions
│   │   └── pages/     # Page components
├── server/            # Backend Express server
│   ├── routes.ts     # API routes
│   ├── storage.ts    # Database interface
│   └── services/     # Business logic
├── shared/           # Shared types and schemas
└── drizzle.config.ts # Database configuration
```

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.