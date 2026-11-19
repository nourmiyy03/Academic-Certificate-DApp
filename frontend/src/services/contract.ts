import { BrowserProvider, Contract } from "ethers";
import CertificateRegistry from "../contracts/CertificateRegistry.json";


const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Local Hardhat network: Chain ID 31337
const EXPECTED_CHAIN_ID = 31337n;

export async function getCertificateContract() {
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const provider = new BrowserProvider(window.ethereum);

  const network = await provider.getNetwork();

  if (network.chainId !== EXPECTED_CHAIN_ID) {
    throw new Error("Please connect MetaMask to the Hardhat Local Network");
  }

  const signer = await provider.getSigner();

  const contract = new Contract(
    CONTRACT_ADDRESS,
    CertificateRegistry.abi,
    signer
  );

  return contract;
}
