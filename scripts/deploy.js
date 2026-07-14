const hre = require("hardhat");

async function main() {
  // Get the contract factory
  const StudentCertificateVerification = await hre.ethers.getContractFactory("StudentCertificateVerification");

  // Deploy the contract
  const certificateContract = await StudentCertificateVerification.deploy();

  // Wait for deployment to complete
  await certificateContract.deployed();

  console.log("StudentCertificateVerification deployed to:", certificateContract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});