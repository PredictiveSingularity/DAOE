# Energy

# On-chain energy provisioning and payment system language model generation.

from seahorse.prelude import *

# This is your program's public key and it will update
# automatically when you build the project.
declare_id('EAk2FTUhjeRDx424mnrRJ9k3xCN5fPSMLt5smPYWWF4R')

# ------------------------------------------------------------------------------
# Define your accounts and data structures
# ------------------------------------------------------------------------------

# class AllowedModel:
#     model_name: str
#     allowed: bool

# class TransformerData:
#     allowed_models: List[AllowedModel]   # List of allowed models for those keys
#     openai_hashd_apikey: str

class Singularity(Account):
  energy_supply: u64
  mint: Pubkey
  owner: Pubkey
#   max_withdraw: u64
  decimals: u8
  fee: u8
  bump_query: u64
  bump_token: u64
  pickle: str

class Transformer(Account):
  owner: Pubkey
  vec_unit_gen: u64
  # data: TransformerData
  pickle: str
  

class Metabolizer(Account):
  owner: Pubkey
  last_exchange: i64
  reserve: u64

# ------------------------------------------------------------------------------
# Initialize the program
# ------------------------------------------------------------------------------

# Initialize the Token Mint
@instruction
def initialize_token_mint(
  signer: Signer, 
  mint: Empty[TokenMint], 
  decimals: u8
  ):
  mint = mint.init(
    payer = signer,
    seeds = ['initial-energy-conversion', signer],
    decimals = decimals,
    authority = signer
  )

# Initializing Singularity
@instruction
def big_bang(
  signer: Signer,
  signer_account: Empty[TokenAccount], 
  # mint: Empty[TokenMint],
  mint: TokenMint,
  singularity: Empty[Singularity],
  singularity_account: Empty[TokenAccount],
  signer_metabolizer: Empty[Metabolizer],
  energy_supply: u64,
  decimals: u8,
  fee: u8,
  clock: Clock,
#   max_withdraw: u64
  pickle: str,
  ):
  """
  Initializes the Singularity and the Costumer account.
  """
  timestamp: i64 = clock.unix_timestamp()
  # bump = singularity.bump()
  
#   singularity.bump = bump
  # mint = mint.init(
  #   payer = signer,
  #   seeds = ['energy-conversion', signer],
  #   decimals = decimals,
  #   authority = signer
  # )
  singularity = singularity.init(
    payer = signer,
    seeds = ['energy-bang', mint]
  )
  singularity_account = singularity_account.init(
    payer = signer,
    seeds = ["energy", mint, signer],
    mint = mint,
    authority = singularity,
  )
  mint.mint(
    authority = signer,
    to = singularity_account,
    amount = energy_supply * decimals
  )
  singularity.energy_supply = energy_supply
  singularity.mint = mint.key()
  singularity.decimals = decimals
#   singularity.max_withdraw = max_withdraw
  singularity.owner = signer.key()
  singularity.bump_query = 0
  singularity.bump_token = 0
  singularity.fee = fee
  singularity.pickle = pickle
  signer_metabolizer = signer_metabolizer.init(
    payer = signer,
    seeds = ['energy-metabolizer', signer]
  )
  signer_metabolizer.owner = signer.key()
  signer_metabolizer.reserve = 0
  reward: u64 = energy_supply * decimals // 5 #* 0.2
  signer_account = signer_account.init(
    payer = signer,
    seeds = ["energy", mint, signer],
    mint = mint,
    authority = signer,
  )
  singularity_account.transfer(
    authority = singularity,
    to = signer_account,
    amount = reward,
    signer = ['energy-conversion', mint, signer, timestamp]
  )
  signer_metabolizer.last_exchange = timestamp
  
# Initialize the Transformer
@instruction
def initialize_transformer(
  signer: Signer, 
  transformer: Empty[Transformer],
  pickle: str,
  ):
  transformer = transformer.init(
    payer = signer,
    seeds = ['energy-transformer', signer]
  )
  transformer.owner = signer.key()
  transformer.pickle = pickle
  transformer.vec_unit_gen = 0

# Update the Transformer
@instruction
def update_transformer(
    transformer: Transformer,
    pickle: str,
    signer: Signer
  ):
  assert transformer.owner == signer.key(), 'You are not the owner of the Transformer account.'
  transformer.pickle = pickle

# Initializing the Costumer
@instruction
def initialize_metabolizer(
  signer: Signer, 
  metabolizer: Empty[Metabolizer]
  ):
  metabolizer = metabolizer.init(
    payer = signer,
    seeds = ['energy-metabolizer', signer]
  )
  metabolizer.owner = signer.key()
  metabolizer.last_exchange = 0
  metabolizer.reserve = 0

# Depositing energy provision to Singularity
@instruction
def deposit_provision(
  metabolizer: Metabolizer,
  # transformer: Transformer,
  metabolizer_account: TokenAccount, 
  singularity_account: TokenAccount,
  metabolizer_signer: Signer,
  n: u64
  ):
    
  # Metabolizer sends the energy provision to the Singularity account
  metabolizer_account.transfer(
    authority = metabolizer_signer,
    to = singularity_account,
    amount = u64(n)
  )
  metabolizer.reserve += n


# Consume provision from Singularity
@instruction
def consume_provision(
  mint: TokenMint,
  transformer_account: TokenAccount,
  metabolizer_account: TokenAccount,
  singularity_account: TokenAccount, 
  singularity: Singularity,
  n: u64,
  transformer: Transformer,
  metabolizer: Metabolizer,
  clock: Clock
  ):
  assert mint.key() == singularity.mint, 'The Token mint you are trying to consume does not match the singularity\'s mint'
  assert transformer_account.mint() == mint.key(), 'The Token account you are trying to consume does not match the transformer\'s mint'
  assert metabolizer_account.mint() == mint.key(), 'The Token account you are trying to consume does not match the metabolizer\'s mint'
  assert singularity_account.mint() == mint.key(), 'The Token account you are trying to consume does not match the singularity\'s mint'
  
  assert transformer.owner == transformer_account.owner(), 'The Transformer account you are trying to consume from does not match the transformer\'s owner'
  assert metabolizer.owner == metabolizer_account.owner(), 'The Metabolizer account you are trying to consume from does not match the metabolizer\'s owner'
  
  assert n > 0, 'You must consume at least 1 unit of energy provision.'
  assert metabolizer.reserve >= n, 'The Metabolizer account does not have enough energy provision to consume.'
  assert singularity.energy_supply >= n, 'The Singularity account does not have enough energy supply to consume.'
  assert singularity_account.amount() >= n, 'The Singularity account does not have enough energy supply to consume.'
  
  timestamp:  i64 = clock.unix_timestamp()
  assert timestamp - 3 > metabolizer.last_exchange, 'Your transaction has been rate limited, please try again in 3 seconds.'

  transformer.vec_unit_gen += n
  metabolizer.reserve -= n
  
  singularity.bump_query += 1
  singularity.bump_token += n
  
  amount = (n * (100 - singularity.fee) // 100)
  
  # Send part of the provision for the generated tokens
  singularity_account.transfer(
    authority = singularity,
    to = transformer_account,
    amount = amount,
    signer = ['energy-conversion', mint, transformer_account, timestamp]
  )
  rem = metabolizer.reserve * singularity.decimals
  # Send the rest of the provision to the Metabolizer account
  singularity_account.transfer(
      authority = singularity,
      to = metabolizer_account,
      amount = rem,
      signer = ['energy-conversion', mint, metabolizer_account, timestamp]
  )
  metabolizer.reserve = 0
  metabolizer.last_exchange = timestamp