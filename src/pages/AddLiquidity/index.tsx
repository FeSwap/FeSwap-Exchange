import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, currencyEquals, ETHER, TokenAmount, WETH } from '@feswap/sdk'
import React, { useCallback, useContext, useState } from 'react'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import { BlueCard, TransparentCard, LightGreyCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { AddRemoveTabs } from '../../components/NavigationTabs'
//import PageHeader from '../../components/PageHeader'
//import {SettingsIcon} from '../../components/Settings'
import { MinimalPositionCard } from '../../components/PositionCard'
import Row, { RowBetween, RowFixed } from '../../components/Row'

import { FESW_ROUTER_ADDRESS } from '../../constants'
import { PairState } from '../../data/Reserves'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/mint/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from '../../state/mint/hooks'

import { useTransactionAdder } from '../../state/transactions/hooks'
import { useIsExpertMode, useUserSlippageTolerance } from '../../state/user/hooks'
import { TYPE } from '../../theme'
import { ZERO_FRACTION, calculateGasMargin, calculateSlippageAmount, getRouterContract } from '../../utils'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import AppBody from '../AppBody'
import { Dots, Wrapper } from '../Pool/styleds'
import { ConfirmAddModalBottom } from './ConfirmAddModalBottom'
import { currencyId } from '../../utils/currencyId'
import { PoolPriceBar } from './PoolPriceBar'
import Slider from '../../components/Slider'
import QuestionHelper from '../../components/QuestionHelper'
import { Container } from '../../components/CurrencyInputPanel'
import { AdvancedDetailsFooter } from '../../components/swap/AdvancedSwapDetailsDropdown'
import { Link2, Plus } from 'react-feather'
import { StyledPageCard } from '../../components/earn/styled'

const CardWrapper = styled.div`
  display: grid;
  grid-template-columns: 2fr 6fr;
  gap: 20px;
  width: 100%;
`

const PositionWrapper = styled.div`
  position: relative;
  padding-left: 1rem;
  padding-right: 1rem;
`

const RateSplitButton = styled.button<{ width: string }>`
  padding: 2px 2px;
  background-color: ${({ theme }) => theme.bg3};
  border: 1px solid ${({ theme }) => theme.bg5};
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  overflow: hidden;
  :hover {
    border: 1px solid ${({ theme }) => theme.primary1};
  }
  :focus {
    border: 1px solid ${({ theme }) => theme.primary1};
    outline: none;
  }
`


export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB }
  },
  history
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  const tokenA = wrappedCurrency(currencyA??undefined, chainId)

  const oneCurrencyIsWETH = Boolean(
    chainId &&
      ((currencyA && currencyEquals(currencyA, WETH[chainId])) ||
        (currencyB && currencyEquals(currencyB, WETH[chainId])))
  )

  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected

  const expertMode = useIsExpertMode()

  // mint state
  const { independentField, typedValue, otherTypedValue, rateSplit } = useMintState()
  const {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    meanPrice,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    percentProposal,
    error
  } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined)
  const { onFieldAInput, onFieldBInput, onSetSplitRate } = useMintActionHandlers(noLiquidity)

  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? ''
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field])
      }
    },
    {}
  )

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0')
      }
    },
    {}
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], FESW_ROUTER_ADDRESS)
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], FESW_ROUTER_ADDRESS)

  const addTransaction = useTransactionAdder()

  async function onAdd() {
    if (!chainId || !library || !account) return
    const router = getRouterContract(chainId, library, account)

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts
    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB || !deadline) {
      return
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0]
    }

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null
    if (currencyA === ETHER || currencyB === ETHER) {
      const tokenBIsETH = currencyB === ETHER
      estimate = router.estimateGas.addLiquidityETH
      method = router.addLiquidityETH

      const addLiquidityETHParams =  [
            wrappedCurrency(tokenBIsETH ? currencyA : currencyB, chainId)?.address ?? '',     // token
            (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(),                     // token desired
            amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(),         // token min
            amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(),         // eth min
            tokenBIsETH ? rateSplit.toString(): (100-rateSplit).toString()                    // split rate
        ]

      args = [addLiquidityETHParams, account, deadline.toHexString()]
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).raw.toString())
    } else {
      estimate = router.estimateGas.addLiquidity
      method = router.addLiquidity
      const addLiquidityParams =  [
        wrappedCurrency(currencyA, chainId)?.address ?? '',                               // tokenA
        wrappedCurrency(currencyB, chainId)?.address ?? '',                               // tokenB
        parsedAmountA.raw.toString(),                                                     // amountADesired
        parsedAmountB.raw.toString(),                                                     // amountBDesired
        amountsMin[Field.CURRENCY_A].toString(),                                          // amountAMin
        amountsMin[Field.CURRENCY_B].toString(),                                          // amountBMin
        rateSplit.toString(),                                                             // split rate
      ]
      args = [addLiquidityParams, account, deadline.toHexString()]
      value = null
    }

    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary:
              'Add ' +
              parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
              ' ' +
              currencies[Field.CURRENCY_A]?.symbol +
              ' and ' +
              parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
              ' ' +
              currencies[Field.CURRENCY_B]?.symbol +
              'with the ratio ' + rateSplit.toString() + ':' + (100-rateSplit).toString()
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Add',
            label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/')
          })
        })
      )
      .catch(error => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }

  const modalHeader = () => {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}  >
        { liquidityMinted?.[Field.CURRENCY_A]?.greaterThan(ZERO_FRACTION) &&
          <RowBetween align="flex-end" style={{ padding: '12px 0px 6px 0px' }} >
              <Text fontSize="36px" fontWeight={500} lineHeight="42px" marginRight={10}>
                {liquidityMinted?.[Field.CURRENCY_A]?.toSignificant(6)}
              </Text>
              <RowFixed>
                <DoubleCurrencyLogo currency0={currencies[Field.CURRENCY_A]} 
                                    currency1={currencies[Field.CURRENCY_B]} size={24} />
                <Text fontWeight={500} fontSize={24} style={{ margin: '0 0 0 6px' }} >
                  {currencies[Field.CURRENCY_A]?.symbol}
                </Text>
                <Link2 fontSize={'20px'} color={theme.primary1} style={{ margin: '0 2px 0 2px' }} />
                <Text fontWeight={500} fontSize={24} >
                  {currencies[Field.CURRENCY_B]?.symbol}
                </Text>
              </RowFixed>
          </RowBetween> }
        { liquidityMinted?.[Field.CURRENCY_A]?.greaterThan(ZERO_FRACTION) &&
          liquidityMinted?.[Field.CURRENCY_B]?.greaterThan(ZERO_FRACTION) &&
          <ColumnCenter>
            <Plus size="24" color={theme.text2} style={{ marginLeft: '4px', minWidth: '16px' }} />
          </ColumnCenter> }
        { liquidityMinted?.[Field.CURRENCY_B]?.greaterThan(ZERO_FRACTION) &&
          <RowBetween align="flex-end" style={{ padding: '12px 0px 6px 0px' }} >
              <Text fontSize="36px" fontWeight={500} lineHeight="42px" marginRight={10}>
                {liquidityMinted?.[Field.CURRENCY_B]?.toSignificant(6)}
              </Text>
              <RowFixed>
                <DoubleCurrencyLogo currency0={currencies[Field.CURRENCY_B]} 
                                    currency1={currencies[Field.CURRENCY_A]} size={24} />
                <Text fontWeight={500} fontSize={24} style={{ margin: '0 0 0 6px' }} >
                  {currencies[Field.CURRENCY_B]?.symbol}
                </Text>
                <Link2 fontSize={'20px'} color={theme.primary1} style={{ margin: '0 2px 0 2px' }} />
                <Text fontWeight={500} fontSize={24} >
                  {currencies[Field.CURRENCY_A]?.symbol}
                </Text>
              </RowFixed>
          </RowBetween> }
        <TYPE.italic fontSize={12} textAlign="left" padding={'8px 0 0 0 '}>
          {`Output is estimated. If the price changes by more than ${allowedSlippage /
            100}% your transaction will revert.`}
        </TYPE.italic>
      </AutoColumn>
    )
  }

  const modalBottom = () => {
    return (
      <ConfirmAddModalBottom
        price={meanPrice}
        currencies={currencies}
        parsedAmounts={parsedAmounts}
        noLiquidity={noLiquidity}
        onAdd={onAdd}
        poolTokenPercentage={poolTokenPercentage}
      />
    )
  }

  const pendingText = `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
    currencies[Field.CURRENCY_A]?.symbol
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${currencies[Field.CURRENCY_B]?.symbol}`

  const handleCurrencyASelect = useCallback(
    (currencyA: Currency) => {
      const newCurrencyIdA = currencyId(currencyA)
      if (newCurrencyIdA === currencyIdB) {
        history.push(`/add/${currencyIdB}/${currencyIdA}`)
        onSetSplitRate(100-rateSplit)
      } else {
        if(currencyIdB){
          history.push(`/add/${newCurrencyIdA}/${currencyIdB}`)
        } else {
          history.push(`/add/${newCurrencyIdA}`)
        }
      }
    },
    [currencyIdB, history, currencyIdA, onSetSplitRate, rateSplit]
  )
  const handleCurrencyBSelect = useCallback(
    (currencyB: Currency) => {
      const newCurrencyIdB = currencyId(currencyB)
      if (currencyIdA === newCurrencyIdB) {
        if (currencyIdB) {
          history.push(`/add/${currencyIdB}/${newCurrencyIdB}`)
          onSetSplitRate(100-rateSplit)
        } else {
          history.push(`/add/ETH/${newCurrencyIdB}`)
        }
      } else {
        history.push(`/add/${currencyIdA ? currencyIdA : 'ETH'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, history, currencyIdB, onSetSplitRate, rateSplit]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash('')
  }, [onFieldAInput, txHash])

  const isCreate = history.location.pathname.includes('/create')

  //<CardNoise />    background: url(${noise});
  return (
    <>
      <AppBody>
        <StyledPageCard bgColor={'red'}>
        <AddRemoveTabs creating={isCreate} adding={true} />
        <Wrapper>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash}
            content={() => (
              <ConfirmationModalContent
                title={'You will receive pool tokens'}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )}
            pendingText={pendingText}
          />
          <AutoColumn gap={'md'}>
            { (pairState === PairState.EXISTS && noLiquidity) && (
                <ColumnCenter>
                  <BlueCard>
                    <AutoColumn gap="6px">
                      <TYPE.link fontWeight={600} color={'primaryText1'}>
                        You are the first liquidity provider.
                      </TYPE.link>
                      <TYPE.link fontWeight={400} color={'primaryText1'}>
                        The ratio of tokens you add will set the price of this pool.
                        Once you are happy with the rate click supply to review.
                      </TYPE.link>
                    </AutoColumn>
                  </BlueCard>
                </ColumnCenter>
              )}
            <CurrencyInputPanel
              label='Token A Liquidity'
              value={formattedAmounts[Field.CURRENCY_A]}
              onUserInput={onFieldAInput}
              onMax={() => {
                onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
              }}
              onCurrencySelect={handleCurrencyASelect}
              showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
              currency={currencies[Field.CURRENCY_A]}
              id="add-liquidity-input-tokena"
              showCommonBases
            />
            <ColumnCenter>
              <Plus size="16" color={theme.text2} />
            </ColumnCenter>
            <CurrencyInputPanel
              label='Token B Liquidity'
              value={formattedAmounts[Field.CURRENCY_B]}
              onUserInput={onFieldBInput}
              onCurrencySelect={handleCurrencyBSelect}
              onMax={() => {
                onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
              }}
              showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
              currency={currencies[Field.CURRENCY_B]}
              id="add-liquidity-input-tokenb"
              showCommonBases
            />

            {pairState === PairState.EXISTS && 
              <Container hideInput={false}>
                <AutoColumn gap="6px">
                  <Row style={{ margin: '6px 0px 0px 8px', alignItems: 'center' }}>
                    <TYPE.body fontWeight={500} fontSize={15} color={theme.text2}>
                      Ratio to split liquidity
                    </TYPE.body>
                    <QuestionHelper text="Your liquidity will be provided to two sub-pools, pool A->B, and pool B->A. 
                                          You could specify the split ratio of the total liquidty, or just click 🔨 to use the
                                          ratio recommended by the system. 
                                          You could also provide liquidity solely to anyone of the sub-pools."/>
                  </Row>
                  <CardWrapper >
                    <Row style={{ margin: '0px 6px 0px 8px', alignItems: 'center'}}>
                      <ColumnCenter style={{ margin: '0 1 0 1em', width: '100%' }} >
                        <Text fontSize={16} fontWeight={500} color={theme.primary1}>
                          A-B : B-A
                        </Text>
                        <Text fontSize={32} fontWeight={500} color={theme.primary1}>
                          {rateSplit}:{100-rateSplit}
                        </Text>
                      </ColumnCenter>
                    </Row>
                    <Row style={{ margin: '0 0.5 0 1em', alignItems: 'center' }}>
                      <AutoColumn gap="2px" style={{ margin: '0 1 0 1em', width: '100%' }} >
                        <Slider value={rateSplit} onChange={onSetSplitRate} min= {0} step={1} max={100} size={12}/>
                          <RowBetween style={{ width: '90%', marginLeft: 15, marginRight: 15, paddingBottom: '10px' }}>
                            <RateSplitButton onClick={() => onSetSplitRate(20)} width="15%">
                              20%
                            </RateSplitButton>
                            <RateSplitButton onClick={() => onSetSplitRate(40)} width="15%">
                              40%
                            </RateSplitButton>
                            <RateSplitButton onClick={() => onSetSplitRate(50)} width="15%">
                              50%
                            </RateSplitButton>
                            <RateSplitButton onClick={() => onSetSplitRate(60)} width="15%">
                              60%
                            </RateSplitButton>
                            <RateSplitButton onClick={() => onSetSplitRate(80)} width="15%">
                              80%
                            </RateSplitButton>
                            <RateSplitButton onClick={() => onSetSplitRate(percentProposal)} width="15%">
                              <span role="img" aria-label="wizard-icon">
                                🔨
                              </span>
                            </RateSplitButton>
                          </RowBetween>
                      </AutoColumn>
                    </Row>
                  </CardWrapper>
                </AutoColumn>
              </Container>
            }

            {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && pairState === PairState.EXISTS && (
              <>
                <TransparentCard padding="0px" borderRadius={'8px'}>
                  <RowBetween padding="0.75rem 1rem 0.75rem 1rem">
                    <TYPE.body fontWeight={500} fontSize={15} color={theme.text2}>
                      {noLiquidity ? 'Initial prices' : 'Prices'} and pool share
                    </TYPE.body>
                  </RowBetween>
                  <LightGreyCard padding="8px 0px" borderRadius={'8px'}>
                    <PoolPriceBar
                      currencies={currencies}
                      poolTokenPercentage={poolTokenPercentage}
                      noLiquidity={noLiquidity}
                      price={price}
                    />
                  </LightGreyCard>
                </TransparentCard>
              </>
            )}

            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
            ) : (
              <AutoColumn gap={'md'}>
                {(approvalA === ApprovalState.NOT_APPROVED ||
                  approvalA === ApprovalState.PENDING ||
                  approvalB === ApprovalState.NOT_APPROVED ||
                  approvalB === ApprovalState.PENDING) &&
                  isValid && (
                    <RowBetween>
                      {approvalA !== ApprovalState.APPROVED && (
                        <ButtonPrimary
                          onClick={approveACallback}
                          disabled={approvalA === ApprovalState.PENDING}
                          width={approvalB !== ApprovalState.APPROVED ? '48%' : '100%'}
                        >
                          {approvalA === ApprovalState.PENDING ? (
                            <Dots>Approving {currencies[Field.CURRENCY_A]?.symbol}</Dots>
                          ) : (
                            'Approve ' + currencies[Field.CURRENCY_A]?.symbol
                          )}
                        </ButtonPrimary>
                      )}
                      {approvalB !== ApprovalState.APPROVED && (
                        <ButtonPrimary
                          onClick={approveBCallback}
                          disabled={approvalB === ApprovalState.PENDING}
                          width={approvalA !== ApprovalState.APPROVED ? '48%' : '100%'}
                        >
                          {approvalB === ApprovalState.PENDING ? (
                            <Dots>Approving {currencies[Field.CURRENCY_B]?.symbol}</Dots>
                          ) : (
                            'Approve ' + currencies[Field.CURRENCY_B]?.symbol
                          )}
                        </ButtonPrimary>
                      )}
                    </RowBetween>
                  )}
                <ButtonError
                  onClick={() => {
                    expertMode ? onAdd() : setShowConfirm(true)
                  }}
                  disabled={!isValid || approvalA !== ApprovalState.APPROVED || approvalB !== ApprovalState.APPROVED}
                  error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                >
                  <Text fontSize={20} fontWeight={500}>
                    {error ?? 'Supply'}
                  </Text>
                </ButtonError>
              </AutoColumn>
            )}
          </AutoColumn>
        </Wrapper>
        </StyledPageCard>
      </AppBody>
      
      {pair && tokenA && !noLiquidity && pairState !== PairState.INVALID ? (
          <AdvancedDetailsFooter show={true}>
            <PositionWrapper>
                <Container hideInput={false}>
                  <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} tokenA={tokenA} pair={pair} />
                </Container>
            </PositionWrapper>
          </AdvancedDetailsFooter>
        ) : null}

    </>
  )
}

