# AI President

Welcome to the AI President, an innovative application that leverages Web3 technologies for token burning via smart contracts. This platform serves as a dynamic exploration of decentralized governance, allowing users to directly influence operations through blockchain interactions. It features a unique voting smart contract that burns SPL tokens as votes are cast for each option, emphasizing tokenomics and participant stakes in decision outcomes.

### Prerequisites
- Node.js (version 14 or newer)
- Yarn or npm
- A local or testnet Ethereum blockchain instance (e.g., Ganache)

### Running the Application

1. **Start the local development server:**
   ```bash
   # Using Yarn
   yarn start

   # Using npm
   npm start
   ```
   This command will launch the React application at [http://localhost:3000](http://localhost:3000).

2. **Interacting with the Blockchain:**
   Ensure your local or testnet blockchain instance is operational and that the smart contracts have been deployed. The smart contracts will interact using the address and connection parameters specified in your `.env` file. Engage with the voting contract that not only registers votes but also burns SPL tokens to reflect the weight and permanence of each decision made.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---
