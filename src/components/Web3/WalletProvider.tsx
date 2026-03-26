import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { PropsWithChildren } from "react";
import { Network } from "@aptos-labs/ts-sdk";

const wallets = [new PetraWallet()];

export function WalletProvider({ children }: PropsWithChildren) {
  return (
    <AptosWalletAdapterProvider 
      plugins={wallets} 
      autoConnect={true}
      optInFeatures={["aptos:connect"]}
      dappConfig={{
        network: Network.TESTNET,
        aptosApiConfig: {
          fullnode: "https://api.shelbynet.shelby.xyz/shelby",
        }
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
