import React, { useContext } from 'react'
import { AutoColumn } from '../../components/Column'
import styled, { ThemeContext }  from 'styled-components'
import { STAKING_REWARDS_INFO, useStakingInfo } from '../../state/stake/hooks'
import { TYPE, ExternalLink } from '../../theme'
import PoolCard from '../../components/earn/PoolCard'
import { RowBetween } from '../../components/Row'
import { CardSection, DataCard, CardNoise } from '../../components/earn/styled'
import { Countdown } from './Countdown'
import Loader from '../../components/Loader'
import { useActiveWeb3React } from '../../hooks'
import { OutlineCard } from '../../components/Card'
import { EmptyProposals } from '../Pool'

const PageWrapper = styled(AutoColumn)`
  max-width: 480px;
  width: 100%;
`

export const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 40% 0%, #FFB6C1 30%, #E6E6FA 100%);
  overflow: hidden;
`

const PoolSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  column-gap: 10px;
  row-gap: 15px;
  width: 100%;
  justify-self: center;
`

const DataRow = styled(RowBetween)`
  ${({ theme }) => theme.mediaWidth.upToSmall`
flex-direction: column;
`};
`

export default function Earn() {
  const { account, chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  // staking info for connected account
  const stakingInfos = useStakingInfo()
   
  /**
   * only show staking cards with balance
   * @todo only account for this if rewards are inactive
   */
//  const stakingInfosWithBalance = stakingInfos?.filter(s => JSBI.greaterThan(s.stakedAmount[0].raw, BIG_INT_ZERO))

  // toggle copy if rewards are inactive
  const stakingRewardsExist = Boolean(typeof chainId === 'number' && (STAKING_REWARDS_INFO[chainId]?.length ?? 0) > 0)

  return (
    <PageWrapper gap="lg" justify="center">
        <VoteCard>
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.black fontWeight={600}>FeSwap liquidity mining</TYPE.black>
              </RowBetween>
              <RowBetween>
                <TYPE.black fontSize={14}>
                  To reward providing liquidity, FESW, the FeSwap protocol governance token, are distributed based on 
                  depositing liquidity tokens.
                </TYPE.black>
              </RowBetween>
              <ExternalLink
                style={{ color: 'black', textDecoration: 'underline' }}
                href="https://www.feswap.io/docs"
                target="_blank"
              >
                <TYPE.black fontSize={14}>Read more about FESW ↗</TYPE.black>
              </ExternalLink>
            </AutoColumn>
          </CardSection>
          <CardNoise />
        </VoteCard>


      <AutoColumn gap="lg" style={{ width: '100%', maxWidth: '720px' }}>
        <DataRow style={{ alignItems: 'baseline' }}>
          <TYPE.mediumHeader style={{ marginTop: '0.5rem' }}>Participating pools</TYPE.mediumHeader>
          <Countdown exactEnd={stakingInfos?.[0]?.periodFinish} />
        </DataRow>

        <PoolSection>
          { (!account) 
            ? ( <EmptyProposals>
                  <TYPE.body fontWeight={500} mr="4px" textAlign="center" fontSize={16} color={theme.text3} > 
                    Connect to a Wallet to Mine FESW tokens
                  </TYPE.body> 
                </EmptyProposals>)
            : stakingRewardsExist && stakingInfos?.length === 0 
              ? (<Loader style={{ margin: 'auto' }} />) 
              : (!stakingRewardsExist) 
                ? ( <OutlineCard>No active pools</OutlineCard>) 
                : stakingInfos?.length !== 0 && (
                    stakingInfos?.map(stakingInfo => {
                    // need to sort by added liquidity here
                    return <PoolCard key={stakingInfo.stakingRewardAddress} stakingInfo={stakingInfo} />
                  })
                )}
        </PoolSection>
      </AutoColumn>
    </PageWrapper>
  )
}

//<PoolSection>
//{stakingRewardsExist && stakingInfos?.length === 0 ? (
//  <Loader style={{ margin: 'auto' }} />
//) : !stakingRewardsExist ? (
//  <OutlineCard>No active pools</OutlineCard>
//) : stakingInfos?.length !== 0 && stakingInfosWithBalance.length === 0 ? (
//  <OutlineCard>No active pools</OutlineCard>
//) : (
//  stakingInfosWithBalance?.map(stakingInfo => {
//    // need to sort by added liquidity here
//    return <PoolCard key={stakingInfo.stakingRewardAddress} stakingInfo={stakingInfo} />
//  })
//)}
//</PoolSection>