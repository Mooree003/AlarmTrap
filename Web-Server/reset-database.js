const mysql = require('mysql2');

// Database connection configuration
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
});

// Connect to MySQL
db.connect((err) => {
    if (err) {
        console.error('Database connection error:', err);
        process.exit(1);
    }

    console.log('Connected to MySQL');

    // Drop the existing database if it exists
    db.query('DROP DATABASE IF EXISTS myapp', (err) => {
        if (err) {
            console.error('Error dropping database:', err);
            process.exit(1);
        }

        console.log('Database dropped (if it existed)');

        // Create a new database
        db.query('CREATE DATABASE myapp', (err) => {
            if (err) {
                console.error('Error creating database:', err);
                process.exit(1);
            }

            console.log('Database created');

            // Use the new database
            db.query('USE myapp', (err) => {
                if (err) {
                    console.error('Error selecting database:', err);
                    process.exit(1);
                }

                console.log('Database selected');

                // Create users table
                const createUsersTable = `
                    CREATE TABLE IF NOT EXISTS users (
                        email VARCHAR(255) NOT NULL UNIQUE,
                        password VARCHAR(255) NOT NULL
                    )
                `;
                db.query(createUsersTable, (err) => {
                    if (err) {
                        console.error('Error creating users table:', err);
                        process.exit(1);
                    } else {
                        console.log('Users table created or already exists');
                    }

                    // Create logs table
                    const createLogsTable = `
                        CREATE TABLE IF NOT EXISTS logs (
                            id INT AUTO_INCREMENT PRIMARY KEY,
                            image LONGBLOB NOT NULL,
                            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
                        )
                    `;
                    db.query(createLogsTable, (err) => {
                        if (err) {
                            console.error('Error creating logs table:', err);
                            process.exit(1);
                        } else {
                            console.log('Logs table created or already exists');

                            // Create codes table
                            const createCodesTable = `
                                CREATE TABLE IF NOT EXISTS codes (
                                    id INT AUTO_INCREMENT PRIMARY KEY,
                                    activation_code CHAR(4) NOT NULL
                                )
                            `;
                            db.query(createCodesTable, (err) => {
                                if (err) {
                                    console.error('Error creating codes table:', err);
                                    process.exit(1);
                                } else {
                                    console.log('Codes table created');

                                    // Insert default activation code '0000'
                                    const insertDefaultCode = `
                                        INSERT INTO codes (activation_code) VALUES ('0000')
                                        ON DUPLICATE KEY UPDATE activation_code=activation_code
                                    `;
                                    db.query(insertDefaultCode, (err) => {
                                        if (err) {
                                            console.error('Error inserting default activation code:', err);
                                            process.exit(1);
                                        } else {
                                            console.log('Default activation code "0000" inserted');

                                            // Create alarm_state table
                                            const createAlarmStateTable = `
                                                CREATE TABLE IF NOT EXISTS alarm_state (
                                                    state INT DEFAULT 0
                                                )
                                            `;
                                            db.query(createAlarmStateTable, (err) => {
                                                if (err) {
                                                    console.error('Error creating alarm_state table:', err);
                                                    process.exit(1);
                                                } else {
                                                    console.log('Alarm state table created or already exists');

                                                    // Insert default alarm state
                                                    const insertDefaultAlarmState = `
                                                        INSERT INTO alarm_state (state) VALUES (0)
                                                        ON DUPLICATE KEY UPDATE state=state
                                                    `;
                                                    db.query(insertDefaultAlarmState, (err) => {
                                                        if (err) {
                                                            console.error('Error inserting default alarm state:', err);
                                                            process.exit(1);
                                                        } else {
                                                            console.log('Default alarm state inserted or already exists');
                                                            
                                                            // Done
                                                            console.log('Database reset completed successfully.');
                                                            db.end(); // Close the database connection
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                });
            });
        });
    });
});
