describe("Singularis", () => {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
  
    const program = anchor.workspace.Singularis as Program<Singularis>;
  
    let vaultAccount: web3.Keypair;
    let mintAccount: web3.Keypair;
    let globalStateAccount: web3.Keypair;
    let keyProviderAccount: web3.Keypair;
    let energyTokenMint: web3.Keypair;
    let userEnergyAccount: web3.Keypair;
    let lmGenerationTokenMint: web3.Keypair;
    const programId = pg.program.programId;
  
    const INITIAL_FEE = new anchor.BN(5); // 5% fee
    const PROGRAM_ID = programId.toBuffer();
    const OPENAI_API_KEY = "test-api-key";
    const ALLOWED_MODELS = ["model1", "model2"];
    const AMOUNT_SOL = new anchor.BN(1000); // 1000 lamports (0.001 SOL)
  
    it("Initializes the mint", async () => {
      vaultAccount = web3.Keypair.generate();
      mintAccount = web3.Keypair.generate();
  
      await pg.program.methods.initializeTokenMint({
        signer: provider.wallet.publicKey,
        mint: mintAccount.publicKey,
        decimals: 6,
      });
    });
  
    it("Big Bang", async () => {    
        await pg.program.methods.bigBang({
            signer: provider.wallet.publicKey,
            signer_account: provider.wallet.publicKey,
            mint: mintAccount.publicKey,
            singularity: 
            energySupply: new anchor.BN(1000000),
            decimals: 6,
            fee: INITIAL_FEE,
        });
    
        // const globalState = await pg.program.account.globalStateAccount(
        //     globalStateAccount.publicKey
        // );
        // assert.ok(globalState.owner.equals(provider.wallet.publicKey));
        // assert.ok(globalState.vault.equals(vaultAccount.publicKey));
        // assert.ok(globalState.mint.equals(mintAccount.publicKey));
        // assert.ok(globalState.fee.eq(INITIAL_FEE));
    });
    
    it("Initializes key provider accounts", async () => {
      keyProviderAccount = web3.Keypair.generate();
  
      await pg.program.rpc.initKeyProvider(OPENAI_API_KEY, ALLOWED_MODELS, {
        accounts: {
          provider: provider.wallet.publicKey,
          keyProviderAccount: keyProviderAccount.publicKey,
          systemProgram: web3.SystemProgram.programId,
        },
        signers: [keyProviderAccount],
      });
  
      const keyProvider = await program.account.keyProviderAccount(
        keyProviderAccount.publicKey
      );
      assert.ok(keyProvider.owner.equals(provider.wallet.publicKey));
      assert.ok(keyProvider.collateralVault.eq(new anchor.BN(0)));
    });
  
    it("Provisions energy for model requests", async () => {
      const maxCostSol = new anchor.BN(500); // 500 lamports (0.0005 SOL)
      const requestedModel = ALLOWED_MODELS[0];
  
      await pg.program.rpc.provisionEnergy(requestedModel, maxCostSol, {
        accounts: {
          user: provider.wallet.publicKey,
          userEnergyAccount: userEnergyAccount.publicKey,
          keyProviderAccount: keyProviderAccount.publicKey,
        },
      });
  
      const userEnergy = await pg.program.account.userEnergyAccount(
        userEnergyAccount.publicKey
      );
      const keyProvider = await pg.program.account.keyProviderAccount(
        keyProviderAccount.publicKey
      );
  
      const neededEnergy = maxCostSol.toNumber() * 1000;
      assert.ok(
        userEnergy.energyBalance.eq(
          new anchor.BN(expectedEnergyBalance - neededEnergy)
        )
      );
      assert.ok(keyProvider.collateralVault.eq(maxCostSol));
    });
  
    it("Consumes energy and pays the provider", async () => {
      lmGenerationTokenMint = web3.Keypair.generate();
      const actualCostSol = new anchor.BN(300); // 300 lamports (0.0003 SOL)
  
      await program.rpc.consumeEnergyAndPayProvider(actualCostSol, {
        accounts: {
          user: provider.wallet.publicKey,
          keyProviderAccount: keyProviderAccount.publicKey,
          userEnergyAccount: userEnergyAccount.publicKey,
          lmGenerationTokenMint: lmGenerationTokenMint.publicKey,
        },
      });
  
      const keyProvider = await pg.program.account.keyProviderAccount(
        keyProviderAccount.publicKey
      );
      assert.ok(keyProvider.collateralVault.eq(new anchor.BN(200))); // 500 - 300
      // Additional assertions for LM generation tokens can be added here
    });
  });
  