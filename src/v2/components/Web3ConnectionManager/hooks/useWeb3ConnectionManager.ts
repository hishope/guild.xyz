import {
  useAccount as useFuelAccount,
  useDisconnect as useFuelDisconnect,
  useIsConnected,
  useWallet,
} from "@fuels/react"
import { UserProfile } from "@guildxyz/types"
import { atom, useAtom } from "jotai"
import { useEffect } from "react"
import { useAccount, useDisconnect, useSignMessage, useWalletClient } from "wagmi"

const safeContextAtom = atom(false)

export function useWeb3ConnectionManager(): {
  isInSafeContext: boolean
  isWeb3Connected: boolean | null
  address?: `0x${string}`
  type: UserProfile["addresses"][number]["walletType"] | null
  disconnect: () => void
  signMessage: (message: string) => Promise<string> | undefined
  isWalletClientLoading: boolean
} {
  const [isInSafeContext, setIsInSafeContext] = useAtom(safeContextAtom)

  const {
    isConnected: isEvmConnected,
    connector: evmConnector,
    address: evmAddress,
  } = useAccount()

  const { signMessageAsync } = useSignMessage()

  useEffect(() => {
    if (!isEvmConnected || evmConnector?.id !== "safe") return
    setIsInSafeContext(true)
  }, [isEvmConnected, evmConnector, setIsInSafeContext])

  const { account: fuelAddress } = useFuelAccount()
  const { isConnected: isFuelConnected } = useIsConnected()

  const isWeb3Connected = isEvmConnected || isFuelConnected
  const address = (evmAddress || fuelAddress) as `0x${string}` | undefined

  let type: "EVM" | "FUEL" | null = null
  if (isEvmConnected) {
    type = "EVM"
  } else if (isFuelConnected) {
    type = "FUEL"
  }

  const { disconnect: disconnectEvm } = useDisconnect()
  const { disconnect: disconnectFuel } = useFuelDisconnect()

  const { data: walletClient } = useWalletClient()
  const { wallet: fuelWallet } = useWallet()

  const disconnect = () => {
    if (type === "EVM" && typeof disconnectEvm === "function") disconnectEvm()

    if (type === "FUEL" && typeof disconnectFuel === "function") disconnectFuel()
  }

  const signMessage = (message: string) => {
    if (type === "EVM") {
      return signMessageAsync({ account: evmAddress, message })
    }
    return fuelWallet?.signMessage(message)
  }

  return {
    isInSafeContext,
    isWeb3Connected,
    address,
    type,
    disconnect,
    signMessage,
    isWalletClientLoading: !!address && !walletClient && !fuelWallet,
  }
}
