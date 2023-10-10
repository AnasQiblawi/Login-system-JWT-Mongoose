// Dependencies
const bcrypt = require('bcrypt');
const crypto = require("node:crypto"); // node:crypto == crypto == webcrypto

// Configs
const { algorithm, secretKey/*: cryptingSecretKey*/ } = global.configs.crypting;

// Hash -----------------------------------------------------
const hashing = {
    hash: async (text, difficulty = 5) => { return await bcrypt.hash(text, difficulty) },
    compare: async (text, hash) => { return await bcrypt.compare(text, hash) },
};


// Encryption -----------------------------------------------

// Define the algorithm and the cryptingSecretKey
// const algorithm = 'aes-256-cbc';
// const cryptingSecretKey = '~`1!Qa';

// const crypting = {
//     encrypt: async (text) => {
//         // Create a cipher object
//         const cipher = crypto.createCipher(algorithm, cryptingSecretKey);
//         // Encrypt the text
//         const encrypted = await cipher.update(text, 'utf8', 'hex') + cipher.final('hex');
//         return encrypted;
//     },
//     decrypt: async (encryptedText) => {
//         // Create a decipher object
//         const decipher = crypto.createDecipher(algorithm, cryptingSecretKey);
//         // Decrypt the text
//         const decrypted = await decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8');
//         return decrypted;
//     },
//     compare: async (text, encryptedText) => {
//         try {            
//             // Create a decipher object
//             const decipher = crypto.createDecipher(algorithm, cryptingSecretKey);
//             // Decrypt the text
//             const decryptedText = await decipher.update(encryptedText, 'hex', 'utf8') + decipher.final('utf8');

//             // Compare
//             return (text === decryptedText);
//         } catch (err) { }
//         return false
//     }
// };


class Crypter {
    constructor({ secretKey, algorithm }) {
        this.algorithm = algorithm || 'aes-256-cbc';
        this.secretKey = secretKey || 'secretKey';
    }

    encrypt(text) {
        const cipher = crypto.createCipher(this.algorithm, this.secretKey);
        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        return encrypted;
    }

    decrypt(encryptedText) {
        const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }

    compare(text, encryptedText) {
        try {
            const decryptedText = this.decrypt(encryptedText); // decrypt
            return (text === decryptedText); // compare: true/false
        } catch (err) {
            return false;
        }
    }
}



// Export ----------------------------------------------------
module.exports = {
    hashing,
    crypting: new Crypter({ secretKey })
};