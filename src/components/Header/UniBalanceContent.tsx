import { TokenAmount } from '@feswap/sdk'
import React from 'react'
import { X } from 'react-feather'
import styled from 'styled-components'
import tokenLogo from '../../assets/images/token-logo.png'
import { FESW } from '../../constants'
import { useTotalSupply } from '../../data/TotalSupply'
import { useActiveWeb3React } from '../../hooks'
//import { useMerkleDistributorContract } from '../../hooks/useContract'
//import useCurrentBlockTimestamp from '../../hooks/useCurrentBlockTimestamp'
import { useTotalFeswEarned } from '../../state/stake/hooks'
import { useAggregateFeswBalance, useTokenBalance } from '../../state/wallet/hooks'
import { StyledInternalLink, TYPE, UniTokenAnimated } from '../../theme'
//import { computeUniCirculation } from '../../utils/computeUniCirculation'
import useUSDCPrice from '../../utils/useUSDCPrice'
import { AutoColumn } from '../Column'
import Row, { RowBetween } from '../Row'
import { CardSection, DataCard, CardNoise } from '../earn/styled'
import { SeparatorBBlack } from '../../components/SearchModal/styleds'
import { ButtonPrimary } from '../Button'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
`

const ModalUpper = styled(DataCard)`
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  padding: 0.5rem;
`

const StyledClose = styled(X)`
  position: absolute;
  right: 16px;
  top: 16px;

  :hover {
    cursor: pointer;
  }
`

/**
 * Content for balance stats modal
 */
export default function UniBalanceContent({ setShowUniBalanceModal }: { setShowUniBalanceModal: any }) {
  const { account, chainId, library } = useActiveWeb3React()
  const GORV_TOKEN_NAME = chainId ? FESW[chainId].symbol : 'FESW'
  const fesw = chainId ? FESW[chainId] : undefined

  const total = useAggregateFeswBalance()
  const feswBalance: TokenAmount | undefined = useTokenBalance(account ?? undefined, fesw)
  const feswToClaim: TokenAmount | undefined = useTotalFeswEarned()

  const totalSupply: TokenAmount | undefined = useTotalSupply(fesw)
  const feswPrice = useUSDCPrice(fesw)
  const circulation = totalSupply

//  const blockTimestamp = useCurrentBlockTimestamp()
//  const unclaimedFESW = useTokenBalance(useMerkleDistributorContract()?.address, fesw)
//  const circulation: TokenAmount | undefined = useMemo(
//    () =>
//      blockTimestamp && fesw && chainId === ChainId.MAINNET
//        ? computeUniCirculation(fesw, blockTimestamp, unclaimedFESW)
//        : totalSupply,
//   [blockTimestamp, chainId, totalSupply, unclaimedFESW, fesw]
//  )

  return (
    <ContentWrapper gap="lg">
      <ModalUpper>
      <CardNoise />
        <CardSection gap="md">
          <RowBetween>
            <TYPE.black color="black">Your {GORV_TOKEN_NAME} Breakdown</TYPE.black>
            <StyledClose stroke="black" onClick={() => setShowUniBalanceModal(false)} />
          </RowBetween>
        </CardSection>
        <SeparatorBBlack />
        {account && (
          <>
            <CardSection gap="sm">
              <AutoColumn gap="md" justify="center">
                <UniTokenAnimated width="48px" src={tokenLogo} />{' '}
                <TYPE.black fontSize={48} fontWeight={600} color="black">
                  {total?.toFixed(2, { groupSeparator: ',' })}
                </TYPE.black>
              </AutoColumn>
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.black color="black">Balance:</TYPE.black>
                  <TYPE.black color="black">{feswBalance?.toFixed(4, { groupSeparator: ',' })}</TYPE.black>
                </RowBetween>
                <RowBetween>
                  <TYPE.black color="black">Unclaimed:</TYPE.black>
                  <TYPE.black color="black">
                    {feswToClaim?.toFixed(4, { groupSeparator: ',' })}{' '}
                    {feswToClaim && feswToClaim.greaterThan('0') && (
                      <StyledInternalLink onClick={() => setShowUniBalanceModal(false)} to="/fesw">
                        (claim)
                      </StyledInternalLink>
                    )}
                  </TYPE.black>
                </RowBetween>
              </AutoColumn>
            </CardSection>
            <SeparatorBBlack />
          </>
        )}
        <CardSection gap="sm">
          <AutoColumn gap="md">
            <RowBetween>
              <TYPE.black color="black">{GORV_TOKEN_NAME} price:</TYPE.black>
              <TYPE.black color="black">${feswPrice?.toFixed(4) ?? '-'}</TYPE.black>
            </RowBetween>
            <RowBetween>
              <TYPE.black color="black">{GORV_TOKEN_NAME} in circulation:</TYPE.black>
              <TYPE.black color="black">{circulation?.toFixed(0, { groupSeparator: ',' })}</TYPE.black>
            </RowBetween>
            <RowBetween>
              <TYPE.black color="black">Total Supply</TYPE.black>
              <TYPE.black color="black">{totalSupply?.toFixed(0, { groupSeparator: ',' })}</TYPE.black>
            </RowBetween>
            { chainId && library && library.provider.isMetaMask &&
              <Row style={{justifyContent: 'center'}}>
                <ButtonPrimary
                  padding="12px 12px"
                  width="90%"
                  borderRadius="12px"
                  mt="1rem"
                  onClick={() => {
                    const params: any = {
                      type: 'ERC20',
                      options: {
                        address: FESW[chainId].address,
                        symbol: FESW[chainId].symbol,
                        decimals: 18,
                        image: "https://www.feswap.io/img/Fesw.png",
                      },
                    }
                    if(library.provider.request) {
                      library.provider.request({
                          method: 'wallet_watchAsset',
                          params,
                        })
                        .then((success) => {
                          if (success) {
                            console.log('Successfully added {GORV_TOKEN_NAME} to MetaMask')
                          } else {
                            throw new Error('Something went wrong.')
                          }
                        })
                        .catch(console.error)
                    }
                  }}
                >
                  Add {GORV_TOKEN_NAME} to Metamask
                </ButtonPrimary>
              </Row>
            }
          </AutoColumn>
        </CardSection>
        <CardNoise />
      </ModalUpper>
    </ContentWrapper>
  )
}

//{fesw && fesw.chainId === ChainId.MAINNET ? (
//  <ExternalLink href={`https://info.feswap.io/token/${fesw.address}`}>View {GORV_TOKEN_NAME} Analytics</ExternalLink>
//) : null}

