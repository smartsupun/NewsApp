import { Platform } from 'react-native';

// Database instance
let db: any = null;

// Get database connection
export const getDatabaseConnection = async () => {
    if (Platform.OS === 'web') {
        console.warn('SQLite is not supported on web platform');
        return null;
    }

    try {
        if (!db) {
            console.log('Attempting to connect to database...');

            // Try to load the SQLite module and inspect it
            try {
                // @ts-ignore
                const sqlite = require('expo-sqlite/next');
                console.log('Successfully required expo-sqlite/next');
                console.log('Available functions in expo-sqlite/next:', Object.keys(sqlite));

                // Try to find the correct function to open a database
                if (typeof sqlite.openDatabase === 'function') {
                    console.log('Found openDatabase function');
                    // @ts-ignore
                    db = await sqlite.openDatabase('newsapp.db');
                } else if (typeof sqlite.default?.openDatabase === 'function') {
                    console.log('Found openDatabase in default export');
                    // @ts-ignore
                    db = await sqlite.default.openDatabase('newsapp.db');
                } else if (typeof sqlite.createAsync === 'function') {
                    console.log('Found createAsync function');
                    // @ts-ignore
                    db = await sqlite.createAsync({ name: 'newsapp.db' });
                } else if (typeof sqlite.default?.createAsync === 'function') {
                    console.log('Found createAsync in default export');
                    // @ts-ignore
                    db = await sqlite.default.createAsync({ name: 'newsapp.db' });
                } else {
                    // Try to see if there's any function that might open a database
                    for (const key of Object.keys(sqlite)) {
                        console.log(`Checking function: ${key}, type: ${typeof sqlite[key]}`);
                    }

                    // If we have a default export, check that too
                    if (sqlite.default) {
                        console.log('Default export functions:', Object.keys(sqlite.default));
                        for (const key of Object.keys(sqlite.default)) {
                            console.log(`Checking default.${key}, type: ${typeof sqlite.default[key]}`);
                        }
                    }

                    throw new Error('Could not find a suitable function to open the database');
                }
            } catch (nextError) {
                if (nextError instanceof Error) {
                    console.log('Error with expo-sqlite/next:', nextError.message);
                } else {
                    console.log('Error with expo-sqlite/next:', nextError);
                }

                // Try the regular expo-sqlite module
                try {
                    // @ts-ignore
                    const sqlite = require('expo-sqlite');
                    console.log('Successfully required expo-sqlite');
                    console.log('Available functions in expo-sqlite:', Object.keys(sqlite));

                    // Try to find the correct function to open a database
                    if (typeof sqlite.openDatabase === 'function') {
                        console.log('Found openDatabase function in standard module');
                        // @ts-ignore
                        db = sqlite.openDatabase('newsapp.db');
                    } else if (typeof sqlite.default?.openDatabase === 'function') {
                        console.log('Found openDatabase in default export of standard module');
                        // @ts-ignore
                        db = sqlite.default.openDatabase('newsapp.db');
                    } else {
                        // Try to see if there's any function that might open a database
                        for (const key of Object.keys(sqlite)) {
                            console.log(`Checking function: ${key}, type: ${typeof sqlite[key]}`);
                        }

                        // If we have a default export, check that too
                        if (sqlite.default) {
                            console.log('Default export functions in standard module:', Object.keys(sqlite.default));
                        }

                        throw new Error('Could not find a suitable function to open the database in standard module');
                    }
                } catch (standardError) {
                    if (standardError instanceof Error) {
                        console.log('Error with standard expo-sqlite:', standardError.message);
                    } else {
                        console.log('Error with standard expo-sqlite:', standardError);
                    }
                    throw new Error('Failed to connect to SQLite database: ' + (standardError instanceof Error ? standardError.message : standardError));
                }
            }

            console.log('Database connection established successfully');
        }
        return db;
    } catch (error) {
        console.error('Failed to open database:', error);
        return null;
    }
};

// Execute a query with parameters - will adapt based on what we find
export const executeQuery = async (query: string, params: any[] = []) => {
    try {
        const database = await getDatabaseConnection();
        if (!database) {
            console.warn('Database connection could not be established');
            return null;
        }

        console.log(`Executing query: ${query.substring(0, 50)}...`);

        // Try to find the right method to execute a query
        if (typeof database.execAsync === 'function') {
            return await database.execAsync(query, params);
        } else if (typeof database.exec === 'function') {
            return await database.exec([{ sql: query, args: params }]);
        } else {
            // Fallback to transaction API if available
            return new Promise((resolve, reject) => {
                try {
                    database.transaction(
                        (tx: any) => {
                            tx.executeSql(
                                query,
                                params,
                                (_: any, result: any) => resolve(result),
                                (_: any, error: any) => {
                                    reject(error);
                                    return false;
                                }
                            );
                        },
                        (error: any) => reject(error)
                    );
                } catch (error) {
                    console.error('Error with transaction API:', error);
                    reject(error);
                }
            });
        }
    } catch (error) {
        console.error('Error executing query:', error, query, params);
        throw error;
    }
};

// Execute a select query and return the rows
export const executeSelectQuery = async (query: string, params: any[] = []) => {
    try {
        const database = await getDatabaseConnection();
        if (!database) {
            console.warn('Database connection could not be established');
            return [];
        }

        console.log(`Executing select query: ${query.substring(0, 50)}...`);

        // Try to find the right method to execute a select query
        if (typeof database.getAllAsync === 'function') {
            return await database.getAllAsync(query, params);
        } else if (typeof database.exec === 'function') {
            const result = await database.exec([{ sql: query, args: params }]);
            return result[0]?.rows || [];
        } else {
            // Fallback to transaction API if available
            return new Promise((resolve, reject) => {
                try {
                    database.transaction(
                        (tx: any) => {
                            tx.executeSql(
                                query,
                                params,
                                (_: any, result: any) => {
                                    const rows = [];
                                    for (let i = 0; i < result.rows.length; i++) {
                                        rows.push(result.rows.item(i));
                                    }
                                    resolve(rows);
                                },
                                (_: any, error: any) => {
                                    reject(error);
                                    return false;
                                }
                            );
                        },
                        (error: any) => reject(error)
                    );
                } catch (error) {
                    console.error('Error with transaction API:', error);
                    reject(error);
                }
            });
        }
    } catch (error) {
        console.error('Error executing select query:', error, query, params);
        throw error;
    }
};

// Initialize the database schema
export const initDatabase = async () => {
    try {
        console.log('Getting database connection...');
        const database = await getDatabaseConnection();
        if (!database) {
            throw new Error('Database connection could not be established');
        }

        console.log('Connected to database, initializing schema...');

        // Create tables using the available method
        const createUserTable = `
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY NOT NULL,
        firstName TEXT,
        lastName TEXT,
        email TEXT UNIQUE NOT NULL,
        mobileNumber TEXT,
        dateOfBirth TEXT,
        profilePicture TEXT,
        authProvider TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        lastLoginAt TEXT NOT NULL,
        preferences TEXT
      );
    `;

        const createActiveAccountsTable = `
      CREATE TABLE IF NOT EXISTS active_accounts (
        userId TEXT PRIMARY KEY NOT NULL,
        lastActive TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users (id)
      );
    `;

        console.log('Creating users table...');
        await executeQuery(createUserTable, []);

        console.log('Creating active_accounts table...');
        await executeQuery(createActiveAccountsTable, []);

        console.log('Database initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

// Export the database interface
export default {
    init: initDatabase,
    executeQuery,
    executeSelectQuery
};