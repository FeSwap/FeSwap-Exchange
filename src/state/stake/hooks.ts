import { ChainId, CurrencyAmount, JSBI, Token, TokenAmount, WETH, Pair, WETH9 } from '@feswap/sdk'
//import { ChainId, CurrencyAmount, JSBI, Token, TokenAmount, WETH, Pair, WETH9 } from '@feswap/sdk'
import { useMemo } from 'react'
import { FESW, USDT, WBTC, USDC } from '../../constants'
//import { FESW } from '../../constants'
import { STAKING_REWARDS_INTERFACE } from '../../constants/abis/staking-rewards'
import { useActiveWeb3React } from '../../hooks'
import { NEVER_RELOAD, useMultipleContractSingleData } from '../multicall/hooks'
import { tryParseAmount } from '../swap/hooks'
import useCurrentBlockTimestamp from 'hooks/useCurrentBlockTimestamp'
import { ZERO_ADDRESS } from '../../constants'

export const STAKING_GENESIS: { [chainId in ChainId]: number } = {
  [ChainId.MAINNET]:           1630360800,
  [ChainId.ROPSTEN]:           1627318800,
  [ChainId.RINKEBY]:           1627318800,
  [ChainId.GÖRLI]:             1627318800,
  [ChainId.KOVAN]:             1627318800,
  [ChainId.BSC]:               0,
  [ChainId.BSC_TESTNET]:       1636113600, 
  [ChainId.MATIC]:             1639551600,
  [ChainId.MATIC_TESTNET]:     1636286400,
  [ChainId.HARMONY]:           0,
  [ChainId.HARMONY_TESTNET]:   1636113600,
  [ChainId.FANTOM]:            0,
  [ChainId.FANTOM_TESTNET]:    1636113600,
  [ChainId.HECO]:              0,
  [ChainId.HECO_TESTNET]:      1636113600,
  [ChainId.ARBITRUM]:          0,
  [ChainId.ARBITRUM_TESTNET]:  1636113600,
  [ChainId.AVALANCHE]:         0,
  [ChainId.AVALANCHE_TESTNET]: 1636113600,
  [ChainId.OKEX]:               0,
  [ChainId.OKEX_TESTNET]:       1636113600,
  [ChainId.PALM]:               0,    
  [ChainId.PALM_TESTNET]:       0,
  [ChainId.MOONBEAM]:           0,
  [ChainId.MOONRIVER]:          0,
  [ChainId.XDAI]:               0,
  [ChainId.CELO]:               0
}

export const REWARDS_DURATION_DAYS = 120      // 60

// TODO add staking rewards addresses here
export const STAKING_REWARDS_INFO: {
  [chainId in ChainId]?: {
    tokens: [Token, Token]
    stakingRewardAddress: string
  }[]
} = {
  [ChainId.MAINNET]: [
    {
      tokens: [WETH[ChainId.MAINNET], USDT[ChainId.MAINNET]],
      stakingRewardAddress: '0x23D04f77063f60042aAB7aAEDF14ADDbd7bE6Ee9'
    },
    {
      tokens: [WETH[ChainId.MAINNET], WBTC[ChainId.MAINNET]],
      stakingRewardAddress: '0xaC262B589b785e48E2A331Cb9cAf86fFAf069f91'
    },
    {
      tokens: [WETH[ChainId.MAINNET], USDC[ChainId.MAINNET]],
      stakingRewardAddress: '0xA4A0B0A90f1574d02c55577f7aA5a698Ca4B47c8'
    },
    {
      tokens: [WETH[ChainId.MAINNET], FESW[ChainId.MAINNET]],
      stakingRewardAddress: '0x33B6af4A9ce826621F6c89Fe8563337f8A1CA51e'
    }
  ],
  [ChainId.ROPSTEN]: [
    //    {
    //      tokens: [WETH[ChainId.RINKEBY], USDT[ChainId.RINKEBY]],
    //      stakingRewardAddress: '0xa36ce7A67f6c4135f9f61faCA959505AE67F0724'
    //    },
    //    {
    //      tokens: [WETH[ChainId.RINKEBY], WBTC[ChainId.RINKEBY]],
    //      stakingRewardAddress: '0x4076f4B91b80a7029D3beAa41C3cb529468FA226'
    //    },
        {
          tokens: [WETH[ChainId.ROPSTEN], FESW[ChainId.ROPSTEN]],
          stakingRewardAddress: '0xC6e82Ec5B319bbBC8ad63F94873c8E9fD9B1EfDf'
        }
  ],
  [ChainId.KOVAN]: [
    //    {
    //      tokens: [WETH[ChainId.RINKEBY], USDT[ChainId.RINKEBY]],
    //      stakingRewardAddress: '0xa36ce7A67f6c4135f9f61faCA959505AE67F0724'
    //    },
    //    {
    //      tokens: [WETH[ChainId.RINKEBY], WBTC[ChainId.RINKEBY]],
    //      stakingRewardAddress: '0x4076f4B91b80a7029D3beAa41C3cb529468FA226'
    //    },
        {
          tokens: [WETH[ChainId.KOVAN], FESW[ChainId.KOVAN]],
          stakingRewardAddress: '0xC6e82Ec5B319bbBC8ad63F94873c8E9fD9B1EfDf'
        }
  ],  
  [ChainId.RINKEBY]: [
//    {
//      tokens: [WETH[ChainId.RINKEBY], USDT[ChainId.RINKEBY]],
//      stakingRewardAddress: '0xa36ce7A67f6c4135f9f61faCA959505AE67F0724'
//   },
//    {
//      tokens: [WETH[ChainId.RINKEBY], WBTC[ChainId.RINKEBY]],
//      stakingRewardAddress: '0x4076f4B91b80a7029D3beAa41C3cb529468FA226'
//    },
    {
      tokens: [WETH[ChainId.RINKEBY], FESW[ChainId.RINKEBY]],
      stakingRewardAddress: '0xC6e82Ec5B319bbBC8ad63F94873c8E9fD9B1EfDf'
    }
  ],
  [ChainId.GÖRLI]: [
//    {
//      tokens: [WETH[ChainId.RINKEBY], USDT[ChainId.RINKEBY]],
//      stakingRewardAddress: '0xa36ce7A67f6c4135f9f61faCA959505AE67F0724'
//    },
//    {
//      tokens: [WETH[ChainId.RINKEBY], WBTC[ChainId.RINKEBY]],
//      stakingRewardAddress: '0x4076f4B91b80a7029D3beAa41C3cb529468FA226'
//    },
    {
      tokens: [WETH[ChainId.GÖRLI], FESW[ChainId.GÖRLI]],
      stakingRewardAddress: '0xC6e82Ec5B319bbBC8ad63F94873c8E9fD9B1EfDf'
    }
  ],
  [ChainId.BSC_TESTNET]: [
    {
      tokens: [WETH[ChainId.BSC_TESTNET], FESW[ChainId.BSC_TESTNET]],
      stakingRewardAddress: '0x7e9dd96D0360BCc12F04032e9871722D931814b3'
    },
    {
      tokens: [WETH[ChainId.BSC_TESTNET], USDC[ChainId.BSC_TESTNET]],
      stakingRewardAddress: '0x82Ab1bf9174f7920649BC7ED8248132474B3824f'
    },
    {
      tokens: [WETH[ChainId.BSC_TESTNET], USDT[ChainId.BSC_TESTNET]],
      stakingRewardAddress: '0x957d1f6857919F17e052c0D1D324C6eBB107c8FD'
    }
  ],
  [ChainId.MATIC_TESTNET]: [
    {
      tokens: [WETH[ChainId.MATIC_TESTNET], FESW[ChainId.MATIC_TESTNET]],
      stakingRewardAddress: '0x7e9dd96D0360BCc12F04032e9871722D931814b3'
    },
    {
      tokens: [WETH[ChainId.MATIC_TESTNET], USDC[ChainId.MATIC_TESTNET]],
      stakingRewardAddress: '0x82Ab1bf9174f7920649BC7ED8248132474B3824f'
    },
    {
      tokens: [WETH[ChainId.MATIC_TESTNET], USDT[ChainId.MATIC_TESTNET]],
      stakingRewardAddress: '0x957d1f6857919F17e052c0D1D324C6eBB107c8FD'
    }
  ],
  [ChainId.MATIC]: [
    {
      tokens: [WETH[ChainId.MATIC], USDC[ChainId.MATIC]],
      stakingRewardAddress: '0xe05dbD3379fcFd8CF9288d690950DDc0141cEFF4'
    },
    {
      tokens: [WETH[ChainId.MATIC], WETH9[ChainId.MATIC]],
      stakingRewardAddress: '0xde7fA1fbc848452F03883B3b8a6AEF0E81995aD0'
    },
    {
      tokens: [WETH[ChainId.MATIC], USDT[ChainId.MATIC]],
      stakingRewardAddress: '0xBd10777A84Ee91f4bF56b8A0De2a4E487C323b37'
    },
    {
      tokens: [WETH9[ChainId.MATIC], USDC[ChainId.MATIC]],
      stakingRewardAddress: '0xd62a2c17b0AD040f9BDc4DCAFDe6BdA756ba5D02'
    },
    {
      tokens: [WETH9[ChainId.MATIC], WBTC[ChainId.MATIC]],
      stakingRewardAddress: '0xb1bBAfF6Beff00177AF76D9D404Da9F935bAE35f'
    },
    {
      tokens: [WETH[ChainId.MATIC], FESW[ChainId.MATIC]],
      stakingRewardAddress: '0xcb0B77d9024d3C2C91Aabc5DfD3B5694Be2fa74A'
    }
  ]
}

//0xe05dbD3379fcFd8CF9288d690950DDc0141cEFF4 
//0xde7fA1fbc848452F03883B3b8a6AEF0E81995aD0 
//0xBd10777A84Ee91f4bF56b8A0De2a4E487C323b37 
//0xcb0B77d9024d3C2C91Aabc5DfD3B5694Be2fa74A 
//0xd62a2c17b0AD040f9BDc4DCAFDe6BdA756ba5D02 
//0xb1bBAfF6Beff00177AF76D9D404Da9F935bAE35f

export interface StakingInfo {
  // the address of the reward contract
  stakingRewardAddress: string
  // the tokens involved in this pair
  tokens: [Token, Token]
  // the amount of token currently staked, or undefined if no account
  stakedAmount: TokenAmount[]
  // the amount of reward token earned by the active account, or undefined if no account
  earnedAmount: TokenAmount
  // the total amount of token staked in the contract
  totalStakedAmount: TokenAmount[]
  // the amount of token distributed per second to all LPs, constant
  totalRewardRate: TokenAmount
  // the current amount of token distributed to the active account per second.
  // equivalent to percent of total supply * reward rate
  rewardRate: TokenAmount
  // when the period ends
  periodFinish: Date | undefined
  rewardsDuration: number | undefined,
  // if pool is active
  active: boolean
  // calculates a hypothetical amount of token distributed to the active account per second.
  getHypotheticalRewardRate: (
    stakedAmount: TokenAmount[],
    totalStakedAmount: TokenAmount[],
    totalRewardRate: TokenAmount
  ) => TokenAmount
}

// gets the staking info from the network for the active chain id
export function useStakingInfo(pairToFilterBy?: Pair | null): StakingInfo[] {
  const { chainId, account } = useActiveWeb3React()

  // detect if staking is ended
  const currentBlockTimestamp = useCurrentBlockTimestamp()

  const info = useMemo(
    () =>
      chainId
        ? STAKING_REWARDS_INFO[chainId]?.filter(stakingRewardInfo =>
            pairToFilterBy === undefined
              ? true
              : pairToFilterBy === null
                ? false
                : pairToFilterBy.involvesToken(stakingRewardInfo.tokens[0]) &&
                  pairToFilterBy.involvesToken(stakingRewardInfo.tokens[1])
          ) ?? []
        : [],
    [chainId, pairToFilterBy]
  )

  const fesw = chainId ? FESW[chainId] : undefined

  const rewardsAddresses = useMemo(() => info.map(({ stakingRewardAddress }) => stakingRewardAddress), [info])

  const accountArg = useMemo(() => [account ?? ZERO_ADDRESS], [account])

  // get all the info from the staking rewards contracts
  const balances = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'balanceOf', accountArg)
  const earnedAmounts = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'earned', accountArg)
  const totalSupplies = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'totalSupply')

  // tokens per second, constants
  const rewardRates = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'rewardRate', undefined, NEVER_RELOAD)
  const periodFinishes = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'periodFinish', undefined, NEVER_RELOAD)
  const rewardsDuration = useMultipleContractSingleData(rewardsAddresses, STAKING_REWARDS_INTERFACE, 'rewardsDuration', undefined, NEVER_RELOAD)

  return useMemo(() => {
    if (!chainId || !fesw) return []

    return rewardsAddresses.reduce<StakingInfo[]>((memo, rewardsAddress, index) => {
      // these two are dependent on account
      const balanceState = balances[index]
      const earnedAmountState = earnedAmounts[index]

      // these get fetched regardless of account
      const totalSupplyState = totalSupplies[index]
      const rewardRateState = rewardRates[index]
      const periodFinishState = periodFinishes[index]
      const rewardsDurationState = rewardsDuration[index]


      if (
        // these may be undefined if not logged in
        !balanceState?.loading &&
        !earnedAmountState?.loading &&
        // always need these
        totalSupplyState &&
        !totalSupplyState.loading &&
        rewardRateState &&
        !rewardRateState.loading &&
        periodFinishState &&
        !periodFinishState.loading &&
        rewardsDurationState &&
        !rewardsDurationState.loading       
      ) {
        if (
          balanceState?.error ||
          earnedAmountState?.error ||
          totalSupplyState.error ||
          rewardRateState.error ||
          periodFinishState.error ||
          rewardsDurationState.error
        ) {
          console.error('Failed to load staking rewards info')
          return memo
        }

        // get the LP token
        const tokens = info[index].tokens
        const dummyPair = new Pair( new TokenAmount(tokens[0], '0'), new TokenAmount(tokens[1], '0'),
                                    new TokenAmount(tokens[1], '0'), new TokenAmount(tokens[0], '0'), 10100)

        // check for account, if no account set to 0
        const [stakingTokenA, stakingTokenB] =  dummyPair.liquidityToken0.address.toLowerCase() < 
                                                  dummyPair.liquidityToken1.address.toLowerCase()
                                                ? [dummyPair.liquidityToken0, dummyPair.liquidityToken1]
                                                : [dummyPair.liquidityToken1, dummyPair.liquidityToken0]
        const stakedAmount =  [ new TokenAmount(stakingTokenA, JSBI.BigInt(balanceState?.result?.[0] ?? 0)),
                                new TokenAmount(stakingTokenB, JSBI.BigInt(balanceState?.result?.[1] ?? 0)) ]
        const totalStakedAmount = [ new TokenAmount(stakingTokenA, JSBI.BigInt(totalSupplyState.result?.[0])),
                                    new TokenAmount(stakingTokenB, JSBI.BigInt(totalSupplyState.result?.[0])) ]

        const totalRewardRate = new TokenAmount(fesw, JSBI.BigInt(rewardRateState.result?.[0]))

        const getHypotheticalRewardRate = (
          stakedAmount: TokenAmount[],
          totalStakedAmount: TokenAmount[],
          totalRewardRate: TokenAmount
        ): TokenAmount => {
          const totalStakedAmountAll: JSBI = JSBI.add(totalStakedAmount[0].raw, totalStakedAmount[1].raw)
          const stakedAmountAll: JSBI = JSBI.add(stakedAmount[0].raw, stakedAmount[1].raw)
          return new TokenAmount(
            fesw,
            JSBI.greaterThan(totalStakedAmountAll, JSBI.BigInt(0))
              ? JSBI.divide(JSBI.multiply(totalRewardRate.raw, stakedAmountAll), totalStakedAmountAll)
              : JSBI.BigInt(0)
          )
        }

        const individualRewardRate = getHypotheticalRewardRate(stakedAmount, totalStakedAmount, totalRewardRate)

        const periodFinishSeconds = periodFinishState.result?.[0]?.toNumber()
        const periodFinishMs = periodFinishSeconds * 1000

        const rewardsDurationSeconds = rewardsDurationState.result?.[0]?.toNumber()

        // compare period end timestamp vs current block timestamp (in seconds)
        const active =
          periodFinishSeconds && currentBlockTimestamp ? periodFinishSeconds > currentBlockTimestamp.toNumber() : true

        memo.push({
          stakingRewardAddress: rewardsAddress,
          tokens: info[index].tokens,
          periodFinish: periodFinishMs > 0 ? new Date(periodFinishMs) : undefined,
          rewardsDuration: rewardsDurationSeconds??undefined,
          earnedAmount: new TokenAmount(fesw, JSBI.BigInt(earnedAmountState?.result?.[0] ?? 0)),
          rewardRate: individualRewardRate,
          totalRewardRate: totalRewardRate,
          stakedAmount: stakedAmount,
          totalStakedAmount: totalStakedAmount,
          getHypotheticalRewardRate,
          active
        })
      }
      return memo
    }, [])
  }, [
    balances,
    chainId,
    currentBlockTimestamp,
    earnedAmounts,
    info,
    periodFinishes,
    rewardsDuration,
    rewardRates,
    rewardsAddresses,
    totalSupplies,
    fesw
  ])
}

export function useTotalFeswEarned(): TokenAmount | undefined {
  const { chainId } = useActiveWeb3React()
  const fesw = chainId ? FESW[chainId] : undefined
  const stakingInfos = useStakingInfo()

  return useMemo(() => {
    if (!fesw) return undefined
    return (
      stakingInfos?.reduce(
        (accumulator, stakingInfo) => accumulator.add(stakingInfo.earnedAmount),
        new TokenAmount(fesw, '0')
      ) ?? new TokenAmount(fesw, '0')
    )
  }, [stakingInfos, fesw])
}

// based on typed value
export function useDerivedStakeInfo(
  typedValue0: string,
  typedValue1: string,
  stakingInfo: StakingInfo,
  userLiquidityUnstaked0: TokenAmount | undefined,
  userLiquidityUnstaked1: TokenAmount | undefined
): {
  parsedAmount0?: CurrencyAmount
  parsedAmount1?: CurrencyAmount
  error?: string
} {
  const { account } = useActiveWeb3React()

  const parsedInput0: CurrencyAmount | undefined = tryParseAmount(typedValue0, stakingInfo.stakedAmount[0].token)
  const parsedInput1: CurrencyAmount | undefined = tryParseAmount(typedValue1, stakingInfo.stakedAmount[1].token)

  const parsedAmount0 =
    parsedInput0 && userLiquidityUnstaked0 && JSBI.lessThanOrEqual(parsedInput0.raw, userLiquidityUnstaked0.raw)
      ? parsedInput0
      : undefined

  const parsedAmount1 =
    parsedInput1 && userLiquidityUnstaked1 && JSBI.lessThanOrEqual(parsedInput1.raw, userLiquidityUnstaked1.raw)
      ? parsedInput1
      : undefined

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (!parsedAmount0 && !parsedAmount1) {
    error = error ?? 'Enter an amount'
  }

  return {
    parsedAmount0,
    parsedAmount1,
    error
  }
}

// based on typed value
export function useDerivedUnstakeInfo(
  typedValue: string,
  stakingAmount: TokenAmount
): {
  parsedAmount?: CurrencyAmount
  error?: string
} {
  const { account } = useActiveWeb3React()

  const parsedInput: CurrencyAmount | undefined = tryParseAmount(typedValue, stakingAmount.token)

  const parsedAmount = parsedInput && JSBI.lessThanOrEqual(parsedInput.raw, stakingAmount.raw) ? parsedInput : undefined

  let error: string | undefined
  if (!account) {
    error = 'Connect Wallet'
  }
  if (!parsedAmount) {
    error = error ?? 'Enter an amount'
  }

  return {
    parsedAmount,
    error
  }
}
