import { expect } from "chai";
import { network } from "hardhat";

describe("CertificateRegistry", function () {

  async function deployContract() {
    const { ethers } = await network.connect();

    const [owner, student] = await ethers.getSigners();

    const CertificateRegistry =
      await ethers.getContractFactory("CertificateRegistry");

    const contract = await CertificateRegistry.deploy();

    return { contract, owner, student, ethers };
  }


  describe("Deployment", function () {

    it("should set the deployer as owner", async function () {

      const { contract, owner } = await deployContract();

      expect(await contract.owner()).to.equal(owner.address);
    });

  });


  describe("Mint Certificate", function () {

    it("should create a certificate", async function () {

      const { contract, owner } = await deployContract();

      await contract.mintCertificate(
        owner.address,
        "Ahmed Benali",
        "ST001",
        "Master Data Engineering and AI",
        "2026-11-18",
        "15.50"
      );

      const certificate = await contract.getCertificate(1);

      expect(certificate.studentName).to.equal("Ahmed Benali");
      expect(certificate.studentId).to.equal("ST001");
      expect(certificate.diplomaTitle)
        .to.equal("Master Data Engineering and AI");
      expect(certificate.issueDate).to.equal("2026-11-18");
      expect(certificate.grade).to.equal("15.50");
      expect(certificate.recipient).to.equal(owner.address);
      expect(certificate.revoked).to.equal(false);
    });


    it("should reject duplicate studentId", async function () {

      const { contract, owner } = await deployContract();

      await contract.mintCertificate(
        owner.address,
        "Ahmed Benali",
        "ST001",
        "Master Data Engineering and AI",
        "2026-11-18",
        "15.50"
      );

      await expect(
        contract.mintCertificate(
          owner.address,
          "Another Student",
          "ST001",
          "Master Data Engineering and AI",
          "2026-11-18",
          "14.00"
        )
      ).to.be.revertedWith("Student already certified");
    });


    it("should reject an invalid recipient", async function () {

      const { contract } = await deployContract();

      await expect(
        contract.mintCertificate(
          "0x0000000000000000000000000000000000000000",
          "Ahmed Benali",
          "ST001",
          "Master Data Engineering and AI",
          "2026-11-18",
          "15.50"
        )
      ).to.be.revertedWith("Invalid recipient");
    });

  });


  describe("Access Control", function () {

    it("should prevent non-owner from minting", async function () {

      const { contract, student } = await deployContract();

      const studentContract = contract.connect(student);

      await expect(
        studentContract.mintCertificate(
          student.address,
          "Ahmed Benali",
          "ST001",
          "Master Data Engineering and AI",
          "2026-11-18",
          "15.50"
        )
      ).to.be.revertedWith("Not authorized");
    });

  });


  describe("Revocation", function () {

    it("should revoke a certificate", async function () {

      const { contract, owner } = await deployContract();

      await contract.mintCertificate(
        owner.address,
        "Ahmed Benali",
        "ST001",
        "Master Data Engineering and AI",
        "2026-11-18",
        "15.50"
      );

      await contract.revokeCertificate(1);

      const certificate = await contract.getCertificate(1);

      expect(certificate.revoked).to.equal(true);
    });


    it("should reject revoking an already revoked certificate", async function () {

      const { contract, owner } = await deployContract();

      await contract.mintCertificate(
        owner.address,
        "Ahmed Benali",
        "ST001",
        "Master Data Engineering and AI",
        "2026-11-18",
        "15.50"
      );

      await contract.revokeCertificate(1);

      await expect(
        contract.revokeCertificate(1)
      ).to.be.revertedWith("Certificate already revoked");
    });

  });


  describe("Batch Mint", function () {

    it("should create multiple certificates", async function () {

      const { contract, owner } = await deployContract();

      const certificates = [
        {
          studentName: "Ahmed Benali",
          studentId: "ST001",
          diplomaTitle: "Master Data Engineering and AI",
          issueDate: "2026-11-18",
          grade: "15.50",
          recipient: owner.address
        },
        {
          studentName: "Sara Amrani",
          studentId: "ST002",
          diplomaTitle: "Master Data Engineering and AI",
          issueDate: "2026-11-18",
          grade: "16.20",
          recipient: owner.address
        }
      ];

      await contract.batchMint(certificates);

      const cert1 = await contract.getCertificate(1);
      const cert2 = await contract.getCertificate(2);

      expect(cert1.studentName).to.equal("Ahmed Benali");
      expect(cert1.studentId).to.equal("ST001");

      expect(cert2.studentName).to.equal("Sara Amrani");
      expect(cert2.studentId).to.equal("ST002");
    });

  });



  describe("Additional Access Control", function () {

    it("should prevent non-owner from revoking a certificate", async function () {
      const { contract, owner, student } = await deployContract();

      await contract.mintCertificate(
        owner.address,
        "Ahmed Benali",
        "ST001",
        "Master Data Engineering and AI",
        "2026-11-18",
        "15.50"
      );

      const studentContract = contract.connect(student);

      await expect(
        studentContract.revokeCertificate(1)
      ).to.be.revertedWith("Not authorized");
    });

    it("should prevent non-owner from batch minting", async function () {
      const { contract, student } = await deployContract();

      const certificates = [
        {
          studentName: "Ahmed Benali",
          studentId: "ST001",
          diplomaTitle: "Master Data Engineering and AI",
          issueDate: "2026-11-18",
          grade: "15.50",
          recipient: student.address
        }
      ];

      const studentContract = contract.connect(student);

      await expect(
        studentContract.batchMint(certificates)
      ).to.be.revertedWith("Not authorized");
    });

  });


  describe("Certificate Validation", function () {

    it("should reject retrieving a certificate that does not exist", async function () {
      const { contract } = await deployContract();

      await expect(
        contract.getCertificate(1)
      ).to.be.revertedWith("Certificate does not exist");
    });

    it("should reject revoking a certificate that does not exist", async function () {
      const { contract } = await deployContract();

      await expect(
        contract.revokeCertificate(1)
      ).to.be.revertedWith("Certificate does not exist");
    });

    it("should not allow reusing a student ID after revocation", async function () {
      const { contract, owner } = await deployContract();

      await contract.mintCertificate(
        owner.address,
        "Ahmed Benali",
        "ST001",
        "Master Data Engineering and AI",
        "2026-11-18",
        "15.50"
      );

      await contract.revokeCertificate(1);

      await expect(
        contract.mintCertificate(
          owner.address,
          "Ahmed Benali",
          "ST001",
          "Another Diploma",
          "2026-11-19",
          "16.00"
        )
      ).to.be.revertedWith("Student already certified");
    });

  });


  describe("Batch Mint Validation", function () {

    it("should reject an empty batch", async function () {
      const { contract } = await deployContract();

      await expect(
        contract.batchMint([])
      ).to.be.revertedWith("Empty batch");
    });

    it("should revert the entire batch if a duplicate student ID is found", async function () {
      const { contract, owner } = await deployContract();

      const certificates = [
        {
          studentName: "Ahmed Benali",
          studentId: "ST001",
          diplomaTitle: "Master Data Engineering and AI",
          issueDate: "2026-11-18",
          grade: "15.50",
          recipient: owner.address
        },
        {
          studentName: "Sara Amrani",
          studentId: "ST001",
          diplomaTitle: "Master Data Engineering and AI",
          issueDate: "2026-11-18",
          grade: "16.20",
          recipient: owner.address
        }
      ];

      await expect(
        contract.batchMint(certificates)
      ).to.be.revertedWith("Student already certified");

      // Verify that the first certificate was also rolled back
      expect(await contract.studentIdExists("ST001")).to.equal(false);

      await expect(
        contract.getCertificate(1)
      ).to.be.revertedWith("Certificate does not exist");
    });

  });

});