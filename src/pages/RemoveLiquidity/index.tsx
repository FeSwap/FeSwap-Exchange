import { splitSignature } from '@ethersproject/bytes'
// import { Contract } from '@ethersproject/contracts'
import { TransactionResponse } from '@ethersproject/providers'
import { currencyEquals, ETHER, WETH, Currency, ROUTER_ADDRESS, ChainId } from '@feswap/sdk'
import React, { useCallback, useContext, useMemo, useState, useEffect } from 'react'
import { Plus } from 'react-feather'
import ReactGA from 'react-ga'
import { RouteComponentProps } from 'react-router'
import { Text } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { ButtonPrimary, ButtonLight, ButtonError, ButtonConfirmed } from '../../components/Button'
import { TransparentCard } from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import { MinimalPositionCard } from '../../components/PositionCard'
import Row, { RowBetween, RowFixed } from '../../components/Row'

import Slider from '../../components/Slider'
import CurrencyLogo from '../../components/CurrencyLogo'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { usePairContract } from '../../hooks/useContract'
import useIsArgentWallet from '../../hooks/useIsArgentWallet'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'

import { useTransactionAdder } from '../../state/transactions/hooks'
import { StyledInternalLink, TYPE } from '../../theme'
import { calculateGasMargin, calculateSlippageAmount, getRouterContract, ZERO } from '../../utils'
//import { currencyId } from '../../utils/currencyId'
import useDebouncedChangeHandler from '../../utils/useDebouncedChangeHandler'
//import { wrappedCurrency } from '../../utils/wrappedCurrency'
import AppBody from '../AppBody'
import QuestionHelper from '../../components/QuestionHelper'
import { Wrapper } from '../Pool/styleds'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import { Dots } from '../../components/swap/styleds'
import { useBurnActionHandlers } from '../../state/burn/hooks'
import { useDerivedBurnInfo, useBurnState } from '../../state/burn/hooks'
import { Field, Amount } from '../../state/burn/actions'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { Container } from '../../components/CurrencyInputPanel'
import { AdvancedDetailsFooter } from '../../components/swap/AdvancedSwapDetailsDropdown'
import { BigNumber } from '@ethersproject/bignumber'
import useCurrentBlockTimestamp from '../../hooks/useCurrentBlockTimestamp'
import { StyledPageCard } from '../../components/earn/styled'
import { Separator } from '../../components/SearchModal/styleds'

const PositionWrapper = styled.div`
  position: relative;
  padding-left: 1rem;
  padding-right: 1rem;
`

const CardWrapper = styled.div`
  display: grid;
  grid-template-columns: 3fr 6fr;
  gap: 10px;
  width: 100%;
`

const CardWrapperLiquidity = styled.div`
  display: grid;
  grid-template-columns: 4fr 12fr;
  gap: 10px;
  width: 100%;
`

const RateSplitButton = styled.button<{ width: string }>`
  padding: 2px 2px;
  background-color: ${({ theme }) => theme.bg4};
  border: 1px solid ${({ theme }) => theme.bg4};
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

interface GetRemovePercentageProps{
  value: number
  onChange: (value: number) => void
  percentage?: string
  currencyIn?: Currency
  currencyOut?: Currency
}

function GetRemovePercentage({
  value,
  onChange,
  percentage,
  currencyIn,
  currencyOut
}: GetRemovePercentageProps) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()

  return (
      <CardWrapper >
        <Row> 
          <ColumnCenter style={{ margin: '0 1 0 1em', width: '100%' }} >
            <Text fontSize={18} fontWeight={500} >
              {currencyIn?.getSymbol(chainId)}🔗{currencyOut?.getSymbol(chainId)}
            </Text>
            <Text fontSize={40} fontWeight={500} color={theme.primary1}>
              {percentage}%
            </Text>
          </ColumnCenter>
        </Row>
        <Row>
          <AutoColumn gap="4px" style={{margin: '0 20px 0 0', width: '100%' }} >
            <Slider value={value} onChange={onChange} min= {0} step={1} max={100} size={12} wwidth={'100%'} />
            <RowBetween style={{ width: '100%', marginLeft: 15, marginRight: 15, paddingBottom: '10px' }}>
              <RateSplitButton onClick={() => onChange(25)} width="15%">
                25%
              </RateSplitButton>
              <RateSplitButton onClick={() => onChange(50)} width="15%">
                50%
              </RateSplitButton>
              <RateSplitButton onClick={() => onChange(75)} width="15%">
                75%
              </RateSplitButton>
              <RateSplitButton onClick={() => onChange(100)} width="15%">
                100%
              </RateSplitButton>
            </RowBetween>
          </AutoColumn>
        </Row>
      </CardWrapper>
    )
}

interface ShowRemoveTokenAountProps {
  amountCurrencyA:  string
  amountCurrencyB:  string
  currencyA?: Currency
  currencyB?: Currency
}

function ShowRemoveTokenAount({
  amountCurrencyA,
  amountCurrencyB,
  currencyA,
  currencyB
}: ShowRemoveTokenAountProps) {
  const theme = useContext(ThemeContext)
  const { chainId } = useActiveWeb3React()

  return (
      <CardWrapperLiquidity>
        <Row style={{ margin: '0px 6px 0px 8px', alignItems: 'center'}}>
          <ColumnCenter style={{ margin: '0 1 0 0em', width: '100%' }} >
            <Text fontSize={28} fontWeight={500} color={theme.primary1}>
              Get <span role="img" aria-label="wizard-icon">💰</span>
            </Text>
          </ColumnCenter>
        </Row>
        <Row>
          <AutoColumn gap="6px" style={{width: '100%' }} >
            <RowBetween>
              <div />
              <RowFixed>
                <Text fontSize={18} fontWeight={500} style={{ marginRight: '12px' }}>
                  {amountCurrencyA}
                </Text>
                <RowFixed>
                  <CurrencyLogo currency={currencyA} style={{ marginRight: '8px' }} />
                  <Text fontSize={18} fontWeight={500} id="remove-liquidity-tokena-symbol">
                    {currencyA?.getSymbol(chainId)}
                  </Text>
                </RowFixed>
              </RowFixed>
            </RowBetween>
            <RowBetween>
              <div />
              <RowFixed>
                <Text fontSize={18} fontWeight={500} style={{ marginRight: '12px' }}>
                  {amountCurrencyB}
                </Text>
                <RowFixed style={{ margin: '0 1 0 10px'}}>
                  <CurrencyLogo currency={currencyB} style={{ marginRight: '8px' }} />
                  <Text fontSize={18} fontWeight={500} id="remove-liquidity-tokenb-symbol">
                    {currencyB?.getSymbol(chainId)}
                  </Text>
                </RowFixed>
              </RowFixed>  
            </RowBetween>
          </AutoColumn>
        </Row>
      </CardWrapperLiquidity>
    )
}

export default function RemoveLiquidity({
  history,
  match: {
    params: { currencyIdA, currencyIdB }
  }
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const [currencyA, currencyB] = [useCurrency(currencyIdA) ?? undefined, useCurrency(currencyIdB) ?? undefined]
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  // toggle wallet when disconnected
  const toggleWalletModal = useWalletModalToggle()

  // burn state
  const { Percentage_AB, Percentage_BA } = useBurnState()
  const { pair, tokenA, tokenB, noUserLiquidity, noRemoveLiquidity, parsedAmounts, error } = useDerivedBurnInfo(currencyA ?? undefined, currencyB ?? undefined)
  const { onUserInput: onSetPercentage } = useBurnActionHandlers()

   const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false) // clicked confirm

  // txn values
  const [txHash, setTxHash] = useState<string>('')
  const deadline = useTransactionDeadline()
  const blockTimestamp = useCurrentBlockTimestamp()
  const [allowedSlippage] = useUserSlippageTolerance()

  const formattedAmountsAB = useMemo(() =>{ 
    return {
        [Amount.PERCENTAGE]:  parsedAmounts[Field.PAIR_AB]?.[Amount.PERCENTAGE].toFixed(0),
        [Amount.LIQUIDITY]:   parsedAmounts[Field.PAIR_AB]?.[Amount.LIQUIDITY]?.toSignificant(6),
        [Amount.CURRENCY_A]:  parsedAmounts[Field.PAIR_AB]?.[Amount.CURRENCY_A]?.toSignificant(6),
        [Amount.CURRENCY_B]:  parsedAmounts[Field.PAIR_AB]?.[Amount.CURRENCY_B]?.toSignificant(6)
      }
    }, [parsedAmounts])

  const formattedAmountsBA = useMemo(() =>{ 
   return {
        [Amount.PERCENTAGE]:  parsedAmounts[Field.PAIR_BA]?.[Amount.PERCENTAGE].toFixed(0),
        [Amount.LIQUIDITY]:   parsedAmounts[Field.PAIR_BA]?.[Amount.LIQUIDITY]?.toSignificant(6),
        [Amount.CURRENCY_A]:  parsedAmounts[Field.PAIR_BA]?.[Amount.CURRENCY_A]?.toSignificant(6),
        [Amount.CURRENCY_B]:  parsedAmounts[Field.PAIR_BA]?.[Amount.CURRENCY_B]?.toSignificant(6)
      }
    }, [parsedAmounts])

  // pair contract
  const pairContractAB = usePairContract(parsedAmounts[Field.PAIR_AB]?.[Amount.LIQUIDITY]?.token.address)
  const pairContractBA = usePairContract(parsedAmounts[Field.PAIR_BA]?.[Amount.LIQUIDITY]?.token.address)

  // allowance handling
  const [signatureDataAB, setSignatureDataAB] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [signatureDataBA, setSignatureDataBA] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [approvalAB, approveCallbackAB] = useApproveCallback(parsedAmounts[Field.PAIR_AB]?.[Amount.LIQUIDITY], chainId ? ROUTER_ADDRESS[chainId] : undefined)
  const [approvalBA, approveCallbackBA] = useApproveCallback(parsedAmounts[Field.PAIR_BA]?.[Amount.LIQUIDITY], chainId ? ROUTER_ADDRESS[chainId] : undefined)

  // once deadline updated, check againt signatature deadline
  useEffect(() => {
      const signatureDeadline = signatureDataAB ? signatureDataAB.deadline 
                                                : signatureDataBA ? signatureDataBA.deadline : undefined
      if( !signatureDeadline || !blockTimestamp ) return 
      if( signatureDeadline < (blockTimestamp.toNumber() + 20) ) {
        if(signatureDataAB !== null) setSignatureDataAB(null) 
        if(signatureDataBA !== null) setSignatureDataBA(null)
        if(showConfirm) setShowConfirm(false)
      }
    }, [blockTimestamp, signatureDataAB, signatureDataBA, setSignatureDataAB, setSignatureDataBA, showConfirm, setShowConfirm])

  const isArgentWallet = useIsArgentWallet()

  async function onAttemptToApprove(field: Field) {
    const approveContract = (field === Field.PAIR_AB) ? pairContractAB : pairContractBA
    if (!approveContract || !pair || !library || !deadline || !chainId) throw new Error('missing dependencies')
    const liquidityAmount = (field === Field.PAIR_AB) 
                            ? parsedAmounts[Field.PAIR_AB]?.[Amount.LIQUIDITY]
                            : parsedAmounts[Field.PAIR_BA]?.[Amount.LIQUIDITY]
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    if (isArgentWallet) {
      return (field === Field.PAIR_AB) ? approveCallbackAB() :  approveCallbackBA()
    }

    // try to gather a signature for permission
    const nonce = await approveContract.nonces(account)

    const EIP712Domain = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ]
    const domain = {
      name: (chainId === ChainId.MAINNET || chainId === ChainId.RINKEBY || chainId === ChainId.ROPSTEN || 
              chainId === ChainId.GÖRLI || chainId === ChainId.KOVAN ) ? 'FeSwap' : 'FeSwap',
      version: '1',
      chainId: chainId,
      verifyingContract: liquidityAmount.token.address
    }
    const Permit = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]

    const signatureDataOther = (field === Field.PAIR_AB) ? signatureDataBA : signatureDataAB
    const permitDeadline = signatureDataOther ? signatureDataOther.deadline : deadline.toNumber() 

    const message = {
      owner: account,
      spender: ROUTER_ADDRESS[chainId],
      value: liquidityAmount.raw.toString(),
      nonce: nonce.toHexString(),
      deadline: permitDeadline
    }
    const data = JSON.stringify({
      types: {
        EIP712Domain,
        Permit
      },
      domain,
      primaryType: 'Permit',
      message
    })

    library
      .send('eth_signTypedData_v4', [account, data])
      .then(splitSignature)
      .then(signature => {
        (field === Field.PAIR_AB) 
        ? setSignatureDataAB({ v: signature.v, r: signature.r, s: signature.s, deadline: permitDeadline })
        : setSignatureDataBA({ v: signature.v, r: signature.r, s: signature.s, deadline: permitDeadline })
      })
      .catch(error => {
        // for all errors other than 4001 (EIP-1193 user rejected request), fall back to manual approve
        if (error?.code !== 4001) {
          (field === Field.PAIR_AB) ? approveCallbackAB() : approveCallbackBA()
        }
      })
  }

  // wrapped onUserInput to clear signatures
  const onUserInput = useCallback(
    (field: Field, typedValue: number) => {
      (field === Field.PAIR_AB) ? setSignatureDataAB(null) : setSignatureDataBA(null)
      onSetPercentage(field, typedValue)
    },
    [onSetPercentage]
  )

  // tx sending
  const addTransaction = useTransactionAdder()

  const {tokenAAmount, tokenBAmount} = useMemo(() => {
        const tokenAAmountAB = parsedAmounts[Field.PAIR_AB]?.[Amount.CURRENCY_A]
        const tokenBAmountAB = parsedAmounts[Field.PAIR_AB]?.[Amount.CURRENCY_B]
        const tokenAAmountBA = parsedAmounts[Field.PAIR_BA]?.[Amount.CURRENCY_A]
        const tokenBAmountBA = parsedAmounts[Field.PAIR_BA]?.[Amount.CURRENCY_B]
        const tokenAAmount =  (tokenAAmountAB && tokenAAmountBA)
                              ? tokenAAmountAB.add(tokenAAmountBA)
                              : (tokenAAmountAB)??tokenAAmountBA
        const tokenBAmount =  (tokenBAmountAB && tokenBAmountBA)
                              ? tokenBAmountAB.add(tokenBAmountBA)
                              : (tokenBAmountAB)?? tokenBAmountBA
        return {tokenAAmount, tokenBAmount}
      }, [parsedAmounts] )

  async function onRemove() {
    if (!chainId || !library || !account || !deadline || !tokenAAmount || !tokenAAmount) throw new Error('missing dependencies')
    const router = getRouterContract(chainId, library, account)

    const liquidityAmountAB = parsedAmounts[Field.PAIR_AB]?.[Amount.LIQUIDITY]
    const liquidityAmountBA = parsedAmounts[Field.PAIR_BA]?.[Amount.LIQUIDITY]
    if (!liquidityAmountAB && !liquidityAmountBA) throw new Error('missing liquidity amount')

    const amountsMin = {
      [Amount.CURRENCY_A]: tokenAAmount ? calculateSlippageAmount(tokenAAmount, allowedSlippage)[0] : ZERO ,
      [Amount.CURRENCY_B]: tokenBAmount ? calculateSlippageAmount(tokenBAmount, allowedSlippage)[0] : ZERO
    }

    const currencyBIsETH = currencyB === ETHER
    const oneCurrencyIsETH = currencyA === ETHER || currencyBIsETH

    if (!tokenA || !tokenB) throw new Error('could not wrap')

    let methodNames: string[], args: Array<string | string[] | number | boolean>
    // we have approval, use normal remove liquidity
    if( (!liquidityAmountAB || (approvalAB === ApprovalState.APPROVED)) && 
        (!liquidityAmountBA || (approvalBA === ApprovalState.APPROVED)) ) {
      // removeLiquidityETH
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETH', 'removeLiquidityETHFeeOnTransfer']

        const RemoveLiquidityParams = [ currencyBIsETH ? tokenA.address : tokenB.address,
                                        WETH[chainId].address,
                                        currencyBIsETH  ? liquidityAmountAB?.raw.toString()??'0x00'
                                                        : liquidityAmountBA?.raw.toString()??'0x00',
                                        currencyBIsETH  ? liquidityAmountBA?.raw.toString()??'0x00'
                                                        : liquidityAmountAB?.raw.toString()??'0x00',
                                        currencyBIsETH  ? amountsMin[Amount.CURRENCY_A].toString()
                                                        : amountsMin[Amount.CURRENCY_B].toString(),
                                        currencyBIsETH  ? amountsMin[Amount.CURRENCY_B].toString()
                                                        : amountsMin[Amount.CURRENCY_A].toString()
                                      ]           

        args =  [ RemoveLiquidityParams,
                  account,
                  deadline.toHexString()
                ]
      }
      // removeLiquidity
      else {
        methodNames = ['removeLiquidity']
        const RemoveLiquidityParams = [ tokenA.address,
                                        tokenB.address,
                                        liquidityAmountAB?.raw.toString()??'0x00',
                                        liquidityAmountBA?.raw.toString()??'0x00',
                                        amountsMin[Amount.CURRENCY_A].toString(),
                                        amountsMin[Amount.CURRENCY_B].toString()
                                      ]

        args = [
          RemoveLiquidityParams,
          account,
          deadline.toHexString()
        ]
      }
    }
    // we have a signataure, use permit versions of remove liquidity
    else if ((signatureDataAB !== null) || (signatureDataBA !== null)){

      const ZeroString = '0x0000000000000000000000000000000000000000000000000000000000000000'  
      const signatureZero = ['0x00', ZeroString, ZeroString]
      const signatureAB = signatureDataAB ? [ signatureDataAB.v.toString(),
                                              signatureDataAB.r,
                                              signatureDataAB.s ]
                                          : signatureZero
      const signatureBA = signatureDataBA ? [ signatureDataBA.v.toString(),
                                              signatureDataBA.r,
                                              signatureDataBA.s ]
                                          : signatureZero   
     
      const signaturPermitDeadline =  signatureDataAB 
                                      ? signatureDataBA
                                        ? signatureDataAB.deadline === signatureDataBA.deadline 
                                          ? signatureDataAB.deadline : null
                                        : signatureDataAB.deadline
                                      : signatureDataBA ? signatureDataBA.deadline : null
      if( signaturPermitDeadline === null )  throw new Error('Wrong signature deadline')                                 

      // removeLiquidityETHWithPermit
      if (oneCurrencyIsETH) {
        methodNames = ['removeLiquidityETHWithPermit', 'removeLiquidityETHWithPermitFeeOnTransfer']
        const RemoveLiquidityParams = [ currencyBIsETH ? tokenA.address : tokenB.address,
                                        WETH[chainId].address,
                                        currencyBIsETH  ? liquidityAmountAB?.raw.toString()??'0x00'
                                                        : liquidityAmountBA?.raw.toString()??'0x00',
                                        currencyBIsETH  ? liquidityAmountBA?.raw.toString()??'0x00'
                                                        : liquidityAmountAB?.raw.toString()??'0x00',
                                        currencyBIsETH  ? amountsMin[Amount.CURRENCY_A].toString()
                                                        : amountsMin[Amount.CURRENCY_B].toString(),
                                        currencyBIsETH  ? amountsMin[Amount.CURRENCY_B].toString()
                                                        : amountsMin[Amount.CURRENCY_A].toString()
                                      ]           

        args = [
          RemoveLiquidityParams,
          account,
          signaturPermitDeadline,
          false,
          currencyBIsETH ? signatureAB : signatureBA,
          currencyBIsETH ? signatureBA : signatureAB
        ]
      }
      // removeLiquidityETHWithPermit
      else {
        methodNames = ['removeLiquidityWithPermit']

        const RemoveLiquidityParams = [
          tokenA.address,
          tokenB.address,
          liquidityAmountAB?.raw.toString()??'0x00',
          liquidityAmountBA?.raw.toString()??'0x00',
          amountsMin[Amount.CURRENCY_A].toString(),
          amountsMin[Amount.CURRENCY_B].toString()
        ]

        args = [
          RemoveLiquidityParams,
          account,
          signaturPermitDeadline,
          false,
          signatureAB,
          signatureBA
        ]
      }
    } else {
      throw new Error('Attempting to confirm without approval or a signature. Please contact support.')
    }

    const safeGasEstimates: (BigNumber | undefined)[] = await Promise.all(
      methodNames.map(methodName =>
        router.estimateGas[methodName](...args)
          .then(calculateGasMargin)
          .catch(error => {
            console.error(`estimateGas failed`, methodName, args, error)
            return undefined
          })
      )
    )

    const indexOfSuccessfulEstimation = safeGasEstimates.findIndex(safeGasEstimate =>
      BigNumber.isBigNumber(safeGasEstimate)
    )

    // all estimations failed...
    if (indexOfSuccessfulEstimation === -1) {
      console.error('This transaction would fail. Please contact support.')
    } else {
      const methodName = methodNames[indexOfSuccessfulEstimation]
      const safeGasEstimate = safeGasEstimates[indexOfSuccessfulEstimation]

      setAttemptingTxn(true)
      await router[methodName](...args, {
        gasLimit: safeGasEstimate
      })
        .then((response: TransactionResponse) => {
          setAttemptingTxn(false)

          addTransaction(response, {
            summary:
              'Remove ' +
              parsedAmounts[Field.PAIR_AB]?.[Amount.CURRENCY_A]?.toSignificant(3) +
              ' ' +
              currencyA?.getSymbol(chainId) +
              ' and ' +
              parsedAmounts[Field.PAIR_AB]?.[Amount.CURRENCY_B]?.toSignificant(3) +
              ' ' +
              currencyB?.getSymbol(chainId)
          })

          setTxHash(response.hash)

          ReactGA.event({
            category: 'Liquidity',
            action: 'Remove',
            label: [currencyA?.getSymbol(chainId), currencyB?.getSymbol(chainId)].join('/')
          })
        })
        .catch((error: Error) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          console.error(error)
        })
    }
  }

  function modalHeader() {
    return (
      <AutoColumn gap={'md'} style={{ marginTop: '20px' }}>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={500}>
            {tokenAAmount?.toSignificant(6)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyA} size={'24px'} />
            <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
              {currencyA?.getSymbol(chainId)}
            </Text>
          </RowFixed>
        </RowBetween>
        <RowFixed>
          <Plus size="16" color={theme.text2} />
        </RowFixed>
        <RowBetween align="flex-end">
          <Text fontSize={24} fontWeight={500}>
            {tokenBAmount?.toSignificant(6)}
          </Text>
          <RowFixed gap="4px">
            <CurrencyLogo currency={currencyB} size={'24px'} />
            <Text fontSize={24} fontWeight={500} style={{ marginLeft: '10px' }}>
              {currencyB?.getSymbol(chainId)}
            </Text>
          </RowFixed>
        </RowBetween>

        <TYPE.italic fontSize={12} color={theme.text2} textAlign="left" padding={'12px 0 0 0'}>
          {`Output is estimated. If the price changes by more than ${allowedSlippage /
            100}% your transaction will revert.`}
        </TYPE.italic>
      </AutoColumn>
    )
  }

  function modalBottom() {
    return (
      <>
        { parsedAmounts[Field.PAIR_AB]?.[Amount.LIQUIDITY] &&
          <RowBetween>
            <Text color={theme.text2} fontWeight={500} fontSize={16}>
              {currencyA?.getSymbol(chainId)}🔗{currencyB?.getSymbol(chainId)} Burned
            </Text>
            <RowFixed>
              <DoubleCurrencyLogo currency0={currencyA} currency1={currencyB} margin={true} />
              <Text fontWeight={500} fontSize={16}>
                {parsedAmounts[Field.PAIR_AB]?.[Amount.LIQUIDITY]?.toSignificant(6)}
              </Text>
            </RowFixed>
          </RowBetween>
        }
        { parsedAmounts[Field.PAIR_BA]?.[Amount.LIQUIDITY] &&
          <RowBetween>
            <Text color={theme.text2} fontWeight={500} fontSize={16}>
              {currencyB?.getSymbol(chainId)}🔗{currencyA?.getSymbol(chainId)} Burned
            </Text>
            <RowFixed>
              <DoubleCurrencyLogo currency0={currencyB} currency1={currencyA} margin={true} />
              <Text fontWeight={500} fontSize={16}>
                {parsedAmounts[Field.PAIR_BA]?.[Amount.LIQUIDITY]?.toSignificant(6)}
              </Text>
            </RowFixed>
          </RowBetween>
        }
        {pair && (
          <>
            <RowBetween>
              <Text color={theme.text2} fontWeight={500} fontSize={16}>
                Price
              </Text>
              <Text fontWeight={500} fontSize={16} color={theme.text1}>
                1 {currencyA?.getSymbol(chainId)} = {tokenA ? pair.priceOfMean(tokenA).toSignificant(6) : '-'} {currencyB?.getSymbol(chainId)}
              </Text>
            </RowBetween>
            <RowBetween>
              <div />
              <Text fontWeight={500} fontSize={16} color={theme.text1}>
                1 {currencyB?.getSymbol(chainId)} = {tokenB ? pair.priceOfMean(tokenB).toSignificant(6) : '-'} {currencyA?.getSymbol(chainId)}
              </Text>
            </RowBetween>
          </>
        )}
        <ButtonPrimary  disabled={( !noRemoveLiquidity[Field.PAIR_AB] && signatureDataAB === null && approvalAB !== ApprovalState.APPROVED) ||
                                  ( !noRemoveLiquidity[Field.PAIR_BA] && signatureDataBA === null && approvalBA !== ApprovalState.APPROVED) }
                        onClick={onRemove} >
          <Text fontWeight={500} fontSize={20}>
            Confirm
          </Text>
        </ButtonPrimary>
      </>
    )
  }

  const pendingText = `Removing ${tokenAAmount?.toSignificant(6)} ${currencyA?.getSymbol(chainId)} and 
                        ${tokenBAmount?.toSignificant(6)} ${currencyB?.getSymbol(chainId)}`

  const oneCurrencyIsETH = currencyA === ETHER || currencyB === ETHER
  const oneCurrencyIsWETH = Boolean(
    chainId &&
      ((currencyA && currencyEquals(WETH[chainId], currencyA)) ||
        (currencyB && currencyEquals(WETH[chainId], currencyB)))
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setSignatureDataAB(null) // important that we clear signature data to avoid bad sigs
    setSignatureDataBA(null) // important that we clear signature data to avoid bad sigs
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onUserInput(Field.PAIR_AB, 0)
      onUserInput(Field.PAIR_BA, 0)
    }
    setTxHash('')
  }, [onUserInput, txHash])

  const liquidityPercentChangeCallbackAB = useCallback(
    (value: number) => {
      onUserInput(Field.PAIR_AB, value)
    }, [onUserInput]
  )

  const liquidityPercentChangeCallbackBA = useCallback(
    (value: number) => {
      onUserInput(Field.PAIR_BA, value)
    },[onUserInput]
  )

  const [innerLiquidityPercentageAB, setInnerLiquidityPercentageAB] = useDebouncedChangeHandler(
    Percentage_AB,
    liquidityPercentChangeCallbackAB
  )

  const [innerLiquidityPercentageBA, setInnerLiquidityPercentageBA] = useDebouncedChangeHandler(
    Percentage_BA,
    liquidityPercentChangeCallbackBA
  )

  //<CardNoise />
  return (
    <>
      <AppBody>
        <StyledPageCard bgColor={'red'}>
        <AddRemoveTabs creating={false} adding={false} />
        <Wrapper>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash ? txHash : ''}
            content={() => (
              <ConfirmationModalContent
                title={'You will receive'}
                onDismiss={handleDismissConfirmation}
                topContent={modalHeader}
                bottomContent={modalBottom}
              />
            )}
            pendingText={pendingText}
          />
          { (!noUserLiquidity[Field.PAIR_AB] || !noUserLiquidity[Field.PAIR_BA] )  &&
            <RowFixed  style={{ padding: '0px 0px 4px 12px' }}>
              <Text fontWeight={500}>Percentage of liquidity to remove</Text>
              <QuestionHelper text="You could remove partial liquidity by specifying the removing percantage, 
                                    and you could remove from both the liquidity sub-pools, or just one of them" />
            </RowFixed>
          }
          <AutoColumn gap="md">
            {!noUserLiquidity[Field.PAIR_AB]  &&
              <TransparentCard>
                <AutoColumn gap="4px">
                  <GetRemovePercentage  value={innerLiquidityPercentageAB} 
                                        onChange={setInnerLiquidityPercentageAB} 
                                        percentage = {formattedAmountsAB[Amount.PERCENTAGE]}
                                        currencyIn={currencyA} currencyOut={currencyB} /> 
                  <Separator />                      
                  <ShowRemoveTokenAount amountCurrencyA={formattedAmountsAB[Amount.CURRENCY_A] || ''} 
                                        amountCurrencyB={formattedAmountsAB[Amount.CURRENCY_B] || ''} 
                                        currencyA={currencyA} currencyB={currencyB} /> 
                </AutoColumn>
              </TransparentCard>
            }
            {!noUserLiquidity[Field.PAIR_BA] &&
              <TransparentCard>
                <AutoColumn gap="4px">
                  <GetRemovePercentage  value={innerLiquidityPercentageBA} 
                                        onChange={setInnerLiquidityPercentageBA} 
                                        percentage = {formattedAmountsBA[Amount.PERCENTAGE]}
                                        currencyIn={currencyB} currencyOut={currencyA} /> 
                  <Separator />
                  <ShowRemoveTokenAount amountCurrencyA={formattedAmountsBA[Amount.CURRENCY_A] || ''} 
                                        amountCurrencyB={formattedAmountsBA[Amount.CURRENCY_B] || ''} 
                                        currencyA={currencyA} currencyB={currencyB} /> 
                </AutoColumn>
              </TransparentCard>
            }
            {pair && (
              <div style={{ padding: '10px 20px' }}>
                <RowBetween>
                  <RowFixed>
                    <Text fontWeight={500}>Price:</Text>
                    <QuestionHelper text="The price is the average price of the two liquidity sub-pools." />
                  </RowFixed>
                  <RowFixed>
                    1 {currencyA?.getSymbol(chainId)} = {tokenA ? pair.priceOfMean(tokenA).toSignificant(6) : '-'} {currencyB?.getSymbol(chainId)}
                  </RowFixed>
                </RowBetween>
                <RowBetween>
                  <div />
                  <div>
                    1 {currencyB?.getSymbol(chainId)} = {tokenB ? pair.priceOfMean(tokenB).toSignificant(6) : '-'} {currencyA?.getSymbol(chainId)}
                  </div>
                </RowBetween>
                {chainId && (oneCurrencyIsWETH || oneCurrencyIsETH) ? (
                  <RowBetween style={{ justifyContent: 'flex-end' }}>
                    {oneCurrencyIsETH ? (
                      <StyledInternalLink
                        to={`/remove/${currencyA === ETHER ? WETH[chainId].address : currencyIdA}/${
                              currencyB === ETHER ? WETH[chainId].address : currencyIdB}`}
                      >
              		      Receive W{Currency.getNativeCurrencySymbol(chainId)}
                      </StyledInternalLink>
                    ) : oneCurrencyIsWETH ? (
                      <StyledInternalLink
                        to={`/remove/${currencyA && currencyEquals(currencyA, WETH[chainId]) ? 'ETH' : currencyIdA}/${
                              currencyB && currencyEquals(currencyB, WETH[chainId]) ? 'ETH' : currencyIdB}`}
                      >
                        Receive {Currency.getNativeCurrencySymbol(chainId)}
                      </StyledInternalLink>
                    ) : null}
                  </RowBetween>
                ) : null}
              </div>
            )}

            <div style={{ position: 'relative' }}>
              {!account ? (
                <ButtonLight onClick={toggleWalletModal}>Connect Wallet</ButtonLight>
              ) : (
                <AutoColumn gap="10px">
                  { !noRemoveLiquidity[Field.PAIR_AB] && 
                    <ButtonConfirmed
                    onClick={() => { onAttemptToApprove(Field.PAIR_AB) } }
                      confirmed={approvalAB === ApprovalState.APPROVED || signatureDataAB !== null}
                      disabled={approvalAB !== ApprovalState.NOT_APPROVED || signatureDataAB !== null}
                      mr="0.5rem"
                      fontWeight={500}
                      fontSize={20}
                    >
                      {approvalAB === ApprovalState.PENDING ? (
                        <Dots>Approving {currencyA?.getSymbol(chainId)}🔗{currencyB?.getSymbol(chainId)}</Dots>
                      ) : approvalAB === ApprovalState.APPROVED || signatureDataAB !== null ? (
                        `${currencyA?.getSymbol(chainId)}🔗${currencyB?.getSymbol(chainId)} Approved`
                      ) : (
                        `Approve ${currencyA?.getSymbol(chainId)}🔗${currencyB?.getSymbol(chainId)}`
                      )}
                    </ButtonConfirmed>
                  }
                  { !noRemoveLiquidity[Field.PAIR_BA] && 
                    <ButtonConfirmed
                      onClick={() => { onAttemptToApprove(Field.PAIR_BA) } }
                      confirmed={approvalBA === ApprovalState.APPROVED || signatureDataBA !== null}
                      disabled={approvalBA !== ApprovalState.NOT_APPROVED || signatureDataBA !== null}
                      mr="0.5rem"
                      fontWeight={500}
                      fontSize={20}
                    >
                      {approvalBA === ApprovalState.PENDING ? (
                        <Dots>Approving {currencyB?.getSymbol(chainId)}🔗{currencyA?.getSymbol(chainId)}</Dots>
                      ) : approvalBA === ApprovalState.APPROVED || signatureDataBA !== null ? (
                        `${currencyB?.getSymbol(chainId)}🔗${currencyA?.getSymbol(chainId)} Approved`
                      ) : (
                        `Approve ${currencyB?.getSymbol(chainId)}🔗${currencyA?.getSymbol(chainId)}`
                      )}
                    </ButtonConfirmed>
                  }
                  <ButtonError
                    onClick={() => { setShowConfirm(true) } }
                    disabled={  !isValid || 
                                ( !noRemoveLiquidity[Field.PAIR_AB] && signatureDataAB === null && approvalAB !== ApprovalState.APPROVED) ||
                                ( !noRemoveLiquidity[Field.PAIR_BA] && signatureDataBA === null && approvalBA !== ApprovalState.APPROVED) }
                    error={!isValid && (!noRemoveLiquidity[Field.PAIR_AB] || !noRemoveLiquidity[Field.PAIR_BA])}
                  >
                    <Text fontSize={20} fontWeight={500}>
                      {error || 'Remove'}
                    </Text>
                  </ButtonError>
                </AutoColumn>
              )}
            </div>
          </AutoColumn>
        </Wrapper>
        </StyledPageCard>
      </AppBody>

      {pair ? (
        <AdvancedDetailsFooter show={true}>
          <PositionWrapper>
            <Container hideInput={false}>
              <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} tokenA= {tokenA} pair={pair} />
            </Container>
          </PositionWrapper>
        </AdvancedDetailsFooter>
      ) : null}
    </>
  )
}
