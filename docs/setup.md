# Maze Game Setup

## Prerequisites
- Node.js 14+ and npm
- Modern web browser with canvas support

## Installation

### Server Setup
```bash
cd server
npm install
npm run build
npm start
```

The server will start on port 3001 by default.

### Client Setup
```bash
cd client
npm install
npm start
```

The client will start on port 3000 and automatically open in your default browser.

## Development
- Run server in dev mode: `npm run dev`
- Run tests: `npm test`
- Build for production: `npm run build`

## Environment Variables
- `PORT`: Server port (default: 3001)
- `CLIENT_URL`: Client URL for CORS (default: http://localhost:3000)
