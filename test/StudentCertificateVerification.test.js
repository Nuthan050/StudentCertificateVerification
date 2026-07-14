const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("StudentCertificateVerification", function () {
  let certificateContract;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  const TEST_STUDENT_NAME = "John Doe";
  const TEST_CERTIFICATE_ID = "TEST-CERT-001";
  const TEST_COURSE_NAME = "Blockchain Development";
  const TEST_ISSUE_DATE = Math.floor(Date.now() / 1000);

  beforeEach(async function () {
    // Get the ContractFactory and Signers here.
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    // Deploy the contract
    const CertificateContract = await ethers.getContractFactory("StudentCertificateVerification");
    certificateContract = await CertificateContract.deploy();
    await certificateContract.deployed();
  });

  describe("Deployment", function () {
    it("Should set the owner correctly", async function () {
      expect(await certificateContract.owner()).to.equal(owner.address);
    });
  });

  describe("Certificate Issuance", function () {
    it("Should allow owner to issue a certificate", async function () {
      await expect(
        certificateContract.issueCertificate(
          TEST_STUDENT_NAME,
          TEST_CERTIFICATE_ID,
          TEST_COURSE_NAME,
          TEST_ISSUE_DATE
        )
      )
        .to.emit(certificateContract, "CertificateIssued")
        .withArgs(
          TEST_CERTIFICATE_ID,
          TEST_STUDENT_NAME,
          TEST_COURSE_NAME,
          TEST_ISSUE_DATE,
          owner.address
        );
    });

    it("Should reject duplicate certificate IDs", async function () {
      // Issue first certificate
      await certificateContract.issueCertificate(
        TEST_STUDENT_NAME,
        TEST_CERTIFICATE_ID,
        TEST_COURSE_NAME,
        TEST_ISSUE_DATE
      );

      // Attempt to issue another with same ID
      await expect(
        certificateContract.issueCertificate(
          "Jane Smith",
          TEST_CERTIFICATE_ID,
          "Different Course",
          TEST_ISSUE_DATE + 1000
        )
      ).to.be.revertedWith("CertificateAlreadyExists");
    });

    it("Should reject empty student name", async function () {
      await expect(
        certificateContract.issueCertificate(
          "", // Empty name
          TEST_CERTIFICATE_ID,
          TEST_COURSE_NAME,
          TEST_ISSUE_DATE
        )
      ).to.be.revertedWith("EmptyString");
    });

    it("Should reject empty course name", async function () {
      await expect(
        certificateContract.issueCertificate(
          TEST_STUDENT_NAME,
          TEST_CERTIFICATE_ID,
          "", // Empty course
          TEST_ISSUE_DATE
        )
      ).to.be.revertedWith("EmptyString");
    });

    it("Should reject empty certificate ID", async function () {
      await expect(
        certificateContract.issueCertificate(
          TEST_STUDENT_NAME,
          "", // Empty ID
          TEST_COURSE_NAME,
          TEST_ISSUE_DATE
        )
      ).to.be.revertedWith("EmptyString");
    });

    it("Should reject non-owner issuence", async function () {
      // Connect as addr1 (not owner)
      await expect(
        certificateContract.connect(addr1).issueCertificate(
          TEST_STUDENT_NAME,
          TEST_CERTIFICATE_ID,
          TEST_COURSE_NAME,
          TEST_ISSUE_DATE
        )
      ).to.be.revertedWith("NotAuthorized");
    });
  });

  describe("Certificate Verification", function () {
    it("Should return certificate details for valid ID", async function () {
      // Issue a certificate
      await certificateContract.issueCertificate(
        TEST_STUDENT_NAME,
        TEST_CERTIFICATE_ID,
        TEST_COURSE_NAME,
        TEST_ISSUE_DATE
      );

      // Verify the certificate
      const cert = await certificateContract.verifyCertificate(TEST_CERTIFICATE_ID);

      expect(cert.studentName).to.equal(TEST_STUDENT_NAME);
      expect(cert.certificateId).to.equal(TEST_CERTIFICATE_ID);
      expect(cert.courseName).to.equal(TEST_COURSE_NAME);
      expect(cert.issueDate).to.equal(TEST_ISSUE_DATE);
      expect(cert.issuer).to.equal(owner.address);
      expect(cert.isValid).to.be.true;
    });

    it("Should return empty values for non-existent certificate", async function () {
      const cert = await certificateContract.verifyCertificate("NON-EXISTENT-ID");

      expect(cert.studentName).to.equal("");
      expect(cert.certificateId).to.equal("");
      expect(cert.courseName).to.equal("");
      expect(cert.issueDate).to.equal(0);
      expect(cert.issuer).to.equal("0x0000000000000000000000000000000000000000");
      expect(cert.isValid).to.be.false;
    });
  });

  describe("Administrator Functions", function () {
    it("Should allow owner to add an administrator", async function () {
      await expect(
        certificateContract.addAdministrator(addr1.address)
      )
        .to.emit(certificateContract, "AdministratorAdded")
        .withArgs(addr1.address);

      expect(await certificateContract.isAdministrator(addr1.address)).to.be.true;
    });

    it("Should allow admin to issue certificates", async function () {
      // Add addr1 as admin
      await certificateContract.addAdministrator(addr1.address);

      // Now addr1 should be able to issue certificates
      await expect(
        certificateContract.connect(addr1).issueCertificate(
          "Jane Smith",
          "ADMIN-CERT-001",
          "Smart Contracts",
          Math.floor(Date.now() / 1000)
        )
      )
        .to.emit(certificateContract, "CertificateIssued")
        .withArgs(
          "ADMIN-CERT-001",
          "Jane Smith",
          "Smart Contracts",
          Math.floor(Date.now() / 1000),
          addr1.address
        );
    });

    it("Should allow owner to remove an administrator", async function () {
      // Add admin first
      await certificateContract.addAdministrator(addr1.address);
      expect(await certificateContract.isAdministrator(addr1.address)).to.be.true;

      // Remove admin
      await expect(
        certificateContract.removeAdministrator(addr1.address)
      )
        .to.emit(certificateContract, "AdministratorRemoved")
        .withArgs(addr1.address);

      expect(await certificateContract.isAdministrator(addr1.address)).to.be.false;
    });

    it("Should prevent non-owner from adding/removing admins", async function () {
      await expect(
        certificateContract.connect(addr1).addAdministrator(addr2.address)
      ).to.be.revertedWith("NotAuthorized");

      await expect(
        certificateContract.connect(addr1).removeAdministrator(addr2.address)
      ).to.be.revertedWith("NotAuthorized");
    });
  });
});