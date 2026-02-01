const CryptoJS = require('crypto-js');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';

/**
 * Password Hashing Utilities
 * Uses bcrypt with salt for secure password storage
 */
const passwordUtils = {
    /**
     * Generate a random salt
     * @returns {string} Generated salt
     */
    generateSalt: () => {
        return bcrypt.genSaltSync(12);
    },

    /**
     * Hash password with provided salt
     * @param {string} password - Plain text password
     * @param {string} salt - Salt for hashing
     * @returns {string} Hashed password
     */
    hashPassword: (password, salt) => {
        return bcrypt.hashSync(password, salt);
    },

    /**
     * Verify password against stored hash
     * @param {string} password - Plain text password to verify
     * @param {string} hash - Stored password hash
     * @returns {boolean} True if password matches
     */
    verifyPassword: (password, hash) => {
        return bcrypt.compareSync(password, hash);
    }
};

/**
 * OTP Utilities
 * Generates and validates One-Time Passwords
 */
const otpUtils = {
    /**
     * Generate a random 6-digit OTP
     * @returns {string} 6-digit OTP
     */
    generateOTP: () => {
        return crypto.randomInt(100000, 999999).toString();
    },

    /**
     * Hash OTP for secure storage
     * @param {string} otp - Plain text OTP
     * @returns {string} Hashed OTP
     */
    hashOTP: (otp) => {
        return CryptoJS.SHA256(otp).toString();
    },

    /**
     * Verify OTP against stored hash
     * @param {string} otp - Plain text OTP to verify
     * @param {string} hash - Stored OTP hash
     * @returns {boolean} True if OTP matches
     */
    verifyOTP: (otp, hash) => {
        return CryptoJS.SHA256(otp).toString() === hash;
    }
};

/**
 * Encryption Utilities
 * Uses AES encryption for sensitive data
 */
const encryptionUtils = {
    /**
     * Encrypt data using AES
     * @param {object|string} data - Data to encrypt
     * @returns {string} Encrypted data
     */
    encrypt: (data) => {
        const dataString = typeof data === 'object' ? JSON.stringify(data) : data;
        return CryptoJS.AES.encrypt(dataString, ENCRYPTION_KEY).toString();
    },

    /**
     * Decrypt AES encrypted data
     * @param {string} encryptedData - Encrypted data string
     * @returns {object|string} Decrypted data
     */
    decrypt: (encryptedData) => {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
            const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
            try {
                return JSON.parse(decryptedString);
            } catch {
                return decryptedString;
            }
        } catch (error) {
            throw new Error('Decryption failed');
        }
    }
};

/**
 * Integrity Hash Utilities
 * Creates tamper-proof hashes for audit logging
 */
const integrityUtils = {
    /**
     * Generate integrity hash for action data
     * @param {object} actionData - Data to hash
     * @param {string} timestamp - Timestamp of action
     * @returns {string} Integrity hash
     */
    generateActionHash: (actionData, timestamp) => {
        const dataString = JSON.stringify({ ...actionData, timestamp });
        return CryptoJS.SHA256(dataString).toString();
    },

    /**
     * Verify integrity of action data
     * @param {object} actionData - Original action data
     * @param {string} timestamp - Original timestamp
     * @param {string} storedHash - Stored integrity hash
     * @returns {boolean} True if data is untampered
     */
    verifyIntegrity: (actionData, timestamp, storedHash) => {
        const computedHash = integrityUtils.generateActionHash(actionData, timestamp);
        return computedHash === storedHash;
    }
};

/**
 * Encoding Utilities
 * Base64 encoding/decoding for safe data transmission
 */
const encodingUtils = {
    /**
     * Encode data to Base64
     * @param {string} data - Data to encode
     * @returns {string} Base64 encoded string
     */
    encodeBase64: (data) => {
        return Buffer.from(data).toString('base64');
    },

    /**
     * Decode Base64 data
     * @param {string} encodedData - Base64 encoded string
     * @returns {string} Decoded data
     */
    decodeBase64: (encodedData) => {
        return Buffer.from(encodedData, 'base64').toString('utf-8');
    },

    /**
     * URL-safe Base64 encoding
     * @param {string} data - Data to encode
     * @returns {string} URL-safe Base64 encoded string
     */
    encodeBase64Url: (data) => {
        return Buffer.from(data)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    },

    /**
     * URL-safe Base64 decoding
     * @param {string} encodedData - URL-safe Base64 encoded string
     * @returns {string} Decoded data
     */
    decodeBase64Url: (encodedData) => {
        let base64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        return Buffer.from(base64, 'base64').toString('utf-8');
    }
};

/**
 * Token Generation Utilities
 */
const tokenUtils = {
    /**
     * Generate a random token
     * @param {number} length - Length of token in bytes
     * @returns {string} Random hex token
     */
    generateToken: (length = 32) => {
        return crypto.randomBytes(length).toString('hex');
    },

    /**
     * Generate a session ID
     * @returns {string} UUID-like session ID
     */
    generateSessionId: () => {
        return crypto.randomUUID();
    }
};

module.exports = {
    passwordUtils,
    otpUtils,
    encryptionUtils,
    integrityUtils,
    encodingUtils,
    tokenUtils
};
