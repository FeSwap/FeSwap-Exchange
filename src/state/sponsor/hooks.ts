import useENS from '../../hooks/useENS'
import { CurrencyAmount, ETHER, JSBI, Token, TokenAmount, Price } from '@uniswap/sdk'
import { useSponsorContract, useFeswContract } from '../../hooks/useContract'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { isAddress, calculateGasMargin, WEI_DENOM_FRACTION } from '../../utils'
import { AppDispatch, AppState } from '../index'
import { useCurrencyBalances } from '../wallet/hooks'
import { setRecipient, typeInput } from './actions'
import { FESW } from '../../constants'
import { NEVER_RELOAD, useSingleCallResult } from '../multicall/hooks'
import { Field } from '../swap/actions'
import { tryParseAmount } from '../swap/hooks'
import { BigNumber} from 'ethers'
import { useMemo } from 'react'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { TransactionResponse } from '@ethersproject/providers'

export interface SponsorTrade {
  readonly parsedAmounts: { [field in Field]?: CurrencyAmount }
  readonly feswGiveRate: Price | undefined
}

export function useSponsorState(): AppState['sponsor'] {
  return useSelector<AppState, AppState['sponsor']>(state => state.sponsor)
}

// get if sponsor finalized
export function useSponsorFinalized(): JSBI {
  const sponsorContract = useSponsorContract()
  const { result } = useSingleCallResult(sponsorContract, 'SponsorFinalized', [])
  return result?.[0] ?? undefined
}

// get the users delegatee if it exists
export function useTotalETHReceived(): JSBI {
  const sponsorContract = useSponsorContract()
  const { result } = useSingleCallResult(sponsorContract, 'TotalETHReceived', [])
  return result?.[0] ?? undefined
}

// gets the users current votes
export function useUserVotes(): TokenAmount | undefined {
  const { account, chainId } = useActiveWeb3React()
  const uniContract = useFeswContract()

  // check for available votes
  const uni = chainId ? FESW[chainId] : undefined
  const votes = useSingleCallResult(uniContract, 'getCurrentVotes', [account ?? undefined])?.result?.[0]
  return votes && uni ? new TokenAmount(uni, votes) : undefined
}

export function useSponsorActionHandlers(): {
  onUserInput: (field: Field, typedValue: string) => void
  onChangeRecipient: (recipient: string | null) => void
} {
  const dispatch = useDispatch<AppDispatch>()

  const onUserInput = useCallback(
    (independentField: Field, typedValue: string) => {
      dispatch(typeInput({independentField, typedValue }))
    },
    [dispatch]
  )

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }))
    },
    [dispatch]
  )

  return {
    onUserInput,
    onChangeRecipient
  }
}

// from the current sponsor inputs, compute the best trade and return it.
export function useDerivedSponsorInfo(): {
  currencyBalances: { [field in Field]?: CurrencyAmount }
  parsedAmounts: { [field in Field]?: CurrencyAmount }
  feswGiveRate: Price | undefined
  inputError?: string
} {
  const { account, chainId } = useActiveWeb3React()
  const sponsorContract = useSponsorContract()

  const {
    independentField,
    typedValue,
    recipient
  } = useSponsorState()

  const inputCurrency = ETHER
  const outputCurrency = chainId ? FESW[chainId] : undefined
  const recipientLookup = useENS(recipient ?? undefined)
  const to: string | null = (recipient === null ? account : recipientLookup.address) ?? null

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    inputCurrency ?? undefined,
    outputCurrency ?? undefined
  ])

  const INITIAL_FESW_RATE_PER_ETH = useSingleCallResult(sponsorContract, 'INITIAL_FESW_RATE_PER_ETH', undefined, 
                                      NEVER_RELOAD)?.result?.[0] ?? undefined
  const FESW_CHANGE_RATE_VERSUS_ETH = useSingleCallResult(sponsorContract, 'FESW_CHANGE_RATE_VERSUS_ETH', undefined, 
                                      NEVER_RELOAD)?.result?.[0] ?? undefined

  const TotalETHReceived = useSingleCallResult(sponsorContract, 'TotalETHReceived', [])?.result?.[0] ?? undefined

  const feswGiveRate: Price | undefined = useMemo(() => {
    if( !INITIAL_FESW_RATE_PER_ETH || !FESW_CHANGE_RATE_VERSUS_ETH || !TotalETHReceived || !outputCurrency ) return undefined

    const feswGiveRateBigNumber = BigNumber.from(INITIAL_FESW_RATE_PER_ETH).mul(BigNumber.from(10).pow(18)).sub(
      BigNumber.from(TotalETHReceived).mul(BigNumber.from(FESW_CHANGE_RATE_VERSUS_ETH)))

      return new Price( inputCurrency, outputCurrency, '1000000000000000000', feswGiveRateBigNumber.toString() )

  }, [INITIAL_FESW_RATE_PER_ETH, FESW_CHANGE_RATE_VERSUS_ETH, TotalETHReceived, inputCurrency, outputCurrency])

  const isExactIn: boolean = independentField === Field.INPUT
  const dependentField: Field = isExactIn ? Field.OUTPUT : Field.INPUT

  const parsedAmount: CurrencyAmount | undefined = tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined)

  const parsedAmountInduced : CurrencyAmount | undefined = useMemo(() => {
    if(!feswGiveRate || !parsedAmount) return undefined

    return isExactIn 
            ? new TokenAmount(outputCurrency as Token, parsedAmount.multiply(WEI_DENOM_FRACTION).multiply(feswGiveRate).quotient)
            : new TokenAmount(inputCurrency as Token, parsedAmount.multiply(WEI_DENOM_FRACTION).divide(feswGiveRate.raw).quotient)
    },
    [isExactIn, inputCurrency, outputCurrency, parsedAmount, feswGiveRate]
  )

  const parsedAmounts = {
          [independentField]: parsedAmount,
          [dependentField]: parsedAmountInduced
       }

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalances[0],
    [Field.OUTPUT]: relevantTokenBalances[1]
  }

  let inputError: string | undefined
  if (!account) {
    inputError = 'Connect Wallet'
  }

  if (!parsedAmount) {
    inputError = inputError ?? 'Enter an amount'
  }

  const formattedTo = isAddress(to)
  if (!to || !formattedTo) {
    inputError = inputError ?? 'Enter a recipient'
  } 

  // compare input balance to max input based on version
  const [balanceIn, amountIn] = [
    currencyBalances[Field.INPUT],
    parsedAmounts[Field.INPUT]
  ]

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = 'Insufficient ' + amountIn.currency.symbol + ' balance'
  }

  return {
    currencyBalances,
    parsedAmounts,
    feswGiveRate,
    inputError,
  }
}

export function useSponsorCallback(
  sponsorAmount: CurrencyAmount | undefined
): {
  sponsorCallback: () => Promise<string>
} {
  // get claim data for this account
  const { library, chainId, account } = useActiveWeb3React()
  const sponsorContract = useSponsorContract()

  // used for popup summary
  const addTransaction = useTransactionAdder()

  const sponsorCallback = async function() {
    if (!sponsorAmount || !account || !library || !chainId|| !sponsorContract ) return

   return sponsorContract.estimateGas['Sponsor'](account, {}).then(estimatedGasLimit => {
      return sponsorContract
        .Sponsor(account, { value: sponsorAmount.raw, gasLimit: calculateGasMargin(estimatedGasLimit) })
        .then((response: TransactionResponse) => {
          addTransaction(response, {
            summary: `Sponsored ${sponsorAmount?.toSignificant(6)} ETH`,
          })
          return response.hash
        })
    })
  }

  return { sponsorCallback }
}
