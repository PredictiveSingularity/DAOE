describe("Singularis", () => {
  // const provider = anchor.AnchorProvider.env();
  // anchor.setProvider(provider);
  // console.log(`Provider: ${provider}`);

  // const [energyMetabolizer] = web3.PublicKey.findProgramAddressSync(
  //   [Buffer.from("energy-metabolizer"), pg.wallet.publicKey.toBuffer()],
  //   pg.PROGRAM_ID
  // );

  // const program = anchor.workspace.Singularis as Program<Singularis>;

  // let vaultAccount: web3.Keypair;
  // let mintAccount: web3.Keypair;

  // const programId = pg.program.programId;
  const TOKEN_PROGRAM_ID = new web3.PublicKey(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
  );
  console.log(`Program ID: ${pg.PROGRAM_ID}`);
  console.log(`Wallet PubKey: ${pg.wallet.publicKey}`);

  // const INITIAL_FEE = new anchor.BN(5); // 5% fee
  // const PROGRAM_ID = programId.toBuffer();
  // const OPENAI_API_KEY = "test-api-key";
  // const ALLOWED_MODELS = ["model1", "model2"];
  // const AMOUNT_SOL = new anchor.BN(1000); // 1000 lamports (0.001 SOL)

  // it("Initializes the mint", async () => {
  //   // vaultAccount = web3.Keypair.generate();
  //   mintAccount = web3.Keypair.generate();
  //   console.log(`MintAccount: ${mintAccount.publicKey}`);

  //   const txHash = await pg.program.methods
  //     .initializeTokenMint(6)
  //     .accounts({
  //       // signer: pg.wallet.publicKey,
  //       mint: mintAccount.publicKey,
  //       // systemProgram: web3.SystemProgram.programId,
  //     })
  //     .signers([pg.wallet.publicKey])
  //     .rpc();
  //   console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);

  //   await pg.connection.confirmTransaction(txHash);
  //   // TODO: Fetch account et ajouter vos vérifications
  // });

  it("Emergency", async () => {
    const signer = pg.wallet;
    console.log(`Signer: ${signer.publicKey}`);

    const [mint] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("0"), signer.publicKey.toBuffer()],
      pg.program.programId
      // TOKEN_PROGRAM_ID
    );
    const [singularity] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("0"), mint.toBuffer()],
      pg.program.programId
    );
    const [singularityAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("0"), mint.toBuffer(), signer.publicKey.toBuffer()],
      pg.program.programId
    );
    const [signerAccount] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("1"), mint.toBuffer(), signer.publicKey.toBuffer()],
      pg.program.programId
    );
    const [signerMetabolizer] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("energy-metabolizer"), signer.publicKey.toBuffer()],
      pg.program.programId
    );
    const [signerTransformer] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("energy-transformer"), signer.publicKey.toBuffer()],
      pg.program.programId
    );

    const supply = new anchor.BN(1000000000000);
    const decimals = 6; //new anchor.BN(6);
    const fee = 20; // new anchor.BN(30);
    // const pickle = "789c6b60a99da20700056201c4"; // {}

    console.log(`Supply: ${supply}`);
    console.log(`Decimals: ${decimals}`);
    console.log(`Fee: ${fee}`);
    // console.log(`Pickle: ${pickle}`);
    console.log(`Mint: ${mint}`);
    console.log(`Singularity: ${singularity}`);
    console.log(`SingularityAccount: ${singularityAccount}`);
    console.log(`SignerAccount: ${signerAccount}`);
    console.log(`SignerMetabolizer: ${signerMetabolizer}`);
    console.log(`SignerTransformer: ${signerTransformer}`);
    return true;
    const txHash = await pg.program.methods
      .emerge(supply, decimals, fee)
      .accounts({
        signer: signer.publicKey,
        mint: mint,
        singularity: singularity,
        singularityAccount: singularityAccount,
        signerAccount: signerAccount,
        signerMetabolizer: signerMetabolizer,
        signerTransformer: signerTransformer,
        clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([signer]) // we cannot use pg.wallet here as we need a private key. Setup a dumpy keypair (and airdrop some sol) for testing pupropses.
      .rpc();
    console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);

    await pg.connection.confirmTransaction(txHash);

    const mint = await pg.program.account.tokenMint(mint);
    assert.ok(mint.owner.equals(pg.wallet.publicKey));
    assert.ok(mint.supply.eq(new anchor.BN(0)));
  });

  it("Welcome", async () => {
    const new_user = web3.Keypair.generate();
    console.log(`NewUser: ${new_user.publicKey}`);
    const [mint] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("0"), pg.wallet.publicKey.toBuffer()],
      pg.program.programId
    );
    const [user_account] = web3.PublicKey.findProgramAddressSync(
      [Buffer.from("1"), mint.toBuffer(), new_user.publicKey.toBuffer()],
      pg.program.programId
    );

    const txHash = await pg.program.methods
      .welcome()
      .accounts({
        signer: new_user.publicKey,
        mint: mint,
        account: user_account,
        // clock: anchor.web3.SYSVAR_CLOCK_PUBKEY,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([new_user])
      .rpc();

    console.log(`Use 'solana confirm -v ${txHash}' to see the logs`);

    await pg.connection.confirmTransaction(txHash);
    // const account = await pg.program.account.tokenAccount(user_account);
    // assert.ok(account.owner.equals(new_user.publicKey));
    // assert.ok(account.amount.eq(new anchor.BN(0)));
  });
});
