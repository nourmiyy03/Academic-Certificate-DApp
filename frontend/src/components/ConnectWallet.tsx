
import { useState } from "react";
import { BrowserProvider } from "ethers";

function ConnectWallet() {
  const [account, setAccount] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [networkError, setNetworkError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function connectWallet() {
    try {
      setError("");
      setNetworkError("");
      setSuccessMessage("");

      if (!window.ethereum) {
        setError("MetaMask is not installed.");
        return;
      }

      const provider = new BrowserProvider(window.ethereum);

      const accounts = await provider.send("eth_requestAccounts", []);

      if (!accounts || accounts.length === 0) {
        setError("No wallet account found.");
        return;
      }

      const network = await provider.getNetwork();

      if (network.chainId !== 31337n) {
        setNetworkError(
          "Please connect to Hardhat Local (Chain ID: 31337)."
        );
        return;
      }

      setAccount(accounts[0]);

      setSuccessMessage("Wallet connected successfully!");

    } catch (err) {
      console.error(err);
      setError("Wallet connection failed or was rejected.");
    }
  }


  async function disconnectWallet() {
    try {
      setError("");
      setSuccessMessage("");

      if (!window.ethereum) {
        setError("MetaMask is not installed.");
        return;
      }

      // Revoke this website's permission to access wallet accounts
      await window.ethereum.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      });

      // Update the React interface
      setAccount(null);

      setSuccessMessage(
        "Wallet successfully disconnected from MetaMask!"
      );

    } catch (err) {
      console.error("Disconnect error:", err);

      setError(
        "Unable to revoke MetaMask permission. Please disconnect this website from MetaMask settings."
      );
    }
  }


  return (
    <div className="wallet-container">

      {account ? (
        <div className="wallet-connected">

          <div className="wallet-status">
            <span className="wallet-indicator"></span>

            <div className="wallet-info">
              <span className="wallet-label">Connected wallet</span>

              <strong title={account}>
                {account.slice(0, 6)}...{account.slice(-4)}
              </strong>

              <small>Hardhat Local · Chain 31337</small>
            </div>
          </div>

          <button
            className="wallet-disconnect"
            onClick={disconnectWallet}
          >
            Disconnect
          </button>

        </div>
      ) : (
        <button
          className="wallet-connect"
          onClick={connectWallet}
        >
          Connect Wallet
        </button>
      )}

      {successMessage && (
        <p className="wallet-success">
          ✓ {successMessage}
        </p>
      )}

      {error && (
        <p className="wallet-error">
          {error}
        </p>
      )}

      {networkError && (
        <p className="wallet-error">
          {networkError}
        </p>
      )}

    </div>
  );
}

export default ConnectWallet;
