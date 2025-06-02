# Study Swamp UI

## Project Setup & Initialization

This project uses Webpack for bundling and supports both development and production builds.

### Prerequisites

Make sure you have the following installed on your system:

- [Node.js](https://nodejs.org/en) (version 14 or higher recommended)  
- npm (comes with Node.js) or yarn  

### Initial Setup

1. Fork and clone the repository:

```bash
git clone <your-forked-repo-url>
cd study-swamp-ui
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

### Running in Development Mode
To start a development server with hot reloading and debugging enabled:

```bash
npm run start
# or
yarn start
```

The app will be available at [http://localhost:9000](http://localhost:9000).
If your browser doesn’t open automatically, simply open your preferred browser and enter this URL in the address bar.

### Building for Production
To create an optimized production build:

```bash
npm run build
# or
yarn build
```

The output files will be generated in the dist directory (or your configured output path).