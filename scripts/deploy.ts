import { network } from "hardhat";

async function main() {
  // Connexion au réseau local Hardhat
  const { ethers } = await network.connect();

  // Récupérer le compte qui déploie le contrat
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with account:", deployer.address);

  // Récupérer le contrat compilé
  const CertificateRegistry =
    await ethers.getContractFactory("CertificateRegistry");

  // Déployer le contrat
  const contract = await CertificateRegistry.deploy();

  // Attendre la confirmation du déploiement
  await contract.waitForDeployment();

  // Afficher l'adresse du contrat
  const contractAddress = await contract.getAddress();

  console.log("CertificateRegistry deployed at:", contractAddress);
  console.log("Contract owner:", await contract.owner());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
