import { program, votesStorageKey, TOKEN_ADDRESS } from "./_common";

async function initialize() {
  const tx = await program.methods
    .initialize(TOKEN_ADDRESS)
    .accounts({
      votesStorageAccount: votesStorageKey,
    })
    .rpc();
  console.log("Your transaction signature", tx);
}

console.log("Initializing the program...");
initialize();
