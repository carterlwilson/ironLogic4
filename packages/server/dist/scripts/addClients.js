"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_1 = require("../models/User");
const users_1 = require("@ironlogic4/shared/types/users");
dotenv_1.default.config();
// CONFIGURABLE CONSTANT - Change this to target different gym
const GYM_ID = '690175d098cb02160ea8fc39';
const NUM_CLIENTS = 30;
const DEFAULT_PASSWORD = 'password123';
// Diverse first names from various cultural backgrounds
const firstNames = [
    // Traditional Western
    'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph',
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica',
    'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Andrew', 'Kenneth',
    'Sarah', 'Karen', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Emily',
    // Modern names
    'Emma', 'Olivia', 'Ava', 'Sophia', 'Isabella', 'Mia', 'Charlotte', 'Amelia',
    'Liam', 'Noah', 'Oliver', 'Elijah', 'Lucas', 'Mason', 'Logan', 'Alexander',
    // Diverse cultural backgrounds
    'Carlos', 'Miguel', 'Jose', 'Luis', 'Maria', 'Ana', 'Sofia', 'Isabella',
    'Wei', 'Mei', 'Chen', 'Li', 'Zhang', 'Wang', 'Liu', 'Yuki',
    'Aisha', 'Fatima', 'Omar', 'Hassan', 'Zahra', 'Aaliyah', 'Muhammad', 'Ali',
    'Raj', 'Priya', 'Amit', 'Deepak', 'Neha', 'Arjun', 'Kavya', 'Rohan'
];
// Diverse last names from various origins
const lastNames = [
    // Common Western surnames
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
    'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris',
    'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen',
    // International surnames
    'Kim', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang',
    'Chen', 'Wang', 'Li', 'Zhang', 'Liu', 'Yang', 'Huang', 'Zhao',
    'Kumar', 'Singh', 'Patel', 'Shah', 'Gupta', 'Sharma', 'Verma', 'Reddy',
    'Ahmed', 'Khan', 'Hassan', 'Ali', 'Rahman', 'Hussein', 'Malik', 'Ibrahim',
    'O\'Brien', 'Murphy', 'Kelly', 'Ryan', 'Sullivan', 'McCarthy', 'Walsh', 'Byrne'
];
/**
 * Get a random element from an array
 */
function getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
}
/**
 * Generate a unique email address
 */
function generateEmail(firstName, lastName, index) {
    const cleanFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanLastName = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
    // For the first occurrence, use just firstname.lastname
    // For duplicates, append the index number
    if (index === 0) {
        return `${cleanFirstName}.${cleanLastName}@example.com`;
    }
    return `${cleanFirstName}.${cleanLastName}${index}@example.com`;
}
/**
 * Check if an email already exists in the database
 */
async function emailExists(email) {
    const existingUser = await User_1.User.findOne({ email });
    return !!existingUser;
}
/**
 * Create a single client with the given details
 */
async function createClient(firstName, lastName, email, password, gymId) {
    const user = new User_1.User({
        email,
        firstName,
        lastName,
        userType: users_1.UserType.CLIENT,
        password, // Will be hashed by the pre-save hook
        gymId,
        // programId is undefined (not assigned to any program)
        currentBenchmarks: [],
        historicalBenchmarks: []
    });
    await user.save();
}
/**
 * Main function to create clients
 */
async function main() {
    try {
        console.log('Starting client creation...');
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ironlogic4';
        await mongoose_1.default.connect(mongoUri);
        console.log('Connected to MongoDB');
        console.log(`\nCreating ${NUM_CLIENTS} clients for gym: ${GYM_ID}\n`);
        let createdCount = 0;
        const usedCombinations = new Set();
        // Create clients
        for (let i = 0; i < NUM_CLIENTS; i++) {
            let firstName;
            let lastName;
            let email;
            let emailIndex = 0;
            let combination;
            // Generate unique name combination
            do {
                firstName = getRandomElement(firstNames);
                lastName = getRandomElement(lastNames);
                combination = `${firstName}-${lastName}`;
            } while (usedCombinations.has(combination));
            usedCombinations.add(combination);
            // Generate unique email
            do {
                email = generateEmail(firstName, lastName, emailIndex);
                emailIndex++;
                // Safety check to prevent infinite loop
                if (emailIndex > 100) {
                    throw new Error(`Could not generate unique email for ${firstName} ${lastName}`);
                }
            } while (await emailExists(email));
            // Create the client
            try {
                await createClient(firstName, lastName, email, DEFAULT_PASSWORD, GYM_ID);
                createdCount++;
                console.log(`✓ Created client ${createdCount}/${NUM_CLIENTS}: ${firstName} ${lastName} (${email})`);
            }
            catch (error) {
                if (error.code === 11000) {
                    // Duplicate key error - skip this one
                    console.log(`✗ Skipped duplicate: ${firstName} ${lastName} (${email})`);
                    i--; // Retry this iteration
                }
                else {
                    throw error;
                }
            }
        }
        console.log(`\n✓ Successfully created ${createdCount} clients`);
    }
    catch (error) {
        console.error('Error creating clients:', error);
        process.exit(1);
    }
    finally {
        // Disconnect from MongoDB
        await mongoose_1.default.disconnect();
        console.log('Disconnected from MongoDB');
    }
}
// Run the script
main();
//# sourceMappingURL=addClients.js.map