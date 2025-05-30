# Stacks Guestbook

A decentralized message board/guestbook built with Vue.js and Stacks blockchain. This application allows users to connect their Stacks wallet, post messages to the blockchain, and like messages from other users.

## Project Overview

Stacks Guestbook is a simple yet powerful demonstration of blockchain technology in a familiar web application context. By leveraging the Stacks blockchain and Clarity smart contracts, we've created a censorship-resistant, permanent message board where all interactions are recorded on the blockchain.

### Key Features

- **Wallet Authentication**: Connect your Stacks wallet to interact with the application
- **Post Messages**: Share your thoughts on the blockchain
- **Like Messages**: Show appreciation for messages from other users
- **Blockchain Persistence**: All messages and interactions are stored permanently on the Stacks blockchain

## Technologies Used

- **Frontend**: Vue.js 3, Vue Router, Vuex
- **Blockchain**: Stacks Blockchain
- **Smart Contracts**: Clarity
- **Authentication**: Stacks Connect
- **Development**: Webpack, Babel

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- A Stacks wallet (like Hiro Wallet browser extension)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd stacks-guestbook
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run serve
   ```

4. Open your browser and navigate to `http://localhost:8080`

## Project Structure

```
stacks-guestbook/
├── contracts/            # Clarity smart contracts
│   └── guestbook.clar    # Main guestbook contract
├── public/               # Static assets
├── src/                  # Vue application source
│   ├── assets/           # Images, fonts, etc.
│   ├── components/       # Reusable Vue components
│   ├── store/            # Vuex store modules
│   ├── views/            # Vue page components
│   ├── App.vue           # Root component
│   ├── main.js           # Application entry point
│   └── router/           # Vue Router configuration
├── .gitignore            # Git ignore file
├── package.json          # Project dependencies and scripts
├── README.md             # Project documentation
└── vue.config.js         # Vue CLI configuration
```

## How to Use

1. **Connect Your Wallet**: Click the "Connect Wallet" button in the header to authenticate with your Stacks wallet.
2. **View Messages**: Browse messages left by other users on the home page.
3. **Post a Message**: Once connected, use the message form to post your own message to the blockchain.
4. **Like Messages**: Show appreciation for messages by clicking the heart icon.

## Future Improvements

- **Message Replies**: Allow users to reply to existing messages
- **User Profiles**: Display more information about message authors
- **Message Categories**: Organize messages by topics or categories
- **Rich Media Support**: Allow embedding images or other media in messages
- **Mobile Optimization**: Improve the mobile user experience

## License

MIT

## Acknowledgements

- Stacks Foundation for providing the blockchain infrastructure
- The Vue.js team for the excellent frontend framework
- All contributors and users of this application