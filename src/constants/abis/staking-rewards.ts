import { Interface } from '@ethersproject/abi'
import { abi as STAKING_REWARDS_ABI } from '@feswap/governance/build/StakingTwinRewards.json'
import { abi as STAKING_REWARDS_FACTORY_ABI } from '@feswap/governance/build/StakingTwinRewardsFactory.json'

const STAKING_REWARDS_INTERFACE = new Interface(STAKING_REWARDS_ABI)

const STAKING_REWARDS_FACTORY_INTERFACE = new Interface(STAKING_REWARDS_FACTORY_ABI)

export { STAKING_REWARDS_FACTORY_INTERFACE, STAKING_REWARDS_INTERFACE }
