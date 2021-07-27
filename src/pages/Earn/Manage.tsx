import React, { useCallback, useState, useMemo } from 'react'
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
import { DataCard, CardNoise, Balance } from '../../components/earn/styled'
import { ButtonPrimary } from '../../components/Button'
import StakingModal from '../../components/earn/StakingModal'
import { useStakingInfo } from '../../state/stake/hooks'
import UnstakingModal from '../../components/earn/UnstakingModal'
import ClaimRewardModal from '../../components/earn/ClaimRewardModal'
import { useTokenBalance } from '../../state/wallet/hooks'
import { useActiveWeb3React } from '../../hooks'
import { useColor } from '../../hooks/useColor'
import { CountUp } from 'use-count-up'

import { wrappedCurrency, unwrappedToken } from '../../utils/wrappedCurrency'
import { currencyId } from '../../utils/currencyId'
import { useTotalSupply } from '../../data/TotalSupply'
import { usePair } from '../../data/Reserves'
import usePrevious from '../../hooks/usePrevious'
import { useUSDTPrice } from '../../utils/useUSDCPrice'
import { transparentize } from 'polished'
import { BIG_INT_ZERO, BIG_INT_SECONDS_IN_DAY } from '../../constants'
import { LightCard } from '../../components/Card'
import { ZERO } from '../../utils'

const PageWrapper = styled(AutoColumn)`
  max-width: 480px;
  width: 100%;
`

const StyledPositionCard = styled(LightCard)<{ bgColor: any }>`
  border: none;
  background: ${({ theme, bgColor }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, bgColor)} 0%, ${'#E6E6FA'} 100%) `};
  position: relative;
  overflow: hidden;
`

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
  const [currency0, currency1] = [useCurrency(currencyIdA), useCurrency(currencyIdB)]

  const token0 = wrappedCurrency(currency0 ?? undefined, chainId)
  const token1 = wrappedCurrency(currency1 ?? undefined, chainId)

  const [, stakingTokenPair] = usePair(token0, token1)
  const stakingInfo = useStakingInfo(stakingTokenPair)?.[0]

  // detect existing unstaked LP position to show add button if none found
  const userLiquidityUnstaked0 = useTokenBalance(account ?? undefined, stakingInfo?.stakedAmount?.[0].token)
  const userLiquidityUnstaked1 = useTokenBalance(account ?? undefined, stakingInfo?.stakedAmount?.[1].token)

  const isSameOrder = useMemo(() => {
    if( !token0 || !token1 || !stakingTokenPair ) return false
    return  Boolean(token0?.address?.toLowerCase() < token1?.address?.toLowerCase()) === 
              Boolean(stakingTokenPair.liquidityToken0.address.toLowerCase() < stakingTokenPair.liquidityToken1.address.toLowerCase())
    }, [token0, token1, stakingTokenPair])
 
  //const [currencyA, currencyB] = isSameOrder ? [currency0, currency1] : [currency1, currency0]
  const [currencyA, currencyB] = isSameOrder  ? [token0?unwrappedToken(token0):currency0, token1?unwrappedToken(token1):currency1] 
                                              : [token1?unwrappedToken(token1):currency1, token0?unwrappedToken(token0):currency0]

  const showAddLiquidityButton =  Boolean(stakingInfo?.stakedAmount?.[0].equalTo('0') && userLiquidityUnstaked0?.equalTo('0')) &&
                                  Boolean(stakingInfo?.stakedAmount?.[1].equalTo('0') && userLiquidityUnstaked1?.equalTo('0'))                     

  // toggle for staking modal and unstaking modal
  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [showClaimRewardModal, setShowClaimRewardModal] = useState(false)

  const token = currency0 === ETHER ? token1 : token0
  const WETH = currency0 === ETHER ? token0 : token1
  const backgroundColor = useColor(token)

  // get WETH value of staked LP tokens
  const totalSupplyOfStakingToken0 = useTotalSupply(stakingInfo?.stakedAmount?.[0].token)
  const totalSupplyOfStakingToken1 = useTotalSupply(stakingInfo?.stakedAmount?.[1].token)


  const valueOfTotalStakedAmountInWETH: TokenAmount | undefined = useMemo(() => {
    if (!totalSupplyOfStakingToken0 || !totalSupplyOfStakingToken1 || !stakingTokenPair || !stakingInfo || !WETH ) return undefined
    if(JSBI.equal(totalSupplyOfStakingToken0.raw, ZERO) && JSBI.equal(totalSupplyOfStakingToken1.raw, ZERO)) return undefined

    return new TokenAmount(
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
  }, [totalSupplyOfStakingToken0, totalSupplyOfStakingToken1, stakingTokenPair, WETH, stakingInfo])

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
                  style={{padding:'8px', borderRadius: '8px', width: 'fit-content'}}
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

      { !showAddLiquidityButton && (
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

          <AutoColumn gap="12px" style={{ marginBottom: "12px" }}>
          { ( stakingInfo?.stakedAmount?.[0].greaterThan(JSBI.BigInt(0)) ||
              stakingInfo?.stakedAmount?.[1].greaterThan(JSBI.BigInt(0)) ) && (
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
                          padding="12px"
                          borderRadius="8px"
                          width="50%"
                          onClick={() => setShowClaimRewardModal(true)}
                        >
                          Claim
                        </ButtonPrimary>
                    </RowBetween>
                  )}
              </CardSection>
            )}  

            <CardSection gap="4px">
              <RowBetween>
                <TYPE.black fontWeight={400} fontSize={18}>Your liquidity deposits</TYPE.black>
              </RowBetween>
              <RowBetween style={{ alignItems: 'baseline' }}>
                <Balance balance = {stakingInfo?.stakedAmount?.[0]} />
                <TYPE.black>
                  FESP: <strong>{currencyA?.symbol}<span role="img" aria-label="party">🔗</span>{currencyB?.symbol}</strong>
                </TYPE.black>
              </RowBetween>
              <RowBetween style={{ alignItems: 'baseline' }}>
                <Balance balance = {stakingInfo?.stakedAmount?.[1]} />
                <TYPE.black>
                  FESP: <strong>{currencyB?.symbol}<span role="img" aria-label="party">🔗</span>{currencyA?.symbol}</strong>
                </TYPE.black>
              </RowBetween>
              { ( stakingInfo?.stakedAmount?.[0].greaterThan(JSBI.BigInt(0)) ||
                  stakingInfo?.stakedAmount?.[1].greaterThan(JSBI.BigInt(0)) ) && (
                <>
                  <TYPE.main style={{ textAlign: 'center', padding: '0px 32px' }} fontSize={14}>
                    <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px' }}>
                      ⭐️ 
                    </span>
                    When you withdraw, the contract will automagically claim FESW on your behalf!
                  </TYPE.main>
                  <RowBetween style={{ marginTop: "12px" }}>
                    <div/>
                    <ButtonPrimary
                      padding="12px"
                      borderRadius="8px"
                      width="50%"
                      onClick={() => setShowUnstakingModal(true)}
                    >
                      Withdraw
                    </ButtonPrimary>
                    </RowBetween>
                  </>                  
                )}
            </CardSection>

            { ( (userLiquidityUnstaked0 &&  userLiquidityUnstaked0.greaterThan('0')) || 
                (userLiquidityUnstaked1 &&  userLiquidityUnstaked1.greaterThan('0')) ) && (
              <CardSection gap="4px">
                <RowBetween>
                  <TYPE.black fontWeight={400} fontSize={18}>Your liquidity available to deposit</TYPE.black>
                </RowBetween>
                { (userLiquidityUnstaked0 &&  userLiquidityUnstaked0.greaterThan('0')) && (
                  <RowBetween style={{ alignItems: 'baseline' }}>
                    <Balance balance = {userLiquidityUnstaked0} />
                    <TYPE.black>
                      FESP: <strong>{currencyA?.symbol}<span role="img" aria-label="party">🔗</span>{currencyB?.symbol}</strong>
                    </TYPE.black>
                  </RowBetween>
                )}
                { (userLiquidityUnstaked1 &&  userLiquidityUnstaked1.greaterThan('0')) && (
                  <RowBetween style={{ alignItems: 'baseline' }}>
                    <Balance balance = {userLiquidityUnstaked1} />
                    <TYPE.black>
                      FESP: <strong>{currencyB?.symbol}<span role="img" aria-label="party">🔗</span>{currencyA?.symbol}</strong>
                    </TYPE.black>
                  </RowBetween>
                )}
                {stakingInfo && stakingInfo.active && (
                  <RowBetween style={{ marginTop: "12px" }}>
                    <ButtonPrimary padding="12px" borderRadius="8px" width="100%" onClick={handleDepositClick}>
                      { ( stakingInfo?.stakedAmount?.[0].greaterThan(JSBI.BigInt(0)) ||
                          stakingInfo?.stakedAmount?.[1].greaterThan(JSBI.BigInt(0))  )
                        ? 'Deposit' : 'Deposit FeSwap Liquidity Tokens'}
                    </ButtonPrimary>
                  </RowBetween>
                  )}
              </CardSection>
            )}
          </AutoColumn>
        </StyledPositionCard>
      )}
    </PageWrapper>
  )
}