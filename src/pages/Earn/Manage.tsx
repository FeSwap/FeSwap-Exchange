import React, { useCallback, useState } from 'react'
import { AutoColumn } from '../../components/Column'
import styled from 'styled-components'
import { Link } from 'react-router-dom'

import { JSBI, TokenAmount, ETHER } from '@feswap/sdk'
import { RouteComponentProps } from 'react-router-dom'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { useCurrency } from '../../hooks/Tokens'
import { useWalletModalToggle } from '../../state/application/hooks'
import { TYPE } from '../../theme'

import { RowBetween, RowFixed } from '../../components/Row'
import { DataCard, CardNoise } from '../../components/earn/styled'
import { ButtonPrimary } from '../../components/Button'
import StakingModal from '../../components/earn/StakingModal'
import { useStakingInfo } from '../../state/stake/hooks'
import UnstakingModal from '../../components/earn/UnstakingModal'
import ClaimRewardModal from '../../components/earn/ClaimRewardModal'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useActiveWeb3React } from '../../hooks'
import { useColor } from '../../hooks/useColor'
import { CountUp } from 'use-count-up'

import { wrappedCurrency } from '../../utils/wrappedCurrency'
import { currencyId } from '../../utils/currencyId'
import { useTotalSupply } from '../../data/TotalSupply'
import { usePair } from '../../data/Reserves'
import usePrevious from '../../hooks/usePrevious'
import { useUSDTPrice } from '../../utils/useUSDCPrice'
import { transparentize } from 'polished'
import { BIG_INT_ZERO, BIG_INT_SECONDS_IN_DAY } from '../../constants'
import { LightCard } from '../../components/Card'

const PageWrapper = styled(AutoColumn)`
  max-width: 480px;
  width: 100%;
`

//const PositionInfo = styled(AutoColumn)<{ dim: any; bgColor: any}>`
//  position: relative;
//  max-width: 480px;
//  width: 100%;
//  opacity: ${({ dim }) => (dim ? 0.6 : 1)};
//  background: ${({ theme, bgColor }) =>
//              `radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, bgColor)} 0%, ${'#E6E6FA'} 100%) `};
//`

//const BottomSection = styled(AutoColumn)`
//  border-radius: 12px;
//  width: 100%;
//  position: relative;
//`

//background: radial-gradient(76.02% 75.41% at 1.84% 0%, #1e1a31 0%, #3d51a5 100%);
//<StyledDataCard disabled={disableTop} bgColor={backgroundColor} showBackground={!showAddLiquidityButton}>
//background: ${({ theme, bgColor, showBackground }) =>
//`radial-gradient(91.85% 100% at 1.84% 0%, ${bgColor} 0%,  ${showBackground ? theme.black : theme.bg5} 100%) `};

//const StyledDataCard = styled(DataCard)<{ bgColor?: any; showBackground?: any }>`
//  z-index: 2;
//  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
//  background: ${({ theme, bgColor }) =>
//              `radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, bgColor)} 0%, ${'#E6E6FA'} 100%) `};
//`

const StyledPositionCard = styled(LightCard)<{ bgColor: any }>`
  border: none;
  background: ${({ theme, bgColor }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, bgColor)} 0%, ${'#E6E6FA'} 100%) `};
  position: relative;
  overflow: hidden;
`

//const StyledBottomCard = styled(DataCard)<{ dim: any }>`
//  background: ${({ theme }) => theme.bg3};
//  opacity: ${({ dim }) => (dim ? 0.4 : 1)};
//  margin-top: -40px;
//  padding: 0 1.25rem 1rem 1.25rem;
//  padding-top: 32px;
/// z-index: 1;
//`

const PoolData = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 40% 0%, #FFB6C1 30%, #E6E6FA 100%);
  border-radius: 12px;
  padding: 12px;
  z-index: 1;
`

const Separator = styled.div`
  width: 100%;
  height: 1px;
  background-color: ${({ theme }) => theme.bg5};
`

//const VoteCard = styled(DataCard)`
//  background: radial-gradient(76.02% 75.41% at 40% 0%, #FFB6C1 30%, #E6E6FA 100%);
//  overflow: hidden;
//`

const CardSection = styled(AutoColumn)<{ disabled?: boolean }>`
  padding: 12px 8px 12px 8px;
  z-index: 1;
  opacity: ${({ disabled }) => disabled && '0.4'};
`

const DataRow = styled(RowBetween)`
  justify-content: center;
  overflow: hidden;
  border-radius: 12px;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 12px;
  `};
`

const FixedHeightRow = styled(RowBetween)`
  height: 36px;
`

export default function Manage({
  match: {
    params: { currencyIdA, currencyIdB }
  }
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const { account, chainId } = useActiveWeb3React()

  // get currencies and pair
  const [currencyA, currencyB] = [useCurrency(currencyIdA), useCurrency(currencyIdB)]

  const tokenA = wrappedCurrency(currencyA ?? undefined, chainId)
  const tokenB = wrappedCurrency(currencyB ?? undefined, chainId)

  const [, stakingTokenPair] = usePair(tokenA, tokenB)
  const stakingInfo = useStakingInfo(stakingTokenPair)?.[0]

  // detect existing unstaked LP position to show add button if none found
  const userLiquidityUnstaked0 = useTokenBalance(account ?? undefined, stakingInfo?.stakedAmount?.[0].token)
  const userLiquidityUnstaked1 = useTokenBalance(account ?? undefined, stakingInfo?.stakedAmount?.[1].token)
  
  const showAddLiquidityButton =  Boolean(stakingInfo?.stakedAmount?.[0].equalTo('0') && userLiquidityUnstaked0?.equalTo('0')) &&
                                  Boolean(stakingInfo?.stakedAmount?.[1].equalTo('0') && userLiquidityUnstaked1?.equalTo('0'))                     

  // toggle for staking modal and unstaking modal
  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [showClaimRewardModal, setShowClaimRewardModal] = useState(false)

  // fade cards if nothing staked or nothing earned yet
//  const disableTop = (!stakingInfo?.stakedAmount[0] && !stakingInfo?.stakedAmount[1]) || 
//                      ( stakingInfo.stakedAmount[0].equalTo(JSBI.BigInt(0)) && stakingInfo.stakedAmount[1].equalTo(JSBI.BigInt(0)))

  const token = currencyA === ETHER ? tokenB : tokenA
  const WETH = currencyA === ETHER ? tokenA : tokenB
  const backgroundColor = useColor(token)

  // get WETH value of staked LP tokens
  const totalSupplyOfStakingToken0 = useTotalSupply(stakingInfo?.stakedAmount?.[0].token)
  const totalSupplyOfStakingToken1 = useTotalSupply(stakingInfo?.stakedAmount?.[1].token)

  const valueOfTotalStakedAmountInWETH: TokenAmount | undefined = 
        (totalSupplyOfStakingToken0 && totalSupplyOfStakingToken1 && stakingTokenPair && stakingInfo && WETH) 
        // take the total amount of LP tokens staked, multiply by ETH value of all LP tokens, divide by all LP tokens
        ? new TokenAmount(
          WETH,
          JSBI.divide(
            JSBI.multiply(
              JSBI.multiply(JSBI.add(stakingInfo.totalStakedAmount[0].raw, stakingInfo.totalStakedAmount[1].raw),
                            JSBI.add(stakingTokenPair.reserveOfOutput(WETH).raw, stakingTokenPair.reserveOfInput(WETH).raw)),
              JSBI.BigInt(2) // this is b/c the value of LP shares are ~double the value of the WETH they entitle owner to
            ),
            JSBI.add(totalSupplyOfStakingToken0.raw, totalSupplyOfStakingToken1.raw)
          )
        )
        : undefined

  const countUpAmount = stakingInfo?.earnedAmount?.toFixed(6) ?? '0'
  const countUpAmountPrevious = usePrevious(countUpAmount) ?? '0'

  // get the USD value of staked WETH
  const USDTPrice = useUSDTPrice(WETH)
  const valueOfTotalStakedAmountInUSDT = valueOfTotalStakedAmountInWETH && USDTPrice?.quote(valueOfTotalStakedAmountInWETH)

  const toggleWalletModal = useWalletModalToggle()

  const handleDepositClick = useCallback(() => {
    if (account) {
      setShowStakingModal(true)
    } else {
      toggleWalletModal()
    }
  }, [account, toggleWalletModal])

   return (
    <PageWrapper gap="lg" justify="center">
      <RowBetween style={{ gap: '24px' }}>
        <div/>
        <TYPE.mediumHeader style={{ margin: 0 }} fontSize={20}>
          {currencyA?.symbol}🔗{currencyB?.symbol} Liquidity Mining
        </TYPE.mediumHeader>
        <DoubleCurrencyLogo currency0={currencyA ?? undefined} currency1={currencyB ?? undefined} size={24} />
      </RowBetween>

      <DataRow style={{ gap: '10px' }}>
          <PoolData>
            <CardNoise />
            <AutoColumn gap="sm">
              <TYPE.body style={{ margin: 0 }}>Total Value of Deposits</TYPE.body>
              <TYPE.body fontSize={24} fontWeight={500} style={{ textAlign: 'center' }}>
                {`${valueOfTotalStakedAmountInWETH?.toSignificant(4, { groupSeparator: ',' }) ?? '-'} ETH`}
              </TYPE.body>
              <TYPE.body fontSize={20} fontWeight={500} style={{ textAlign: 'center' }}>
                {`$ ${valueOfTotalStakedAmountInUSDT?.toFixed(0, { groupSeparator: ',' })??' -'}`}
              </TYPE.body>
            </AutoColumn>
            <CardNoise />
          </PoolData>
          <PoolData>
            <CardNoise />
            <AutoColumn gap="sm">
              <TYPE.body style={{ margin: 0 }}>Pool Mining Rate</TYPE.body>
              <TYPE.body fontSize={24} fontWeight={500} style={{ textAlign: 'center' }}>
                {stakingInfo?.active
                  ? stakingInfo?.totalRewardRate
                      ?.multiply(BIG_INT_SECONDS_IN_DAY)
                      ?.toFixed(0, { groupSeparator: ',' }) ?? '-'
                  : '0'}
              </TYPE.body>
              <TYPE.body fontSize={20} fontWeight={500} style={{ textAlign: 'center' }} >{' FESW / Day'} </TYPE.body>
            </AutoColumn>
            <CardNoise />
          </PoolData>
      </DataRow>

      {showAddLiquidityButton && (
        <StyledPositionCard bgColor={backgroundColor}>
          <CardNoise />
          <CardSection gap="md">
              <RowBetween>
                <TYPE.black fontWeight={600} fontSize={20} >Want to Mine FESW</TYPE.black>
              </RowBetween>
              <RowBetween style={{ marginBottom: '1rem' }}>
                <TYPE.black fontSize={14}>
                  {`To mine FESW token, you need to stake FeSwap liquidity token FESP, which can be minted by adding liquidity 
                    to the ${currencyA?.symbol}🔗${currencyB?.symbol} pool. Once you have minted some FESP tokens, 
                    you can stake them on this page.`}
                </TYPE.black>
              </RowBetween>
              <RowBetween>
                <div/>
                <ButtonPrimary
                  padding="8px"
                  borderRadius="8px"
                  width={'fit-content'}
                  as={Link}
                  to={`/add/${currencyA && currencyId(currencyA)}/${currencyB && currencyId(currencyB)}`}
                >
                  {`Add ${currencyA?.symbol}🔗${currencyB?.symbol} liquidity`}
                </ButtonPrimary>
              </RowBetween>
          </CardSection>
        </StyledPositionCard>
      )}

      {stakingInfo && (
        <>
          <StakingModal
            isOpen={showStakingModal}
            onDismiss={() => setShowStakingModal(false)}
            stakingInfo={stakingInfo}
            userLiquidityUnstaked0={userLiquidityUnstaked0}
            userLiquidityUnstaked1={userLiquidityUnstaked1}
          />
          <UnstakingModal
            isOpen={showUnstakingModal}
            onDismiss={() => setShowUnstakingModal(false)}
            stakingInfo={stakingInfo}
          />
          <ClaimRewardModal
            isOpen={showClaimRewardModal}
            onDismiss={() => setShowClaimRewardModal(false)}
            stakingInfo={stakingInfo}
          />
        </>
      )}

      <StyledPositionCard bgColor={backgroundColor}>
        <CardNoise />
        <FixedHeightRow>
          <RowFixed>
            <TYPE.mediumHeader style={{ margin: 0 }} fontSize={20}>
              Liquidity Mining Status
            </TYPE.mediumHeader>
          </RowFixed>
          <RowFixed>
            <TYPE.mediumHeader style={{ margin: "0 6px" }} fontSize={20}>
              {currencyA?.symbol}🔗{currencyB?.symbol} 
            </TYPE.mediumHeader>
            <DoubleCurrencyLogo currency0={currencyA??undefined} currency1={currencyB??undefined} size={24} />
          </RowFixed>
        </FixedHeightRow>
        <Separator />

        <AutoColumn gap="12px">
          <CardSection gap="4px">
            <RowBetween>
              <TYPE.black fontWeight={400} fontSize={18}>Your claimable FESW</TYPE.black>
            </RowBetween>
            <RowBetween style={{ alignItems: 'baseline' }}>
              <TYPE.largeHeader fontSize={36} fontWeight={600}>
                <CountUp
                  key={countUpAmount}
                  isCounting
                  decimalPlaces={4}
                  start={parseFloat(countUpAmountPrevious)}
                  end={parseFloat(countUpAmount)}
                  thousandsSeparator={','}
                  duration={1}
                />
              </TYPE.largeHeader>
              <TYPE.black fontSize={16} fontWeight={500}>
                <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px ' }}>
                  ⚡
                </span>
                {stakingInfo?.active
                  ? stakingInfo?.rewardRate
                     ?.multiply(BIG_INT_SECONDS_IN_DAY)
                      ?.toSignificant(4, { groupSeparator: ',' }) ?? '-'
                  : '0'}
                {' FESW / Day'}
              </TYPE.black>
            </RowBetween>
            {stakingInfo?.earnedAmount && JSBI.notEqual(BIG_INT_ZERO, stakingInfo?.earnedAmount?.raw) && (
                <RowBetween style={{ marginTop: "12px" }}>
                    <div/>
                    <ButtonPrimary
                      padding="8px"
                      borderRadius="8px"
                      width="50%"
                      onClick={() => setShowClaimRewardModal(true)}
                    >
                      Claim
                    </ButtonPrimary>
                </RowBetween>
              )}
          </CardSection>

          <CardSection gap="4px">
            <RowBetween>
              <TYPE.black fontWeight={400} fontSize={18}>Your liquidity deposits</TYPE.black>
            </RowBetween>
            <RowBetween style={{ alignItems: 'baseline' }}>
              <TYPE.black fontSize={36} fontWeight={600}>
                {stakingInfo?.stakedAmount?.[0].toSignificant(6) ?? '-'}
              </TYPE.black>
              <TYPE.black>
                FESP: <strong>{currencyA?.symbol}<span role="img" aria-label="party">🔗</span>{currencyB?.symbol}</strong>
              </TYPE.black>
            </RowBetween>
            <RowBetween style={{ alignItems: 'baseline' }}>
              <TYPE.black fontSize={36} fontWeight={600}>
                {stakingInfo?.stakedAmount?.[1].toSignificant(6) ?? '-'}
              </TYPE.black>
              <TYPE.black>
                FESP: <strong>{currencyB?.symbol}<span role="img" aria-label="party">🔗</span>{currencyA?.symbol}</strong>
              </TYPE.black>
            </RowBetween>
          </CardSection>

          <TYPE.main style={{ textAlign: 'center', padding: '0px 40px' }} fontSize={14}>
            <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px' }}>
              ⭐️ 
            </span>
            When you withdraw, the contract will automagically claim FESW on your behalf!
          </TYPE.main>

          {!showAddLiquidityButton && (
            <DataRow style={{ marginBottom: '1rem' }}>
              {stakingInfo && stakingInfo.active && (
                <ButtonPrimary padding="8px" borderRadius="8px" width="45%" onClick={handleDepositClick}>
                  {stakingInfo?.stakedAmount?.[0].greaterThan(JSBI.BigInt(0)) ? 'Deposit' : 'Deposit FeSwap Liquidity Tokens'}
                </ButtonPrimary>
              )}

              {stakingInfo?.stakedAmount?.[0].greaterThan(JSBI.BigInt(0)) && (
                <ButtonPrimary
                  padding="8px"
                  borderRadius="8px"
                  width="45%"
                  onClick={() => setShowUnstakingModal(true)}
                >
                 Withdraw
                </ButtonPrimary>
              )}
            </DataRow>
          )}
          {!userLiquidityUnstaked0 ? null : userLiquidityUnstaked0.equalTo('0') ? null : !stakingInfo?.active ? null : (
            <TYPE.main>{userLiquidityUnstaked0.toSignificant(6)} FESW LP tokens available</TYPE.main>
          )}
          {!userLiquidityUnstaked1 ? null : userLiquidityUnstaked1.equalTo('0') ? null : !stakingInfo?.active ? null : (
            <TYPE.main>{userLiquidityUnstaked1.toSignificant(6)} FESW LP tokens available</TYPE.main>
          )}           
        </AutoColumn>
      </StyledPositionCard>
    </PageWrapper>
  )
}