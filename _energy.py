# Energy

# On-chain energy provisioning and payment system language model generation.

from seahorse.prelude import *

# This is your program's public key and it will update
# automatically when you build the project.
declare_id('EAk2FTUhjeRDx424mnrRJ9k3xCN5fPSMLt5smPYWWF4R')

# ------------------------------------------------------------------------------
# Define your accounts and data structures
# ------------------------------------------------------------------------------

class AllowedModel:
    model_name: str
    allowed: bool

    def __init__(
        self,
        model_name: str,
        allowed: bool
    ):
        self.model_name = model_name
        self.allowed = allowed

class ModelProviders:
    model_name: str # The name of the model
    providers: List[str] # List of encrypted keys to access this model
    
    def __init__(
        self,
        model_name: str, # The name of the model
        providers: List[str], # List of encrypted keys to access this model
    ):
        self.model_name = model_name
        self.providers = providers


class GSData:
    model_providers: List[ModelProviders]

class ProviderData:
    allowed_models: List[AllowedModel]   # List of allowed models for those keys
    openai_hashd_apikey: str

class EnergyProviderAccount(Account):
    owner: Pubkey          # The owner of this account
    data: ProviderData    # The hashed API keys
    vec_unit_gen: u64  # Stores amount of tokens generated

class GlobalState(Account):
    # Stores the global state of the program
    authority: Pubkey  # The authority (owner) of the global state
    program_id: Pubkey  # The program ID
    platform_fee: u64   # The platform fee
    data: GSData

# ------------------------------------------------------------------------------
# Initialize the program
# ------------------------------------------------------------------------------

@instruction
def init_global_state(
    authority: Signer,
    global_state_account: Empty[GlobalState],
    program_id: Pubkey,
    initial_fee: u64
):
    """
    Initializes the global state account to store the program ID and platform fee.
    """
    global_state = global_state_account.init(payer=authority, seeds=["global-state", authority.key()])
    global_state.authority = authority.key()
    global_state.program_id = program_id
    global_state.platform_fee = initial_fee

@instruction
def init_vault(
    vault_account: Empty[TokenAccount],
    mint: TokenMint,
    authority: Signer
):
    """
    Initializes the vault account to hold tokens.
    """
    vault_account.init(payer=authority, seeds=["vault", authority.key()], mint = mint, authority = authority)


@instruction
def init_key_provider(
    provider: Signer,
    energy_provider_account: Empty[EnergyProviderAccount],
    data: ProviderData,
    # allowed_models: list[str]
):
    """
    Initializes an account that represents a provider of compute resources.
    This account will hold:
        -   a list of accepted models
        -   a key to access compute resources
        -   a collateral vault to hold SOL tokens
    """
    # Create the EnergyProviderAccount
    e_account = energy_provider_account.init(payer=provider, seeds=["key-provider", provider.key()])
    e_account.owner = provider.key()
    # hashed_key = str(hash(data.openai_api_key.encode("utf-8")))  # Using Seahorse's hash function
    e_account.data = data
    #e_account.allowed_models = [AllowedModel(model_name=model, allowed=True) for model in allowed_models]
    e_account.vec_unit_gen = 0

@instruction
def init_energy_token_mint(
    authority: Signer,
    energy_token_mint: Empty[TokenMint]
):
    """
    Initializes the mint for the custom energy tokens.
    """
    energy_token_mint.init(payer=authority, seeds=["energy-token-mint", authority.key()], decimals = 6, authority=authority)

@instruction
def create_energy_account(
    user: Signer,
    energy_account: Empty[TokenAccount],
    energy_token_mint: TokenMint
):
    """
    Creates a user account that will track the user's energy token balance.
    """
    energy_account.init(payer=user, seeds=["energy-account", user.key(), energy_token_mint.key()], mint=energy_token_mint, authority=user)

@instruction
def deposit(
    signer: Signer,
    signer_account: TokenAccount,
    to: TokenAccount,
    amount: u64
):
    """
    Deposits tokens.
    """
    # assert signer.key() == signer_account.authority, "Unauthorized access."
    # assert signer_account.balance >= amount, "Insufficient funds."
    # Transfer SOL from the user to the vault
    signer_account.transfer(
        authority=signer,                    # From Signer
        to=to,     # To Pubkey
        amount=amount ,              # Number of lamports to transfer
        signer=[signer]
    )


@instruction
def withdraw(
    signer: Signer,
    wfrom: TokenAccount,
    to: TokenAccount,
    amount: u64
):
    """
    Withdraws tokens.
    """
    # assert signer.key == wfrom.authority, "Unauthorized access."
    # assert wfrom.balance >= amount, "Insufficient funds."

    wfrom.transfer(
        authority=signer,
        to=to,
        amount=amount,
        signer=[signer]
    )

@instruction
def provision_energy(
    user: Signer,
    user_energy_account: TokenAccount,
    provisoner: TokenAccount,
    key_provider_account: EnergyProviderAccount,
    requested_model: str,
    energy_provision: u64
):
    """
    Allows a user to provision enough energy tokens to cover the maximum cost of a request
    for a specific model under the given API key. 
    The cost in energy tokens is locked until the request finishes.
    """
    # Check if the requested_model is in the allowed models list
    model_allowed = False
    for model in key_provider_account.data.allowed_models:
        if model.model_name == requested_model and model.allowed:
            model_allowed = True
            break
    assert model_allowed, "Model not allowed for this provider."

    # Lock the needed energy tokens in this contract 
    # (In a real implementation, you'd track locked amount in a separate variable or account)
    # assert user_energy_account.balance >= energy_provision, f"Not enough energy"
    # user_energy_account.energy_balance -= needed_energy
    # withdraw(signer=user, wfrom=user_energy_account, to=provisoner, amount=energy_provision)
    user_energy_account.transfer(
        authority=user,
        to=provisoner,
        amount=energy_provision,
        signer=[user]
    )
    # Lock the needed energy tokens in the key provider's account
    key_provider_account.vec_unit_gen += energy_provision


@instruction
def consume_energy_and_pay_provider(
    signer: Signer,
    vault_account: TokenAccount,
    energy_provider_token_account: TokenAccount,
    energy_provider_data_account: EnergyProviderAccount,
    user_energy_account: TokenAccount,
    actual_cost_energy: u64,
    provisioned_energy: u64,
    global_state: GlobalState
):
    """
    Consumes the user's provisioned energy (based on actual usage)
    and transfers the corresponding SOL to the key provider.
    The leftover energy (if any) can be returned to the user, 
    and leftover SOL remains locked until the next usage or is refunded.
    """
   
    # Pay the key provider from the locked vault, up to actual_cost
    assert energy_provider_data_account.vec_unit_gen >= actual_cost_energy, "Not enough energy."
    ed = provisioned_energy - actual_cost_energy
    energy_provider_data_account.vec_unit_gen -= ed

    # In a real scenario, you'd do a token transfer from the contract to the key provider
    provider_fee = actual_cost_energy * (1 - global_state.platform_fee)
    e = actual_cost_energy - provider_fee
    # deposit(signer=signer, signer_account=vault_account, to=energy_provider_token_account, amount=u64(e))
    vault_account.transfer(
        authority=signer,                    # From Signer
        to=energy_provider_token_account,     # To Pubkey
        amount=e,              # Number of lamports to transfer
        signer=[signer]
    )

    # If there's any leftover locked energy from the user's provisioning, return it
    # For demonstration, assume the user always exactly consumes what they provisioned.
    # In practice, you'd handle partial refunds:
    # leftover_energy = locked_energy - actual_cost_energy
    # user_energy_account.energy_balance += leftover_energy
    user_fee = ed * global_state.platform_fee
    ed -= user_fee
    #deposit(signer=signer, signer_account=vault_account, to=user_energy_account, amount=ed)
    vault_account.transfer(
        authority=signer,                    # From Signer
        to=user_energy_account,     # To Pubkey
        amount=ed,              # Number of lamports to transfer
        signer=[signer]
    )
    # Mint LM generation tokens as a reward for generating language models
    # Example: mint_LM_generation_tokens(user, lm_generation_token_mint, amount)

@instruction
def set_platform_fee(
    authority: Signer,
    global_state_account: GlobalState,
    new_fee: u64
):
    """
    Sets a fee for using the platform, which could be a percentage of the transaction amount or a fixed fee per transaction.
    """
    #assert authority.key() == global_state_account.authority, "Unauthorized access."
    global_state_account.platform_fee = new_fee

@instruction
def set_allowed_models(
    authority: Signer,
    energy_provider_account: EnergyProviderAccount,
    allowed_models: List[AllowedModel]
):
    """
    Sets the list of allowed models for a key provider.
    """
    #assert authority.key() == key_provider_account.owner, "Unauthorized access."
    #allowed_models = []
    #for model in allowed_models:
    #    am = AllowedModel(model_name=model, allowed=True)
    #    allowed_models.append(am)
    energy_provider_account.data.allowed_models = allowed_models

@instruction
def remove_provider_key(
    authority: Signer,
    global_state: GlobalState,
#    model_name: str,
    rmkey: str
):
    """
    Removes a provider's key.
    """
    # assert authority.key() == global_state.authority, "Unauthorized access."
    # Remove the key from the list of keys
    model_providers = []
    for model in global_state.data.model_providers:
        providers = []
        for key in model.providers:
            if key != rmkey:
                providers.append(key)
        mp = ModelProviders(model_name = model.model_name, providers = providers)
        model_providers.append(mp)
    global_state.data.model_providers = model_providers
    
@instruction
def add_provider_key(
    authority: Signer,
    global_state: GlobalState,
    model_names: List[str],
    addkey: str
):
    """
    Adds a provider's key.
    """
    #assert authority.key() == global_state.authority, "Unauthorized access."
    # Adds the key to the list of keys for the given models
    model_providers = []
    for model_name in model_names:
        for model in global_state.data.model_providers:
            if model.model_name == model_name:
                providers = model.providers
                providers.append(addkey)
                mp = ModelProviders(model_name = model_name, providers = providers)
                model_providers.append(mp)
    global_state.data.model_providers = model_providers


@instruction
def mint_energy_supply(
    authority: Signer,
    authority_account: TokenAccount,
    energy_token_mint: TokenMint,
    amount: u64
):
    """
    Mints initial energy supply.
    """
    #assert authority.key() == energy_token_mint.authority, "Unauthorized access."
    energy_token_mint.mint(
        authority=authority,
        to=authority_account,
        amount=amount
    )


# @instruction
# def big_bang(
#     authority: Signer,
#     gs: Empty[GlobalState],
#     program_id: Pubkey,
#     fee: u64,
#     mint: Empty[TokenMint],
#     vault: Empty[TokenAccount],
#     energy_provider_account: Empty[EnergyProviderAccount],
#     provider_data: ProviderData,
    
# ):
#     """
#     Initializes everything.
#     """
    
#     # Initialize the global state
#     init_global_state(authority=authority, global_state_account=gs, program_id=program_id, initial_fee=fee)
#     # Initialize the energy token mint
#     init_energy_token_mint(authority=authority, energy_token_mint=mint)
#     # Initialize the energy token vault
#     init_vault(vault_account=vault, mint=mint, authority=authority)
#     # Initialize the key provider account
#     init_key_provider(provider=authority, energy_provider_account=energy_provider_account, data=provider_data)
#     # Initialize the user account
#     create_energy_account(user=Signer, energy_account=Empty[TokenAccount], energy_token_mint=TokenMint)
#     # Set the allowed models for the key provider
#     set_allowed_models(authority=Signer, key_provider_account=EnergyProviderAccount, allowed_models=["gpt-3", "gpt-4"])
#     # Add the key to the list of keys for the given models
#     add_provider_key(authority=Signer, global_state=GlobalState, model_names=["gpt-3", "gpt-4"], addkey="key")
#     # Deposit some energy tokens into the user account
#     deposit(signer=Signer, signer_account=TokenAccount, to=TokenAccount, amount=1000)
#     # Provision energy
#     provision_energy(user=Signer, user_energy_account=TokenAccount, provisoner=TokenAccount, key_provider_account=EnergyProviderAccount, requested_model="gpt-3", energy_provision=100)
#     # Consume energy and pay the provider
#     consume_energy_and_pay_provider(signer=Signer, vault_account=TokenAccount, key_provider_account=EnergyProviderAccount, user_energy_account=TokenAccount, actual_cost_energy=100, provisioned_energy=100, global_state=GlobalState)
#     # Remove the provider's key
#     remove_provider_key(authority=Signer, global_state=GlobalState, rmkey="key")
    