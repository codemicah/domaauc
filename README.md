# Tokenized Domain Dutch Auction

A production-ready web application for conducting Dutch auctions on tokenized domains with secure wallet authentication, real-time bidding, and comprehensive offer management.

## Features

- **Dutch Auction Mechanism**: Linear price decay from start price to reserve price over time
- **Secure Authentication**: SIWE (Sign-In With Ethereum) with session management
- **Multi-chain Support**: Base Sepolia and Sepolia testnets
- **Real-time Leaderboards**: Live offer tracking and ranking
- **Responsive UI**: Dark theme with glassmorphism design
- **Comprehensive Testing**: Unit tests and E2E test coverage
- **Type Safety**: Strict TypeScript with exact optional properties

## Tech Stack

- **Frontend**: Next.js 15, React 18, TailwindCSS
- **Authentication**: SIWE, wagmi, viem, Web3Modal
- **Database**: MongoDB with typed repositories
- **Blockchain**: Doma Protocol SDK integration
- **Testing**: Vitest (unit), Playwright (E2E)
- **Validation**: Zod schemas
- **Development**: TypeScript (strict), ESLint, Prettier

## Prerequisites

- Node.js 18+ 
- MongoDB instance
- WalletConnect Project ID
- Doma Protocol API access

## Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Configure your environment variables:

```env
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPPORTED_CHAINS=eip155:11155111,eip155:84532

# WalletConnect/Web3Modal
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here

# SIWE Configuration  
NEXT_PUBLIC_SIWE_DOMAIN=localhost:3000
SESSION_SECRET=your_session_secret_here

# Doma Protocol
NEXT_PUBLIC_DOMA_API_URL=https://api.doma.dev
DOMA_API_KEY=your_doma_api_key_here

# Database
MONGODB_URI=mongodb://localhost:27017/domain-auction
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start MongoDB (if running locally):
```bash
mongod
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Run all tests
```bash
npm run test:all
```

## API Endpoints

### Authentication
- `POST /api/auth/siwe` - SIWE sign-in
- `DELETE /api/auth/siwe` - Sign out
- `GET /api/auth/me` - Get current session

### Domains
- `GET /api/subgraph/domains` - Fetch user's tokenized domains

### Listings
- `POST /api/listings` - Create new listing
- `GET /api/listings` - Get listings with pagination
- `GET /api/listings/[id]/leaderboard` - Get offers for listing

### Offers
- `POST /api/offers` - Place offer on listing
- `GET /api/offers` - Get user's offers

### Management
- `POST /api/listings/[id]/accept` - Accept offer (seller only)
- `POST /api/reconcile` - Mark expired listings/offers
- `GET /api/reconcile` - Preview what would be reconciled

## Project Structure

```
├── app/                    # Next.js app router
│   ├── api/               # API routes
│   ├── dashboard/         # Protected dashboard pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── listing/          # Listing-related components
│   ├── ui/               # UI components
│   └── wallet/           # Wallet connection components
├── lib/                   # Utility libraries
│   ├── auth/             # Authentication logic
│   ├── db/               # Database connections
│   ├── doma/             # Doma SDK integration
│   ├── price/            # Dutch price calculations
│   ├── utils/            # Utility functions
│   └── validation/       # Zod schemas
└── tests/                # Test files
    ├── e2e/              # Playwright E2E tests
    └── unit/             # Vitest unit tests
```

## Key Components

### Dutch Price Calculation
The `currentDutchPrice` function implements linear price decay:
```typescript
const currentPrice = startPrice - ((startPrice - reservePrice) * progress)
```

### Authentication Flow
1. User connects wallet via Web3Modal
2. App requests SIWE message signature
3. Server verifies signature and creates session
4. JWT stored in HTTP-only cookie

### Listing Creation
1. User selects tokenized domain from their wallet
2. Sets auction parameters (start/reserve price, duration)
3. Optional: Creates listing on Doma orderbook
4. Stores metadata in MongoDB

### Offer Placement
1. User enters username and offer amount
2. Validates offer meets minimum requirements
3. Creates offer via Doma SDK
4. Stores offer metadata locally

## Security Features

- **Strict TypeScript**: No implicit any, exact optional properties
- **Input Validation**: Zod schemas for all API inputs
- **Authentication**: SIWE with session management
- **Permission Checks**: Users can only access their own data
- **Secure Cookies**: HTTP-only, SameSite=Strict
- **Rate Limiting**: Built-in Next.js protections

## Development Guidelines

### Code Style
- Use strict TypeScript settings
- Follow ESLint rules (no `any` types)
- Format with Prettier
- Prefer explicit typing over inference

### Testing
- Write unit tests for utility functions
- Add E2E tests for user flows
- Mock external dependencies in tests
- Maintain >80% code coverage

### Database
- Use typed MongoDB operations
- Store bigints as strings for precision
- Include created/updated timestamps
- Implement proper indexing

## Production Deployment

1. Set up production MongoDB instance
2. Configure environment variables
3. Build the application:
```bash
npm run build
```

4. Start production server:
```bash
npm start
```

## Monitoring & Maintenance

### Reconciliation
Run the reconciliation endpoint periodically to mark expired auctions:
```bash
curl -X POST http://localhost:3000/api/reconcile
```

### Health Checks
- Monitor MongoDB connection
- Check API response times
- Verify SIWE authentication flow
- Test wallet connection functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
