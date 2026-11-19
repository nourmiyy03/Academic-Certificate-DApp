import { BrowserProvider, Contract } from "ethers";
import CertificateRegistry from "../contracts/CertificateRegistry.json";

const CONTRACT_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

export async function getCertificateContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new BrowserProvider(window.ethereum);

  const signer = await provider.getSigner();

  const contract = new Contract(
    CONTRACT_ADDRESS,
    CertificateRegistry.abi,
    signer
  );

  return contract;
}