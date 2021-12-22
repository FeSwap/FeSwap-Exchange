import React, { useContext, useMemo } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Pair, JSBI } from '@feswap/sdk'
import { Link } from 'react-router-dom'
//import { SwapPoolTabs } from '../../components/NavigationTabs'

import FullPositionCard from '../../components/PositionCard'
import { useTokenBalancesWithLoadingIndicator } from '../../state/wallet/hooks'
import { StyledInternalLink, TYPE, HideSmall } from '../../theme'
import { Text } from 'rebass'
// import Card from '../../components/Card'
import { RowBetween, RowFixed } from '../../components/Row'
import { ButtonPrimary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'

import { useActiveWeb3React } from '../../hooks'
import { usePairs } from '../../data/Reserves'
import { toFeswLiquidityToken, useTrackedTokenPairs } from '../../state/user/hooks'
import { Dots } from '../../components/swap/styleds'
import { CardSection, DataCard, CardNoise } from '../../components/earn/styled'
import { useStakingInfo } from '../../state/stake/hooks'
import { BIG_INT_ZERO } from '../../constants'

const PageWrapper = styled(AutoColumn)`
  max-width: 560px;
  width: 100%;
`

export const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 40% 0%, #FFB6C1 30%, #E6E6FA 100%);
  overflow: hidden;
`

const TitleRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
    flex-direction: column-reverse;
  `};
`

const ButtonRow = styled(RowFixed)`
  gap: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: row-reverse;
    justify-content: space-between;
  `};
`

const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  width: fit-content;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 48%;
  `}
  &:hover {
    color: ${({ theme }) => (theme.text5)};
  }
`

//const ResponsiveButtonSecondary = styled(ButtonSecondary)`
//  width: fit-content;
//  ${({ theme }) => theme.mediaWidth.upToSmall`
//    width: 48%;
//  `};
//`

export const EmptyProposals = styled.div`
  border: 1px solid ${({ theme }) => theme.text4};
  padding: 16px 12px;
  border-radius: 10px;
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

export default function Pool() {
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()

  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()
  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map(tokens => ({ liquidityToken: toFeswLiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  )
  const liquidityTokensFlated = useMemo(() => tokenPairsWithLiquidityTokens.flatMap(tpwlt => [tpwlt.liquidityToken[0], tpwlt.liquidityToken[1]])
                            , [tokenPairsWithLiquidityTokens])

  const [feswPairsBalances, fetchingFeswPairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokensFlated
  )

  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        feswPairsBalances[liquidityToken[0].address]?.greaterThan('0') ||
        feswPairsBalances[liquidityToken[1].address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokens, feswPairsBalances]
  )

  const feswPairs = usePairs(liquidityTokensWithBalances.map(({ tokens }) => tokens))
  const poolIsLoading =
    fetchingFeswPairBalances || feswPairs?.length < liquidityTokensWithBalances.length || feswPairs?.some(feswPair => !feswPair)

  const allFeswPairsWithLiquidity = feswPairs.map(([, pair]) => pair).filter((feswPair): feswPair is Pair => Boolean(feswPair))

  // show liquidity even if its deposited in rewards contract
  const stakingInfo = useStakingInfo()
  const stakingInfosWithBalance = stakingInfo?.filter(pool => JSBI.greaterThan(pool.stakedAmount[0].raw, BIG_INT_ZERO) ||
                                                              JSBI.greaterThan(pool.stakedAmount[1].raw, BIG_INT_ZERO))
                                                              
  const stakingPairs = usePairs(stakingInfosWithBalance?.map(stakingInfo => stakingInfo.tokens))

  // remove any pairs that also are included in pairs with stake in mining pool
  const v2PairsWithoutStakedAmount = allFeswPairsWithLiquidity.filter(feswPair => {
    return (
      stakingPairs?.map(stakingPair => stakingPair[1])
        .filter(stakingPair => stakingPair?.liquidityToken0.address === feswPair.liquidityToken0.address).length === 0
    )
  })

  return (
    <>
      <PageWrapper>
        <VoteCard>
          <CardNoise />
            <CardSection>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.black fontWeight={600}>Liquidity provider profit</TYPE.black>
                </RowBetween>
                <RowBetween>
                  <TYPE.black fontSize={14}>
                    {`Liquidity providers make profit from the internal exchange mitigating the price gap of two sub-pools, 
                    which is equivalent to the exchange fee rate of 0.25-1% based on the pool configuaration. 
                    All profit are shared by all liquidity providers, and can be claimed at any time.`}
                  </TYPE.black>
                </RowBetween>
              </AutoColumn>
            </CardSection>
          <CardNoise />
        </VoteCard>
        <AutoColumn gap="lg" justify="center" style={{ width: '100%' }}>
            <TitleRow style={{ marginTop: '1rem' }} padding={'0'}>
              <HideSmall>
                <TYPE.mediumHeader style={{ marginTop: '0.5rem', justifySelf: 'flex-start' }}>
                  Your liquidity
                </TYPE.mediumHeader>
              </HideSmall>
              <ButtonRow>
                <ResponsiveButtonPrimary as={Link} padding="6px 8px" to="/create">
                  My NFTs
                </ResponsiveButtonPrimary>
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} padding="6px 8px" to="/add/ETH">
                  <Text fontWeight={500} fontSize={16}>
                    Add Liquidity
                  </Text>
                </ResponsiveButtonPrimary>
              </ButtonRow>
            </TitleRow>

            {!account ? (
              <EmptyProposals>
                <TYPE.body color={theme.text2} textAlign="center">
                  Connect to a wallet to view your liquidity.
                </TYPE.body>
              </EmptyProposals>
            ) : poolIsLoading ? (
              <EmptyProposals>
                <TYPE.body color={theme.text3} textAlign="center">
                  <Dots>Loading</Dots>
                </TYPE.body>
              </EmptyProposals>
            ) : allFeswPairsWithLiquidity?.length > 0 || stakingPairs?.length > 0 ? (
              <>
                {v2PairsWithoutStakedAmount.map(feswPair => (
                  <FullPositionCard key={feswPair.liquidityToken0.address} pair={feswPair} />
                ))}
                {stakingPairs.map(
                  (stakingPair, i) =>
                    stakingPair[1] && ( // skip pairs that arent loaded
                      <FullPositionCard
                        key={stakingInfosWithBalance[i].stakingRewardAddress}
                        pair={stakingPair[1]}
                        stakedBalance0={stakingInfosWithBalance[i].stakedAmount[0]}
                        stakedBalance1={stakingInfosWithBalance[i].stakedAmount[1]} 
                      />
                    )
                )}
              </>
            ) : (
              <EmptyProposals>
                <TYPE.body color={theme.text2} textAlign="center">
                  No liquidity found.
                </TYPE.body>
              </EmptyProposals>
            )}

            <AutoColumn justify={'center'} gap="md">
              <Text textAlign="center" fontSize={14} style={{ padding: '.5rem 0 .5rem 0' }}>
                {`Don't see a pool you joined? `}
                <StyledInternalLink id="import-pool-link" to={'/find'}>
                  {'Import it here 👈'}
                </StyledInternalLink>
              </Text>
            </AutoColumn>
        </AutoColumn>
      </PageWrapper>
    </>
  )
}
