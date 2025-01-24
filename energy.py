from seahorse.prelude import *

# ------------------------------------------------------------------------------
# Define your accounts and data structures
# ------------------------------------------------------------------------------

class EnergyProviderAccount(TokenAccount):
    # Stores information about the OpenAI key provider
    owner: Pubkey          # The owner of this account
    openai_api_key: str    # The published OpenAI API key
    allowed_models: list[str]  # List of allowed models for this key
    collateral_vault: u64  # Stores SOL tokens received when tokens are burned

class EnergyTokenMint(TokenMint):
    # Mint authority and metadata for energy tokens
    authority: Pubkey
    # Additional attributes for the mint can be added here

class EnergyTokenAccount(TokenAccount):
    # Stores how many energy tokens a user holds
    owner: Pubkey
    energy_balance: u64

# ------------------------------------------------------------------------------
# Initialize the program
# ------------------------------------------------------------------------------

@instruction
def init_key_provider(
    provider: Signer,
    key_provider_account: Empty[KeyProviderAccount],
    openai_api_key: str,
    allowed_models: list[str]
):
    """
    Initializes an account that represents a provider of an OpenAI API key.
    This account will hold a list of allowed models and an API key string.
    """
    # Create the KeyProviderAccount
    kp_account = key_provider_account.init(payer=provider, seeds=["key-provider", provider.key()])
    kp_account.owner = provider.key()
    kp_account.openai_api_key = openai_api_key
    kp_account.allowed_models = allowed_models
    kp_account.collateral_vault = 0

@instruction
def init_energy_token_mint(
    authority: Signer,
    energy_token_mint: Empty[EnergyTokenMint]
):
    """
    Initializes the mint for the custom energy tokens.
    """
    mint_account = energy_token_mint.init(payer=authority, seeds=["energy-token-mint", authority.key()])
    mint_account.authority = authority.key()
    # Further mint initialization logic can go here

@instruction
def create_user_energy_account(
    user: Signer,
    user_energy_account: Empty[EnergyTokenAccount],
    energy_token_mint: EnergyTokenMint
):
    """
    Creates a user account that will track the user's energy token balance.
    """
    uea = user_energy_account.init(payer=user, seeds=["user-energy-account", user.key(), energy_token_mint.key()])
    uea.owner = user.key()
    uea.energy_balance = 0

@instruction
def convert_sol_to_energy(
    user: Signer,
    user_energy_account: EnergyTokenAccount,
    energy_token_mint: EnergyTokenMint,
    amount_sol: u64
):
    """
    Converts SOL tokens to energy tokens by transferring SOL to the program's vault
    and increasing the user's energy tokens accordingly.
    """
    # Pseudocode: Transfer SOL to the vault (handle using associated token accounts or system program)
    # SystemProgram.transfer(user, PROGRAM_VAULT_PUBKEY, amount_sol)
    
    # For demonstration, we just update the user's energy_balance.
    # Suppose 1 SOL = 1000 energy tokens (example rate).
    # exchange_rate = 1000
    # user_energy_account.energy_balance += amount_sol * exchange_rate

@instruction
def provision_energy(
    user: Signer,
    user_energy_account: EnergyTokenAccount,
    key_provider_account: EnergyProviderAccount,
    requested_model: str,
    max_cost_sol: u64
):
    """
    Allows a user to provision enough energy tokens to cover the maximum cost of a request
    for a specific model under the given OpenAI API key. 
    The cost in energy tokens is locked until the request finishes.
    """
    # Check if the requested_model is in the allowed models list
    assert requested_model in key_provider_account.allowed_models, "Model not allowed for this key."

    # Convert max_cost_sol to energy needed (assuming same rate for simplicity)
    exchange_rate = 1000
    needed_energy = max_cost_sol * exchange_rate

    # Lock the needed energy tokens in this contract 
    # (In a real implementation, you'd track locked amount in a separate variable or account)
    assert user_energy_account.energy_balance >= needed_energy, "Insufficient energy tokens."
    user_energy_account.energy_balance -= needed_energy

    # For demonstration, store the SOL equivalent in the key provider's collateral vault
    key_provider_account.collateral_vault += max_cost_sol

@instruction
def consume_energy_and_pay_provider(
    user: Signer,
    key_provider_account: EnergyProviderAccount,
    user_energy_account: EnergyTokenAccount,
    actual_cost_sol: u64
):
    """
    Consumes the user's provisioned energy (based on actual usage)
    and transfers the corresponding SOL to the key provider.
    The leftover energy (if any) can be returned to the user, 
    and leftover SOL remains locked until the next usage or is refunded.
    """
    exchange_rate = 1000
    actual_cost_energy = actual_cost_sol * exchange_rate

    # Pay the key provider from the locked vault, up to actual_cost_sol
    assert key_provider_account.collateral_vault >= actual_cost_sol, "Not enough SOL in vault."
    key_provider_account.collateral_vault -= actual_cost_sol

    # In a real scenario, you'd do a token transfer from the contract to the key provider
    # SystemProgram.transfer(PROGRAM_VAULT_PUBKEY, key_provider_account.owner, actual_cost_sol)

    # If there's any leftover locked energy from the user's provisioning, return it
    # For demonstration, assume the user always exactly consumes what they provisioned.
    # In practice, you'd handle partial refunds:
    # leftover_energy = locked_energy - actual_cost_energy
    # user_energy_account.energy_balance += leftover_energy

    # (Optional) Additional logic for minted "LM generation tokens" goes here.

@instruction
def process_request(
    user: Signer,
    user_token_account: EnergyTokenAccount,
    key_provider_account: EnergyProviderAccount,
    cost: u64
):
    # Vérifier que l'utilisateur a assez de jetons
    assert user_token_account.energy_balance >= cost, "Solde insuffisant"
    # Réduire le solde
    user_token_account.energy_balance -= cost
    # Répartition 70% / 30%
    provider_share = (cost * 70) // 100
    contract_creator_share = cost - provider_share
    key_provider_account.collateral_vault += provider_share
    # (Ici, stocker la part du créateur dans un autre compte, à implémenter)
    # Utiliser la clé du key_provider_account pour répondre à la requête
    # ...

@instruction
def buy_energy_tokens(
    user: Signer,
    user_token_account: EnergyTokenAccount,
    lamports: u64
):
    # Logique pour convertir lamports en energy tokens
    acquired_tokens = lamports  # Simplifié
    user_token_account.energy_balance += acquired_tokens
    # ...

@instruction
def sell_energy_tokens(
    user: Signer,
    user_token_account: EnergyTokenAccount,
    amount: u64
):
    assert user_token_account.energy_balance >= amount, "Solde insuffisant"
    user_token_account.energy_balance -= amount
    # Convertir en lamports et envoyer à l'utilisateur
    # ...

@instruction
def revoke_key_provider(
    provider: Signer,
    key_provider_account: EnergyProviderAccount
):
    # Révoquer la clé en la remplaçant par une valeur vide
    assert provider.key() == key_provider_account.owner, "Non propriétaire"
    key_provider_account.openai_api_key = ""
    key_provider_account.allowed_models = []
    # ...