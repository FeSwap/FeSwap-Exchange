import { Contract } from '@ethersproject/contracts'
import { abi as GOVERNANCE_ABI } from '@feswap/governance/build/GovernorAlpha.json'
import { abi as SPONSOR_ABI } from '../constants/abis/FeswSponsor.json'
import { abi as FESW_ABI } from '@feswap/governance/build/Fesw.json'
import { abi as NFT_BID_ABI } from '../constants/abis/FeswaNFT.json'
import { abi as NFT_FACTORY_ABI } from '../constants/abis/FeSwapFactory.json'
import { abi as NFT_ROUTER_ABI } from '../constants/abis/FeSwapRouter.json'
import { abi as STAKING_REWARDS_ABI } from '@feswap/governance/build/StakingTwinRewards.json'
import { abi as MERKLE_DISTRIBUTOR_ABI } from '@feswap/governance/build/MerkleDistributor.json'
import { ChainId, WETH } from '@feswap/sdk'
import { abi as IFeSwapPair } from '@feswap/core/build/IFeSwapPair.json'
import { useMemo } from 'react'
import { GOVERNANCE_ADDRESS, SPONSOR_ADDRESS, MERKLE_DISTRIBUTOR_ADDRESS, 
          FESW, NFT_BID_ADDRESS, FESW_FACTORY_ADDRESS, FESW_ROUTER_ADDRESS } from '../constants'
import {
  ARGENT_WALLET_DETECTOR_ABI,
  ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS
} from '../constants/abis/argent-wallet-detector'
import ENS_PUBLIC_RESOLVER_ABI from '../constants/abis/ens-public-resolver.json'
import ENS_ABI from '../constants/abis/ens-registrar.json'
import { ERC20_BYTES32_ABI } from '../constants/abis/erc20'
import ERC20_ABI from '../constants/abis/erc20.json'
import UNISOCKS_ABI from '../constants/abis/unisocks.json'
import WETH_ABI from '../constants/abis/weth.json'
import { MULTICALL_ABI, MULTICALL_NETWORKS } from '../constants/multicall'
import { getContract } from '../utils'
import { useActiveWeb3React } from './index'

// returns null on errors
function useContract(address: string | undefined, ABI: any, withSignerIfPossible = true): Contract | null {
  const { library, account } = useActiveWeb3React()

  return useMemo(() => {
    if (!address || !ABI || !library) return null
    try {
      return getContract(address, ABI, library, withSignerIfPossible && account ? account : undefined)
    } catch (error) {
      console.error('Failed to get contract', error)
      return null
    }
  }, [address, ABI, library, withSignerIfPossible, account])
}

export function useTokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_ABI, withSignerIfPossible)
}

export function useWETHContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId ? WETH[chainId].address : undefined, WETH_ABI, withSignerIfPossible)
}

export function useArgentWalletDetectorContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(
    chainId === ChainId.MAINNET ? ARGENT_WALLET_DETECTOR_MAINNET_ADDRESS : undefined,
    ARGENT_WALLET_DETECTOR_ABI,
    false
  )
}

export function useENSRegistrarContract(withSignerIfPossible?: boolean): Contract | null {
  const { chainId } = useActiveWeb3React()
  let address: string | undefined
  if (chainId) {
    switch (chainId) {
      case ChainId.MAINNET:
      case ChainId.GÖRLI:
      case ChainId.ROPSTEN:
      case ChainId.RINKEBY:
        address = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e'
        break
    }
  }
  return useContract(address, ENS_ABI, withSignerIfPossible)
}

export function useENSResolverContract(address: string | undefined, withSignerIfPossible?: boolean): Contract | null {
  return useContract(address, ENS_PUBLIC_RESOLVER_ABI, withSignerIfPossible)
}

export function useBytes32TokenContract(tokenAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(tokenAddress, ERC20_BYTES32_ABI, withSignerIfPossible)
}

export function usePairContract(pairAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(pairAddress, IFeSwapPair, withSignerIfPossible)
}

export function useMulticallContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId && MULTICALL_NETWORKS[chainId], MULTICALL_ABI, false)
}

export function useMerkleDistributorContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId ? MERKLE_DISTRIBUTOR_ADDRESS[chainId] : undefined, MERKLE_DISTRIBUTOR_ABI, true)
}

export function useGovernanceContract(): Contract | null {
  return useContract(GOVERNANCE_ADDRESS, GOVERNANCE_ABI, true)
}

export function useFeswContract(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(chainId ? FESW[chainId].address : undefined, FESW_ABI, true)
}

export function useFeswFactoryContract(): Contract | null {
  return useContract(FESW_FACTORY_ADDRESS, NFT_FACTORY_ABI, true)
}

export function useFeswRouterContract(): Contract | null {
  return useContract(FESW_ROUTER_ADDRESS, NFT_ROUTER_ABI, true)
}

export function useSponsorContract(): Contract | null {
  return useContract(SPONSOR_ADDRESS, SPONSOR_ABI, true)
}

export function useNftBidContract(): Contract | null {
  return useContract(NFT_BID_ADDRESS, NFT_BID_ABI, true)
}

export function useStakingContract(stakingAddress?: string, withSignerIfPossible?: boolean): Contract | null {
  return useContract(stakingAddress, STAKING_REWARDS_ABI, withSignerIfPossible)
}

export function useSocksController(): Contract | null {
  const { chainId } = useActiveWeb3React()
  return useContract(
    chainId === ChainId.MAINNET ? '0x65770b5283117639760beA3F867b69b3697a91dd' : undefined,
    UNISOCKS_ABI,
    false
  )
}
