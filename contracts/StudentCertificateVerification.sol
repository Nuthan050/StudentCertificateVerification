// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title StudentCertificateVerification
 * @dev A decentralized student certificate verification system on the Ethereum blockchain.
 *      Allows authorized issuers to create tamper-proof certificates and anyone to verify them.
 */
contract StudentCertificateVerification {
    /* ===== STRUCTS ===== */
    struct Certificate {
        string studentName;
        string certificateId;
        string courseName;
        uint256 issueDate; // Unix timestamp
        address issuer;
        bool isValid;
    }

    /* ===== STATE VARIABLES ===== */
    // Mapping from certificateId to Certificate struct
    mapping(string => Certificate) public certificates;

    // Set of certificate IDs to check for duplicates efficiently
    mapping(string => bool) public certificateIds;

    // Owner and admin management
    address public owner;
    mapping(address => bool) public admins;

    /* ===== EVENTS ===== */
    event CertificateIssued(
        string indexed certificateId,
        string studentName,
        string courseName,
        uint256 issueDate,
        address indexed issuer
    );

    event AdministratorAdded(address indexed admin);
    event AdministratorRemoved(address indexed admin);

    /* ===== ERRORS ===== */
    error NotAuthorized();
    error CertificateAlreadyExists();
    error EmptyString();

    /* ===== MODIFIERS ===== */
    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "NotAuthorized"
        );
        _;
    }

    modifier onlyOwnerOrAdmin() {
        require(
            msg.sender == owner || admins[msg.sender],
            "NotAuthorized"
        );
        _;
    }

    /* ===== CONSTRUCTOR ===== */
    constructor() {
        owner = msg.sender;
        admins[owner] = true;
    }

    /* ===== CERTIFICATE MANAGEMENT ===== */
    /**
     * @dev Issues a new certificate.
     * @param _studentName Name of the student
     * @param _certificateId Unique identifier for the certificate
     * @param _courseName Name of the course
     * @param _issueDate Date of issuance (Unix timestamp)
     */
    function issueCertificate(
        string memory _studentName,
        string memory _certificateId,
        string memory _courseName,
        uint256 _issueDate
    ) external onlyOwnerOrAdmin {
        // Validate inputs
        require(bytes(_studentName).length > 0, "EmptyString");
        require(bytes(_certificateId).length > 0, "EmptyString");
        require(bytes(_courseName).length > 0, "EmptyString");

        // Check for duplicate certificate ID
        require(!certificateIds[_certificateId], "CertificateAlreadyExists");

        // Create and store the certificate
        Certificate memory newCert = Certificate({
            studentName: _studentName,
            certificateId: _certificateId,
            courseName: _courseName,
            issueDate: _issueDate,
            issuer: msg.sender,
            isValid: true
        });

        certificates[_certificateId] = newCert;
        certificateIds[_certificateId] = true;

        emit CertificateIssued(
            _certificateId,
            _studentName,
            _courseName,
            _issueDate,
            msg.sender
        );
    }

    /* ===== VERIFICATION FUNCTIONS ===== */
    /**
     * @dev Verifies a certificate by its ID.
     * @param _certificateId The ID of the certificate to verify
     * @return studentName Name of the student
     * @return certificateId The certificate ID
     * @return courseName Name of the course
     * @return issueDate Date of issuance (Unix timestamp)
     * @return issuer Address of the issuer
     * @return isValid Boolean indicating if the certificate is valid
     */
    function verifyCertificate(string memory _certificateId)
        external
        view
        returns (
            string memory studentName,
            string memory certificateId,
            string memory courseName,
            uint256 issueDate,
            address issuer,
            bool isValid
        )
    {
        // Check if certificate exists
        if (!certificateIds[_certificateId]) {
            // Return empty values if certificate doesn't exist
            return ("", "", "", 0, address(0), false);
        }

        Certificate memory cert = certificates[_certificateId];
        return (
            cert.studentName,
            cert.certificateId,
            cert.courseName,
            cert.issueDate,
            cert.issuer,
            cert.isValid
        );
    }

    /* ===== ADDITIONAL VIEW FUNCTIONS ===== */
    /**
     * @dev Checks if a certificate exists.
     * @param _certificateId The ID to check
     * @return true if exists, false otherwise
     */
    function certificateExists(string memory _certificateId)
        external
        view
        returns (bool)
    {
        return certificateIds[_certificateId];
    }

    /* ===== ADMINISTRATOR MANAGEMENT ===== */
    /**
     * @dev Adds a new administrator.
     * @param _admin Address of the new administrator
     */
    function addAdministrator(address _admin) external onlyOwner {
        require(!admins[_admin], "Already an admin");
        admins[_admin] = true;
        emit AdministratorAdded(_admin);
    }

    /**
     * @dev Removes an administrator.
     * @param _admin Address of the administrator to remove
     */
    function removeAdministrator(address _admin) external onlyOwner {
        require(admins[_admin], "Not an admin");
        require(_admin != owner, "Cannot remove owner");
        admins[_admin] = false;
        emit AdministratorRemoved(_admin);
    }

    /**
     * @dev Checks if an address is an administrator.
     * @param _addr Address to check
     * @return true if admin, false otherwise
     */
    function isAdministrator(address _addr)
        external
        view
        returns (bool)
    {
        return admins[_addr];
    }
}