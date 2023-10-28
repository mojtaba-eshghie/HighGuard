const sqlite3 = require('sqlite3').verbose();
const readline = require('readline');
const bcrypt = require('bcrypt');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', '..', 'dbs', 'auth.db');
const SALT_ROUNDS = 10;

/**
 * Prompts the user to enter their username and password via the console.
 *
 * @returns {Promise<Object>} A promise that resolves with an object containing the entered username and password.
 */
let ask = () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve) => {
        rl.question('Username: ', (username) => {
            rl.question('Password: ', (password) => {
                rl.close();
                resolve({ username, password });
            });
        });
    });
};

/**
 * Creates and returns a new SQLite database connection.
 *
 * @returns {Object} The SQLite database connection object.
 */
let create_db = () => {
    return new sqlite3.Database(DB_PATH);
};

/**
 * Creates the 'users' table in the specified database if it doesn't already exist.
 *
 * @param {Object} db - The SQLite database connection object.
 * @returns {Promise} A promise that resolves when the table is created, or rejects with an error.
 */
let create_table = (db) => {
    const query = `
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT
        );
    `;

    return new Promise((resolve, reject) => {
        db.run(query, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

/**
 * Inserts a new user record into the 'users' table.
 *
 * @param {Object} db - The SQLite database connection object.
 * @param {Object} user - An object containing the username and password of the user.
 * @returns {Promise} A promise that resolves when the user is inserted, or rejects with an error.
 */
let insert = async (db, { username, password }) => {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const query = `INSERT INTO users (username, password) VALUES (?, ?)`;

    return new Promise((resolve, reject) => {
        db.run(query, [username, hashedPassword], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

/**
 * Retrieves all user records from the 'users' table.
 *
 * @returns {Promise<Array>} A promise that resolves with an array of user records, or rejects with an error.
 */
let getUser = async () => {
    const db = create_db();
    const query = `SELECT * FROM users`;

    return new Promise((resolve, reject) => {
        db.all(query, [], (err, rows) => {
            db.close();
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

/**
 * Authenticates a user by checking the database for stored credentials.
 * If no users exist in the database, prompts the user to create a new account.
 *
 * @returns {Promise<Object>} A promise that resolves with the authenticated user's information,
 *                            or rejects with an error if authentication fails.
 */
let authenticate = async () => {
    const db = create_db();
    await create_table(db);
    const users = await getUser();

    if (users.length === 0) {
        const newUser = await ask();
        await insert(db, newUser);
        db.close();
        return newUser;
    } else {
        const userRecord = users[0];  // Since there's only one user, it's at index 0
        db.close();
        return { username: userRecord.username, password: userRecord.password };  // Return the stored credentials
    }
};

module.exports = authenticate;