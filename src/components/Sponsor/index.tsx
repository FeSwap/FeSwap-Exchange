import React, { useCallback } from 'react'
import styled from 'styled-components'

import { TYPE } from '../../theme'

import Modal from '../Modal'
import { AutoRow, RowBetween } from '../Row'
import { AutoColumn } from '../Column'
import { Award, CheckSquare, XSquare } from 'react-feather'
import { ButtonError } from '../Button'
import { useActiveWeb3React } from '../../hooks'
import { FESW } from '../../constants'

const WarningContainer = styled.div`
  max-width: 480px;
  width: 100%;
  padding: 1rem;
  background: rgba(242, 150, 2, 0.2);
  border: 2px solid #f3841e;
  border-radius: 10px;
  padding: 1.2rem;
  overflow: auto;
`

const StyledWarningIcon = styled(Award)`
  stroke: ${({ theme }) => theme.red2};
`
const CheckSquareIcon = styled(CheckSquare)`
  color="white";
  padding-right: 6px;
`
const XSquareIcon = styled(XSquare)`
  color="white";
  padding-right: 6px;
`
export default function SponsorWarningModal({
  isOpen,
  onConfirm
}: {
  isOpen: boolean
  onConfirm: (yesOrNo: boolean) => void
}) {
  const { chainId } = useActiveWeb3React()
  const GORV_TOKEN_NAME = chainId ? FESW[chainId].symbol : 'FESW'
  const DAO_NAME = (GORV_TOKEN_NAME==='FESW') ? 'FeSwap' : 'FeSwap'

  const handleDismiss = useCallback(() => null, [])
  return (
    <Modal isOpen={isOpen} onDismiss={handleDismiss} maxHeight={90}>
      <WarningContainer className="token-warning-container">
        <AutoColumn gap="lg">
          <AutoRow gap="6px">
            <StyledWarningIcon />
            <TYPE.main color={'red2'} style={{ fontSize: '1.25rem'}}>
            <strong>Sponsor Reminding</strong>
            </TYPE.main>
          </AutoRow>
          <TYPE.body color={'red2'}>
            Your sponsorship will be used for the development of {DAO_NAME} decentralized exchange, 
            the world first DEX serving cryptocurrecy exchange without exchange fee.   
          </TYPE.body>
          <TYPE.body color={'red2'}>
            As return, you will get some <strong>{GORV_TOKEN_NAME}</strong> tokens, which entitle you to engage in {DAO_NAME} governance. <br />
          </TYPE.body>
          <TYPE.body color={'red2'}>
            <strong>{GORV_TOKEN_NAME}</strong>, as the {DAO_NAME} governance token, is assumed to be <strong>NO</strong> monetary value. Please follow your local country 
            legislation while sponsoring {DAO_NAME} and utilizing <strong>{GORV_TOKEN_NAME}</strong> tokens.  
          </TYPE.body>
          <TYPE.body color={'red2'}>
            <strong>Thank you to support {DAO_NAME} community!</strong>
          </TYPE.body>
          <RowBetween>
            <ButtonError
              error={true}
              width={'48%'}
              padding="0.5rem 0rem"
              className="token-dismiss-button"
              style={{
                borderRadius: '6px'
              }}
              onClick={() => {
                onConfirm(false)
              }}
            >
              <XSquareIcon />
              <TYPE.body color="white">NOT Sponsor</TYPE.body>
            </ButtonError>
            <ButtonError
              error={true}
              width={'48%'}
              padding="0.5rem 0.5rem"
              className="token-dismiss-button"
              style={{
                borderRadius: '6px'
              }}
              onClick={() => {
                onConfirm(true)
              }}
            >
              <CheckSquareIcon />
              <TYPE.body color="white">I will Sponsor</TYPE.body>
            </ButtonError>
          </RowBetween>
        </AutoColumn>
      </WarningContainer>
    </Modal>
  )
}
