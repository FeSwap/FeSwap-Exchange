import React, { useState, useCallback, useMemo } from 'react'
import useIsArgentWallet from '../../hooks/useIsArgentWallet'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import Modal from '../Modal'
import { AutoColumn } from '../Column'
import styled from 'styled-components'
import { RowBetween, RowFixed } from '../Row'
import { TYPE, CloseIcon } from '../../theme'
import { ButtonConfirmed, ButtonError } from '../Button'
import CurrencyInputPanel from '../CurrencyInputPanel'
import { TokenAmount, Pair, WETH, ChainId } from '@feswap/sdk'
import { useActiveWeb3React } from '../../hooks'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { usePairContract, useStakingContract } from '../../hooks/useContract'
import { useApproveCallback, ApprovalState } from '../../hooks/useApproveCallback'
import { splitSignature } from 'ethers/lib/utils'
import { StakingInfo, useDerivedStakeInfo } from '../../state/stake/hooks'
import { wrappedCurrencyAmount } from '../../utils/wrappedCurrency'
import { TransactionResponse } from '@ethersproject/providers'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { LoadingView, SubmittedView } from '../ModalViews'
import { useCurrencyFromToken } from '../../hooks/Tokens'
import Toggle from '../Toggle'

const HypotheticalRewardRate = styled.div<{ dim: boolean }>`
  display: flex;
  justify-content: space-between;
  padding-right: 20px;
  padding-left: 20px;

  opacity: ${({ dim }) => (dim ? 0.5 : 1)};
`

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 1rem;
`

interface StakingModalProps {
  isOpen: boolean
  onDismiss: () => void
  stakingInfo: StakingInfo
  userLiquidityUnstaked0: TokenAmount | undefined
  userLiquidityUnstaked1: TokenAmount | undefined
}

enum Field {
  PAIR0 = 'PAIR0',
  PAIR1 = 'PAIR1'
}

export default function StakingModal({ isOpen, onDismiss, stakingInfo, userLiquidityUnstaked0, userLiquidityUnstaked1 }: StakingModalProps) {
  const { account, chainId, library } = useActiveWeb3React()
//  const theme = useContext(ThemeContext)

  // used for UI loading states
  const [approveOverall, setApproveOverall] = useState<boolean>(false)

  // track and parse user input
  const [typedValue0, setTypedValue0] = useState('')
  const [typedValue1, setTypedValue1] = useState('')

  const { parsedAmount0, parsedAmount1, error } = useDerivedStakeInfo(typedValue0, typedValue1, stakingInfo, userLiquidityUnstaked0, userLiquidityUnstaked1)
  const parsedAmountWrapped0 = wrappedCurrencyAmount(parsedAmount0, chainId)
  const parsedAmountWrapped1 = wrappedCurrencyAmount(parsedAmount1, chainId)

  const hypotheticalRewardRate: TokenAmount = useMemo(() => {
      if( !parsedAmountWrapped0?.greaterThan('0') && !parsedAmountWrapped1?.greaterThan('0'))
        return new TokenAmount(stakingInfo.rewardRate.token, '0')

      const [newStakedAmount0, newTotalStakedAmount0] = parsedAmountWrapped0?.greaterThan('0')
                                                        ? [stakingInfo.stakedAmount[0].add(parsedAmountWrapped0), 
                                                           stakingInfo.totalStakedAmount[0].add(parsedAmountWrapped0)]
                                                        : [stakingInfo.stakedAmount[0], stakingInfo.totalStakedAmount[0]]
      const [newStakedAmount1, newTotalStakedAmount1] = parsedAmountWrapped1?.greaterThan('0')
                                                        ? [stakingInfo.stakedAmount[1].add(parsedAmountWrapped1), 
                                                           stakingInfo.totalStakedAmount[1].add(parsedAmountWrapped1)]
                                                        : [stakingInfo.stakedAmount[1], stakingInfo.totalStakedAmount[1]]                                                        
      return stakingInfo.getHypotheticalRewardRate( [newStakedAmount0, newStakedAmount1], 
                                                    [newTotalStakedAmount0, newTotalStakedAmount1], 
                                                    stakingInfo.totalRewardRate)
      }, [stakingInfo, parsedAmountWrapped0, parsedAmountWrapped1]) 

  // state for pending and submitted txn views
  const addTransaction = useTransactionAdder()
  const [attempting, setAttempting] = useState<boolean>(false)
  const [hash, setHash] = useState<string | undefined>()
  const wrappedOnDismiss = useCallback(() => {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }, [onDismiss])

  // pair contract for this token to be staked
  const dummyPair = new Pair( new TokenAmount(stakingInfo.tokens[0], '0'), new TokenAmount(stakingInfo.tokens[1], '0'),
                              new TokenAmount(stakingInfo.tokens[1], '0'), new TokenAmount(stakingInfo.tokens[0], '0'))

  const isContractReverse = !(dummyPair.liquidityToken0.address.toLocaleLowerCase < dummyPair.liquidityToken1.address.toLocaleLowerCase)

  const pairContract0 = usePairContract(isContractReverse ? dummyPair.liquidityToken1.address: dummyPair.liquidityToken0.address)
  const pairContract1 = usePairContract(isContractReverse ? dummyPair.liquidityToken0.address: dummyPair.liquidityToken1.address)

  const token0 = isContractReverse ? dummyPair?.token1 : dummyPair?.token0
  const token1 = isContractReverse ? dummyPair?.token0 : dummyPair?.token1

  const pairCurrency0 = useCurrencyFromToken(token0??WETH[ChainId.MAINNET]) ?? undefined
  const pairCurrency1 = useCurrencyFromToken(token1??WETH[ChainId.MAINNET]) ?? undefined

  // approval data for stake
  const deadline = useTransactionDeadline()
  const [signatureData0, setSignatureData0] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)
  const [signatureData1, setSignatureData1] = useState<{ v: number; r: string; s: string; deadline: number } | null>(null)

  const [approval0, approveCallback0] = useApproveCallback(parsedAmount0, stakingInfo.stakingRewardAddress)
  const [approval1, approveCallback1] = useApproveCallback(parsedAmount1, stakingInfo.stakingRewardAddress)

  const isArgentWallet = useIsArgentWallet()
  const stakingContract = useStakingContract(stakingInfo.stakingRewardAddress)

  async function onStake() {
    const ZeroString = '0x0000000000000000000000000000000000000000000000000000000000000000'  
    setAttempting(true)
    if (stakingContract && deadline && isContractReverse && (parsedAmount0 || parsedAmount1) ) {
      const paraAmount0 = parsedAmount0 ? `0x${parsedAmount0.raw.toString(16)}` : '0x00'
      const paraAmount1 = parsedAmount1 ? `0x${parsedAmount1.raw.toString(16)}` : '0x00'
      const paraSignature0 = signatureData0 ? [ paraAmount0, signatureData0.deadline,
                                                signatureData0.v, signatureData0.r,
                                                signatureData0.s] 
                                            : [ZeroString, ZeroString, '0x00', ZeroString, ZeroString]
    
      const paraSignature1 = signatureData1 ? [ paraAmount1, signatureData1.deadline,
                                                signatureData1.v, signatureData1.r,
                                                signatureData1.s] 
                                            : ['0x00', '0x00', '0x00', ZeroString, ZeroString]   
      
      if( (!signatureData0 && !signatureData1) &&
          ((paraAmount0 && approval0 === ApprovalState.APPROVED) || (paraAmount1 && approval1 === ApprovalState.APPROVED))) {
        stakingContract.stake(paraAmount0, paraAmount1, { gasLimit: 350000 })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Deposit liquidity`
            })
            setHash(response.hash)
          })
          .catch((error: any) => {
            setAttempting(false)
            console.log(error)
          })
      } else if(signatureData0 || signatureData1){
        stakingContract.stakeWithPermit(paraSignature0, paraSignature1, { gasLimit: 350000 })
          .then((response: TransactionResponse) => {
            addTransaction(response, {
              summary: `Deposit liquidity`
            })
            setHash(response.hash)
          })
          .catch((error: any) => {
            setAttempting(false)
            console.log(error)
          })
      } else {
        setAttempting(false)
        throw new Error('Attempting to stake without approval or a signature. Please contact support.')
      }
    }
  }

  // wrapped onUserInput to clear signatures
  const onUserInput0 = useCallback((typedValue: string) => {
    setSignatureData0(null)
    setTypedValue0(typedValue)
  }, [])

  const onUserInput1 = useCallback((typedValue: string) => {
    setSignatureData1(null)
    setTypedValue1(typedValue)
  }, [])


  // used for max input button
  const maxAmountInput0 = maxAmountSpend(userLiquidityUnstaked0)
  const atMaxAmount0 = Boolean(maxAmountInput0 && parsedAmount0?.equalTo(maxAmountInput0))
  const handleMax0 = useCallback(() => {
    maxAmountInput0 && onUserInput0(maxAmountInput0.toExact())
  }, [maxAmountInput0, onUserInput0])

  const maxAmountInput1 = maxAmountSpend(userLiquidityUnstaked1)
  const atMaxAmount1 = Boolean(maxAmountInput1 && parsedAmount1?.equalTo(maxAmountInput1))
  const handleMax1 = useCallback(() => {
    maxAmountInput1 && onUserInput1(maxAmountInput1.toExact())
  }, [maxAmountInput1, onUserInput1])

  async function onAttemptToApprove(field: Field) {
    const pairContract = (field === Field.PAIR0) ? pairContract0 : pairContract1
    const liquidityAmount = (field === Field.PAIR0) ? parsedAmount0 : parsedAmount1
    const setSignatureData = (field === Field.PAIR0) ? setSignatureData0 : setSignatureData1
    const approveCallback = (field === Field.PAIR0) ? approveCallback0 : approveCallback1
    
    if (!pairContract || !library || !deadline) throw new Error('missing dependencies')
    if (!liquidityAmount) throw new Error('missing liquidity amount')

    if (isArgentWallet || approveOverall) {
      return approveCallback()
    }

    // try to gather a signature for permission
    const nonce = await pairContract.nonces(account)
    const deadlineSave = deadline

    const EIP712Domain = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' }
    ]
    const domain = {
      name: 'FeSwap',
      version: '1',
      chainId: chainId,
      verifyingContract: pairContract.address
    }
    const Permit = [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'deadline', type: 'uint256' }
    ]
    const message = {
      owner: account,
      spender: stakingInfo.stakingRewardAddress,
      value: liquidityAmount.raw.toString(),
      nonce: nonce.toHexString(),
      deadline: deadlineSave.toNumber()
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
        setSignatureData({
          v: signature.v,
          r: signature.r,
          s: signature.s,
          deadline: deadlineSave.toNumber()
        })
      })
      .catch(error => {
        // for all errors other than 4001 (EIP-1193 user rejected request), fall back to manual approve
        if (error?.code !== 4001) {
          approveCallback()
        }
      })
  }

//  ( !!parsedAmount0  && ( signatureData0 === null && approval0 < ApprovalState.APPROVED ) ) ||
//  ( !!parsedAmount0  && ( signatureData0 === null && approval0 < ApprovalState.APPROVED ) ) }

  const approveToDeposit = useMemo(() => {
      let approveToDeposit = true
      if(!!error) approveToDeposit = false
      if(!parsedAmount0 && !parsedAmount1)  approveToDeposit = false
      if(approval0 === ApprovalState.APPROVED && approval1 === ApprovalState.APPROVED) approveToDeposit = false
      if(!parsedAmount0 && approval1 === ApprovalState.APPROVED)  approveToDeposit = false
      if(!parsedAmount1 && approval0 === ApprovalState.APPROVED)  approveToDeposit = false
      return approveToDeposit
    }, [error, approval0, approval1, parsedAmount0, parsedAmount1])


    //          {(((approval0 !== ApprovalState.UNKNOWN) || (approval1 !== ApprovalState.UNKNOWN)) && 
//            ((approval0 !== ApprovalState.ALL_APPROVED) || (approval1 !== ApprovalState.ALL_APPROVED))) &&


    return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <RowBetween>
            <TYPE.mediumHeader>Deposit</TYPE.mediumHeader>
            <CloseIcon onClick={wrappedOnDismiss} />
          </RowBetween>
          <CurrencyInputPanel
            value={typedValue0}
            onUserInput={onUserInput0}
            onMax={handleMax0}
            showMaxButton={!atMaxAmount0}
            currency={stakingInfo.stakedAmount[0].token}
            pair={dummyPair}
            pairTokenOrder={isContractReverse}
            label={ ((approval0 === ApprovalState.APPROVED) && !!parsedAmount0) ? 'APPROVED' : ''}
            disableCurrencySelect={true}
            customBalanceText={'Available to deposit: '}
            id="stake-liquidity-token"
          />
          <CurrencyInputPanel
            value={typedValue1}
            onUserInput={onUserInput1}
            onMax={handleMax1}
            showMaxButton={!atMaxAmount1}
            currency={stakingInfo.stakedAmount[1].token}
            pair={dummyPair}
            pairTokenOrder={!isContractReverse}
            label={ ((approval1 === ApprovalState.APPROVED) && !!parsedAmount1) ? 'APPROVED' : ''}
            disableCurrencySelect={true}
            customBalanceText={'Available to deposit: '}
            id="stake-liquidity-token"
          />

          <HypotheticalRewardRate dim={!hypotheticalRewardRate.greaterThan('0')}>
            <div>
              <TYPE.black fontWeight={600}>Weekly Rewards</TYPE.black>
            </div>

            <TYPE.black>
              {hypotheticalRewardRate.multiply((60 * 60 * 24 * 7).toString()).toSignificant(4, { groupSeparator: ',' })}{' '}
              FESW / week
            </TYPE.black>
          </HypotheticalRewardRate>


          { approveToDeposit && (
            <AutoColumn gap="sm">
              <RowBetween style={{ padding: '0px 20px 0px 20px'}}>
                <RowFixed>
                  <TYPE.black fontWeight={600} fontSize={16}>
                    Overall Approve
                  </TYPE.black>
                </RowFixed>
                <Toggle isActive={approveOverall} toggle={()=>setApproveOverall(!approveOverall)} />
              </RowBetween>

              { approveOverall && (
                <>
                  { parsedAmount0 && (
                      <ButtonConfirmed
                        mr="0.5rem"
                        onClick={() => onAttemptToApprove(Field.PAIR0)}
                        confirmed={(approval0 === ApprovalState.APPROVED)}
                        disabled={(approval0 === ApprovalState.PENDING)}
                      >
                        Approve {pairCurrency0?.symbol}🔗{pairCurrency1?.symbol} {(approval0 === ApprovalState.PENDING)? ' Pending' : ''}
                      </ButtonConfirmed> )
                  }
                  { parsedAmount1 && (
                      <ButtonConfirmed
                        mr="0.5rem"
                        onClick={() => onAttemptToApprove(Field.PAIR1)}
                        confirmed={(approval1 === ApprovalState.APPROVED)}
                        disabled={(approval1 === ApprovalState.PENDING)}
                      >
                        Approve {pairCurrency1?.symbol}🔗{pairCurrency0?.symbol} {(approval1 === ApprovalState.PENDING)? ' Pending' : ''}
                      </ButtonConfirmed> )
                  } 
                </>
              )}

              { !approveOverall && (
                <>
                { !!parsedAmount0 && (
                    <ButtonConfirmed
                      mr="0.5rem"
                      onClick={() => onAttemptToApprove(Field.PAIR0)}
                      confirmed={signatureData0 !== null}
                    >
                      { !!signatureData0 ? 'Approved ' : 'Approve '} {pairCurrency0?.symbol}🔗{pairCurrency1?.symbol}
                    </ButtonConfirmed> )
                }
                { !!parsedAmount1 && (
                  <ButtonConfirmed
                    mr="0.5rem"
                    onClick={() => onAttemptToApprove(Field.PAIR1)}
                    confirmed={signatureData1 !== null}
                  >
                    { !!signatureData1 ? 'Approved' : 'Approve'} {pairCurrency1?.symbol}🔗{pairCurrency0?.symbol}
                  </ButtonConfirmed> )
                } 
                </>
              )}
            </AutoColumn>
          )}
            
          <RowBetween>
            <ButtonError
              disabled= { !!error || 
                          ( !!parsedAmount0  && ( signatureData0 === null && approval0 !== ApprovalState.APPROVED ) ) ||
                          ( !!parsedAmount1  && ( signatureData1 === null && approval1 !== ApprovalState.APPROVED ) ) }
              error={!!error && ( !!parsedAmount0 || !!parsedAmount1) }
              onClick={onStake}
            >
              {error ?? 'Deposit'}
            </ButtonError>
          </RowBetween>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <LoadingView onDismiss={wrappedOnDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Depositing Liquidity</TYPE.largeHeader>
            { parsedAmount0 && (
              <TYPE.body fontSize={20}>{parsedAmount0?.toSignificant(4)} FESP of {pairCurrency0?.symbol}🔗{pairCurrency1?.symbol}</TYPE.body> )}
            { parsedAmount0 && parsedAmount1 && (
              <TYPE.body fontSize={20}> and </TYPE.body> )}
            { parsedAmount1 && (
              <TYPE.body fontSize={20}>{parsedAmount1?.toSignificant(4)} FESP of {pairCurrency1?.symbol}🔗{pairCurrency0?.symbol}</TYPE.body> )}
          </AutoColumn>
        </LoadingView>
      )}
      {attempting && hash && (
        <SubmittedView onDismiss={()=>{onUserInput0(''); onUserInput1(''); wrappedOnDismiss()}} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Transaction Submitted</TYPE.largeHeader>
            <TYPE.body fontSize={20}> Deposited </TYPE.body> 
            { parsedAmount0 && (
              <TYPE.body fontSize={20}> {parsedAmount0?.toSignificant(4)} FESP of {pairCurrency0?.symbol}🔗{pairCurrency1?.symbol}</TYPE.body> )}
            { parsedAmount0 && parsedAmount1 && (
              <TYPE.body fontSize={20}> and </TYPE.body> )}
            { parsedAmount1 && (
              <TYPE.body fontSize={20}>{parsedAmount1?.toSignificant(4)} FESP of {pairCurrency1?.symbol}🔗{pairCurrency0?.symbol}</TYPE.body> )}
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
