import { program, votesStorageKey } from "./_common";
async function work() {
  let storageStruct = await program.account.votesStorageAccount.fetch(
    votesStorageKey
  );
  console.log("The storage struct is", storageStruct);
}

work();
