import React, { useMemo } from 'react'
import { RowBetween } from '../Row'
import styled from 'styled-components'
import { TYPE, StyledInternalLink } from '../../theme'
import DoubleCurrencyLogo from '../DoubleLogo'
import { ETHER, WETH, WETH9, JSBI, TokenAmount, NATIVE, ChainId, Fraction } from '@feswap/sdk'
import { ButtonPrimary } from '../Button'
import { StakingInfo } from '../../state/stake/hooks'
import { useColor } from '../../hooks/useColor'
import { currencyId } from '../../utils/currencyId'
import { CardNoise, StyledPositionCard } from './styled'
//import { unwrappedToken } from '../../utils/wrappedCurrency'
import { useTotalSupply } from '../../data/TotalSupply'
import { usePair } from '../../data/Reserves'
import useUSDCPrice  from '../../utils/useUSDCPrice'
import { USDC } from '../../constants'
import { BIG_INT_SECONDS_IN_DAY } from '../../constants'
import { ZERO, ZERO_FRACTION } from '../../utils'
import { SeparatorBlack } from '../SearchModal/styleds'
import { useCurrencyFromToken } from '../../hooks/Tokens'
import { Countdown } from './Countdown'
import { useActiveWeb3React } from '../../hooks'
import { FESW } from '../../constants'

const StatContainer = styled.div`
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 1rem;
  margin-right: 1rem;
  margin-left: 1rem;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const TopSection = styled.div`
  display: grid;
  grid-template-columns: 48px 1fr 120px;
  grid-gap: 0px;
  align-items: center;
  padding: 1rem;
  z-index: 1;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 48px 1fr 96px;
  `};
`

const BottomSection = styled.div<{ showBackground: boolean }>`
  padding: 12px 16px;
  opacity: ${({ showBackground }) => (showBackground ? '1' : '0.4')};
  border-radius: 0 0 12px 12px;
  display: flex;
  flex-direction: row;
  align-items: baseline;
  justify-content: space-between;
  z-index: 1;
`

export default function PoolCard({ stakingInfo }: { stakingInfo: StakingInfo }) {
  const { chainId } = useActiveWeb3React()
  const GORV_TOKEN_NAME = chainId ? FESW[chainId].symbol : 'FESW'
  const NATIVE_SYMBOL = chainId ? NATIVE[chainId].symbol : 'ETH'

  const token0 = stakingInfo.tokens[0]
  const token1 = stakingInfo.tokens[1]

  const currency0 = useCurrencyFromToken(token0)??undefined
  const currency1 = useCurrencyFromToken(token1)??undefined

  const stakedAmountAll: JSBI = JSBI.add(stakingInfo.stakedAmount[0].raw, stakingInfo.stakedAmount[1].raw)
  const isStaking = JSBI.greaterThan(stakedAmountAll, ZERO)
  const Usdc = USDC[chainId??ChainId.MAINNET]

  // get the color of the token
  const [WBASE, token] = (currency0 === ETHER) 
                          ? [token0, token1]
                          : (currency1 === ETHER)
                            ? [token1, token0]
                            : (token0.address === WETH9[chainId??ChainId.MATIC].address) 
                              ? [token0, token1] 
                              : (token1.address === WETH9[chainId??ChainId.MATIC].address)
                                ? [token1, token0]
                                : (token0.address === Usdc.address)
                                  ? [token0, token1]
                                  : [token1, token0]

  const backgroundColor = useColor(token)

  // get WETH value of staked LP tokens
  const totalSupplyOfStakingToken0 = useTotalSupply(stakingInfo?.stakedAmount?.[0].token)
  const totalSupplyOfStakingToken1 = useTotalSupply(stakingInfo?.stakedAmount?.[1].token)

  const [, stakingTokenPair] = usePair(...stakingInfo.tokens)
  const fixByteNum = ((chainId === ChainId.MATIC) || (chainId === ChainId.MATIC_TESTNET)) ? 6 : 4 

  // let returnOverMonth: Percent = new Percent('0')
  const valueOfTotalStakedAmountInWBASE: TokenAmount | undefined = useMemo(() => {
    if (!totalSupplyOfStakingToken0 || !totalSupplyOfStakingToken1 || !stakingTokenPair) return undefined
    if(JSBI.equal(totalSupplyOfStakingToken0.raw, ZERO) && JSBI.equal(totalSupplyOfStakingToken1.raw, ZERO)) return undefined

    return new TokenAmount(
      WBASE,
      JSBI.divide(
        JSBI.multiply(
          JSBI.multiply(JSBI.add(stakingInfo.totalStakedAmount[0].raw, stakingInfo.totalStakedAmount[1].raw), 
                        JSBI.add(stakingTokenPair.reserveOfOutput(WBASE).raw, stakingTokenPair.reserveOfInput(WBASE).raw)),
          JSBI.BigInt(2) // this is b/c the value of LP shares are ~double the value of the WETH they entitle owner to
        ),
        JSBI.add(totalSupplyOfStakingToken0.raw, totalSupplyOfStakingToken1.raw)
      )
    )
  }, [totalSupplyOfStakingToken0, totalSupplyOfStakingToken1, stakingTokenPair, WBASE, stakingInfo])

  // get the USD value of staked WETH
  const USDT_WBASEPrice = useUSDCPrice(WBASE)
  const USDT_WETHPrice = useUSDCPrice(WETH[chainId??ChainId.MAINNET])

  const valueOfTotalStakedAmountInWETH: TokenAmount | undefined = useMemo(() => {
    if(!chainId) return undefined
    if (WBASE === WETH[chainId]) return valueOfTotalStakedAmountInWBASE;
    if(!USDT_WBASEPrice || !USDT_WETHPrice || !valueOfTotalStakedAmountInWBASE) return undefined
    const rawTotalStakedAmountInWBASE = new Fraction(valueOfTotalStakedAmountInWBASE.raw)
    if(WBASE.address === Usdc.address) {
      return new TokenAmount( WETH[chainId], 
        rawTotalStakedAmountInWBASE.divide(USDT_WETHPrice).quotient)
    }
    return new TokenAmount( WBASE, 
        rawTotalStakedAmountInWBASE.multiply(USDT_WBASEPrice.divide(USDT_WETHPrice)).quotient)
    }, [chainId, WBASE, USDT_WETHPrice, USDT_WBASEPrice, Usdc, valueOfTotalStakedAmountInWBASE])

  const valueOfTotalStakedAmountInUSDT = useMemo(() => {
      if( !valueOfTotalStakedAmountInWBASE || !USDT_WBASEPrice ) return undefined
      if( USDT_WBASEPrice.equalTo(ZERO_FRACTION) ) return undefined
      return USDT_WBASEPrice.quote(valueOfTotalStakedAmountInWBASE)
    }, [USDT_WBASEPrice, valueOfTotalStakedAmountInWBASE])
  
  return (
      <StyledPositionCard bgColor={backgroundColor}>
        <CardNoise />
        <TopSection>
          <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={24} />
          <TYPE.black fontWeight={600} fontSize={24} style={{ marginLeft: '8px' }}>
            {currency0?.getSymbol(chainId)}🔗{currency1?.getSymbol(chainId)}
          </TYPE.black>
          <StyledInternalLink to={`/fesw/${currencyId(currency0)}/${currencyId(currency1)}`} style={{ width: '100%' }}>
            <ButtonPrimary padding="8px" borderRadius="8px">
              {isStaking ? 'Manage' : 'Mine'}
            </ButtonPrimary>
          </StyledInternalLink>
        </TopSection>
        <StatContainer>
          <RowBetween>
            <TYPE.black>Total deposited equivalent</TYPE.black>
            <TYPE.black>
              {`${valueOfTotalStakedAmountInWETH?.toSignificant(fixByteNum, { groupSeparator: ',' }) ?? '-'} ${NATIVE_SYMBOL}`}
            </TYPE.black>
          </RowBetween>
          
          { !!USDT_WBASEPrice && valueOfTotalStakedAmountInUSDT?.greaterThan(ZERO) && (
            <RowBetween>
              <div/>
              <TYPE.black>
                {`$ ${valueOfTotalStakedAmountInUSDT?.toFixed(2, { groupSeparator: ',' })}`}
              </TYPE.black>
            </RowBetween>
          )}

          <RowBetween>
            <TYPE.black> Pool mining rate </TYPE.black>
            <TYPE.black>
              {stakingInfo
                ? stakingInfo.active
                  ? `${stakingInfo.totalRewardRate
                      ?.multiply(BIG_INT_SECONDS_IN_DAY)
                      ?.toFixed(0, { groupSeparator: ',' })} ${GORV_TOKEN_NAME} / Day`
                  : `0 ${GORV_TOKEN_NAME} / Day`
                : '-'}
            </TYPE.black>
          </RowBetween>
          <Countdown exactEnd={stakingInfo.periodFinish} />
        </StatContainer>

        {isStaking && (
          <>
            <SeparatorBlack />
            <BottomSection showBackground={true}>
              <TYPE.black color={'black'} fontWeight={500}>
                <span>Your mining rate</span>
              </TYPE.black>
              <TYPE.black style={{ textAlign: 'right' }} color={'black'} fontWeight={500}>
                <span role="img" aria-label="wizard-icon" style={{ marginRight: '0.5rem' }}>
                  ⚡
                </span>
                {stakingInfo
                  ? stakingInfo.active
                    ? `${stakingInfo.rewardRate
                        ?.multiply(BIG_INT_SECONDS_IN_DAY)
                        ?.toSignificant(4, { groupSeparator: ',' })} ${GORV_TOKEN_NAME} / Day`
                    : `0 ${GORV_TOKEN_NAME} / Day`
                  : '-'}
              </TYPE.black>
            </BottomSection>
          </>
        )}
      </StyledPositionCard>
  )
}
