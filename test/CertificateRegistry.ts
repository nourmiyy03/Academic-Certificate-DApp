
import { expect } from "chai";
import { network } from "hardhat";

describe("CertificateRegistry ERC-721", function () {

  async function deployContract() {
    const { ethers } = await network.connect();

    const [admin, minter, student, unauthorized] =
      await ethers.getSigners();

    const CertificateRegistry =
      await ethers.getContractFactory("CertificateRegistry");

    const contract = await CertificateRegistry.deploy();
    await contract.waitForDeployment();

    const MINTER_ROLE = await contract.MINTER_ROLE();
    const DEFAULT_ADMIN_ROLE =
      await contract.DEFAULT_ADMIN_ROLE();

    await contract.grantRole(MINTER_ROLE, minter.address);

    return {
      ethers,
      contract,
      admin,
      minter,
      student,
      unauthorized,
      MINTER_ROLE,
      DEFAULT_ADMIN_ROLE
    };
  }

  const certificate = {
    studentName: "Ahmed Benali",
    studentId: "ST001",
    diplomaTitle: "Master Data Engineering and AI",
    issueDate: "2026-11-18",
    grade: "15.50",
    uri: "https://example.com/certificates/1.json"
  };

  // =========================
  // DEPLOYMENT
  // =========================

  describe("Deployment", function () {

    it("should grant admin and minter roles to deployer", async function () {
      const { contract, admin, MINTER_ROLE, DEFAULT_ADMIN_ROLE } =
        await deployContract();

      expect(await contract.hasRole(DEFAULT_ADMIN_ROLE, admin.address))
        .to.equal(true);

      expect(await contract.hasRole(MINTER_ROLE, admin.address))
        .to.equal(true);
    });

    it("should expose the ERC-721 interface", async function () {
      const { contract } = await deployContract();

      expect(await contract.supportsInterface("0x80ac58cd"))
        .to.equal(true);
    });

  });

  // =========================
  // MINT CERTIFICATE
  // =========================

  describe("Mint Certificate", function () {

    it("should mint an NFT with correct metadata", async function () {
      const { contract, minter, student } = await deployContract();

      await contract.connect(minter).mintCertificate(
        student.address,
        certificate.studentName,
        certificate.studentId,
        certificate.diplomaTitle,
        certificate.issueDate,
        certificate.grade,
        certificate.uri
      );

      expect(await contract.ownerOf(1)).to.equal(student.address);
      expect(await contract.tokenURI(1)).to.equal(certificate.uri);

      const result = await contract.getCertificate(1);

      expect(result.studentName).to.equal(certificate.studentName);
      expect(result.studentId).to.equal(certificate.studentId);
      expect(result.diplomaTitle).to.equal(certificate.diplomaTitle);
      expect(result.issueDate).to.equal(certificate.issueDate);
      expect(result.grade).to.equal(certificate.grade);
      expect(result.recipient).to.equal(student.address);
      expect(result.revoked).to.equal(false);
    });

    it("should reject duplicate student IDs", async function () {
      const { contract, minter, student } = await deployContract();

      await contract.connect(minter).mintCertificate(
        student.address,
        certificate.studentName,
        certificate.studentId,
        certificate.diplomaTitle,
        certificate.issueDate,
        certificate.grade,
        certificate.uri
      );

      await expect(
        contract.connect(minter).mintCertificate(
          student.address,
          "Another Student",
          certificate.studentId,
          certificate.diplomaTitle,
          certificate.issueDate,
          certificate.grade,
          "https://example.com/2.json"
        )
      ).to.be.revertedWith("Student already certified");
    });

    it("should reject zero address", async function () {
      const { ethers, contract, minter } = await deployContract();

      await expect(
        contract.connect(minter).mintCertificate(
          ethers.ZeroAddress,
          certificate.studentName,
          certificate.studentId,
          certificate.diplomaTitle,
          certificate.issueDate,
          certificate.grade,
          certificate.uri
        )
      ).to.be.revertedWith("Invalid recipient");
    });

    it("should reject empty URI", async function () {
      const { contract, minter, student } = await deployContract();

      await expect(
        contract.connect(minter).mintCertificate(
          student.address,
          certificate.studentName,
          certificate.studentId,
          certificate.diplomaTitle,
          certificate.issueDate,
          certificate.grade,
          ""
        )
      ).to.be.revertedWith("Invalid token URI");
    });

    it("should emit CertificateMinted event", async function () {
      const { contract, minter, student } = await deployContract();

      await expect(
        contract.connect(minter).mintCertificate(
          student.address,
          certificate.studentName,
          certificate.studentId,
          certificate.diplomaTitle,
          certificate.issueDate,
          certificate.grade,
          certificate.uri
        )
      )
        .to.emit(contract, "CertificateMinted")
        .withArgs(1, certificate.studentId, student.address);
    });

  });

  // =========================
  // ACCESS CONTROL
  // =========================

  describe("Access Control", function () {

    it("should prevent unauthorized minting", async function () {
      const { ethers, contract, unauthorized } = await deployContract();

      await expect(
        contract.connect(unauthorized).mintCertificate(
          unauthorized.address,
          certificate.studentName,
          certificate.studentId,
          certificate.diplomaTitle,
          certificate.issueDate,
          certificate.grade,
          certificate.uri
        )
      ).to.be.revert(ethers);
    });

    it("should prevent unauthorized revocation", async function () {
      const { ethers, contract, minter, student, unauthorized } =
        await deployContract();

      await contract.connect(minter).mintCertificate(
        student.address,
        certificate.studentName,
        certificate.studentId,
        certificate.diplomaTitle,
        certificate.issueDate,
        certificate.grade,
        certificate.uri
      );

      await expect(
        contract.connect(unauthorized).revokeCertificate(1)
      ).to.be.revert(ethers);
    });

    it("should prevent non-admin from granting roles", async function () {
      const { ethers, contract, unauthorized, MINTER_ROLE } =
        await deployContract();

      await expect(
        contract.connect(unauthorized).grantRole(
          MINTER_ROLE,
          unauthorized.address
        )
      ).to.be.revert(ethers);
    });

  });

  // =========================
  // BATCH MINT
  // =========================

  describe("Batch Mint", function () {

    it("should mint multiple NFTs", async function () {
      const { contract, minter, student } = await deployContract();

      await contract.connect(minter).batchMintCertificates(
        [student.address, student.address],
        [
          "https://example.com/1.json",
          "https://example.com/2.json"
        ],
        ["Ahmed Benali", "Sara Amrani"],
        ["ST001", "ST002"],
        [
          "Master Data Engineering and AI",
          "Master Data Engineering and AI"
        ],
        ["2026-11-18", "2026-11-18"],
        ["15.50", "16.20"]
      );

      expect(await contract.ownerOf(1)).to.equal(student.address);
      expect(await contract.ownerOf(2)).to.equal(student.address);

      expect(await contract.tokenURI(1))
        .to.equal("https://example.com/1.json");

      expect(await contract.tokenURI(2))
        .to.equal("https://example.com/2.json");
    });

    it("should reject empty batch", async function () {
      const { contract, minter } = await deployContract();

      await expect(
        contract.connect(minter).batchMintCertificates(
          [], [], [], [], [], [], []
        )
      ).to.be.revertedWith("Empty batch");
    });

    it("should reject duplicate IDs inside a batch", async function () {
      const { contract, minter, student } = await deployContract();

      await expect(
        contract.connect(minter).batchMintCertificates(
          [student.address, student.address],
          ["uri1", "uri2"],
          ["Ahmed", "Sara"],
          ["ST001", "ST001"],
          ["Master", "Master"],
          ["2026-11-18", "2026-11-18"],
          ["15", "16"]
        )
      ).to.be.revertedWith("Student already certified");

      expect(await contract.studentIdExists("ST001")).to.equal(false);
    });

    it("should reject arrays with different lengths", async function () {
      const { contract, minter, student } = await deployContract();

      await expect(
        contract.connect(minter).batchMintCertificates(
          [student.address],
          [],
          ["Ahmed"],
          ["ST001"],
          ["Master"],
          ["2026-11-18"],
          ["15"]
        )
      ).to.be.revertedWith("Array length mismatch");
    });

  });

  // =========================
  // REVOCATION
  // =========================

  describe("Revocation", function () {

    it("should revoke a certificate and emit an event", async function () {
      const { contract, minter, admin, student } = await deployContract();

      await contract.connect(minter).mintCertificate(
        student.address,
        certificate.studentName,
        certificate.studentId,
        certificate.diplomaTitle,
        certificate.issueDate,
        certificate.grade,
        certificate.uri
      );

      await expect(contract.connect(admin).revokeCertificate(1))
        .to.emit(contract, "CertificateRevoked")
        .withArgs(1);

      const result = await contract.getCertificate(1);

      expect(result.revoked).to.equal(true);

      // Revocation does not destroy the NFT.
      expect(await contract.ownerOf(1)).to.equal(student.address);
    });

    it("should prevent revoking an already revoked certificate", async function () {
      const { contract, minter, admin, student } = await deployContract();

      await contract.connect(minter).mintCertificate(
        student.address,
        certificate.studentName,
        certificate.studentId,
        certificate.diplomaTitle,
        certificate.issueDate,
        certificate.grade,
        certificate.uri
      );

      await contract.connect(admin).revokeCertificate(1);

      await expect(
        contract.connect(admin).revokeCertificate(1)
      ).to.be.revertedWith("Certificate already revoked");
    });

    it("should prevent reusing student ID after revocation", async function () {
      const { contract, minter, admin, student } = await deployContract();

      await contract.connect(minter).mintCertificate(
        student.address,
        certificate.studentName,
        certificate.studentId,
        certificate.diplomaTitle,
        certificate.issueDate,
        certificate.grade,
        certificate.uri
      );

      await contract.connect(admin).revokeCertificate(1);

      await expect(
        contract.connect(minter).mintCertificate(
          student.address,
          certificate.studentName,
          certificate.studentId,
          certificate.diplomaTitle,
          certificate.issueDate,
          certificate.grade,
          "https://example.com/2.json"
        )
      ).to.be.revertedWith("Student already certified");
    });

  });

});
