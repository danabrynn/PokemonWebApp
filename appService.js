const oracledb = require('oracledb');
const loadEnvFile = require('./utils/envUtil');

const envVariables = loadEnvFile('./.env');

// Database configuration setup. Ensure your .env file has the required database credentials.
const dbConfig = {
    user: envVariables.ORACLE_USER,
    password: envVariables.ORACLE_PASS,
    connectString: `${envVariables.ORACLE_HOST}:${envVariables.ORACLE_PORT}/${envVariables.ORACLE_DBNAME}`,
    poolMin: 1,
    poolMax: 3,
    poolIncrement: 1,
    poolTimeout: 60
};

// initialize connection pool
async function initializeConnectionPool() {
    try {
        await oracledb.createPool(dbConfig);
        console.log('Connection pool started');
    } catch (err) {
        console.error('Initialization error: ' + err.message);
    }
}

async function closePoolAndExit() {
    console.log('\nTerminating');
    try {
        await oracledb.getPool().close(10); // 10 seconds grace period for connections to finish
        console.log('Pool closed');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

initializeConnectionPool();

process
    .once('SIGTERM', closePoolAndExit)
    .once('SIGINT', closePoolAndExit);


// ----------------------------------------------------------
// Wrapper to manage OracleDB actions, simplifying connection handling.
async function withOracleDB(action) {
    let connection;
    try {
        connection = await oracledb.getConnection(); // Gets a connection from the default pool
        return await action(connection);
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}


// ----------------------------------------------------------
// Core functions for database operations
// Modify these functions, especially the SQL queries, based on your project's requirements and design.
async function testOracleConnection() {
    return await withOracleDB(async (connection) => {
        return true;
    }).catch(() => {
        return false;
    });
}

async function fetchPlayerPokemonFromDb(username) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT nickname, name, pp_level FROM Player_Pokemon WHERE tr_username = :username`, [username]);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function countPlayerPokemonByType(username) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT type, COUNT(*) FROM Player_Pokemon, Pokemon_Type 
            WHERE Player_Pokemon.name = Pokemon_Type.name AND tr_username = :username
            GROUP BY type`, [username]);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function fetchPlayerItemsFromDb(username) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT Trainer_Items.name, Items.effect, Trainer_Items.quantity FROM Trainer_Items, Items 
            WHERE Trainer_Items.name = Items.name AND username = :username`, [username]);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function fetchPlayerBadgesFromDb(username) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT badge, gym FROM Trainer_Badges WHERE username = :username`, [username]);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function fetchPlayerBadgesRemainingFromDb(username, gym) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT name FROM Badge WHERE gym_name = :gym 
            MINUS 
            SELECT badge FROM Trainer_Badges WHERE username = :username AND gym = :gym`,
            [gym, username, gym]);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// Fetch items table from database*/
async function fetchItemstableFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM Items');
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// Fetch items table order by name alphebetically
async function fetchItemsAlphabetic() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM Items ORDER BY name');
        return result.rows;
    }).catch(() => {
        return [];
    });
}


// Fetch item berry table from database*/
async function fetchItemsberryFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute("SELECT * FROM Items WHERE NAME LIKE '%berry%' ");
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// Fetch item medicine table from database*/
async function fetchItemsmedicineFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute("SELECT * FROM Items WHERE NAME NOT LIKE '%berry%' ");
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// Fetch berry from berry table from database*/
async function fetchBerryByNameFromDb(name) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT * FROM Berries WHERE name = :name`, [name]);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// Fetch medicine from medicine table from database*/
async function fetchMedicineByNameFromDb(name) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT * FROM Medicine WHERE name = :name`, [name]);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

//funtion to filter item by name
async function fetchItembyNameFromDb(name) {
    return await withOracleDB(async (connection) => {
        //Pass name as a variable to sql query
        const result = await connection.execute(`SELECT * FROM Items WHERE NAME = :name`, [name]);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// function the summarize berry count and medicine count
async function summarizeItem() {
    return await withOracleDB(async (connection) => {
        //Pass name as a variable to sql query
        const result = await connection.execute(
            `SELECT COUNT(CASE WHEN name LIKE '%berry%' THEN 1 END) AS berry_count, 
            COUNT(CASE WHEN name NOT LIKE '%berry' THEN 1 END) AS medicine 
            FROM items`);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

//function to fetch trainer_items by username and item
async function fetchUserAndItemFromDb(username, itemname) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT * FROM Trainer_Items WHERE name = :itemname AND username= :username`, { itemname: itemname, username: username });
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// Function to insert itemname, username, quantity to trainer_item table
async function insertTrainerAndItem(name, username, quantity) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `INSERT INTO Trainer_Items(name, username, quantity) VALUES (:name, :username, :quantity)`,
            [name, username, quantity],
            { autoCommit: true }
        );
        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

// function to insert quantity to trainer_item table
async function updateQuantity(name, username, quantity) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `UPDATE Trainer_Items SET quantity=:quantity WHERE name=:name AND username=:username`,
            [quantity, name, username],
            { autoCommit: true }
        );
        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

// Insert zipcode and timezone to Timezone table
async function insertTimezoneDb(zipcode, timezone) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `INSERT INTO Timezone (zip_postal_code, timezone) VALUES (:zipcode, :timezone)`,
            [zipcode, timezone],
            { autoCommit: true }
        );
        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

//function to fetch trainer by username and password
async function fetchUserFromDb(username, password) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT * FROM Trainer WHERE username = :username AND password = :password`, { username: username, password: password });
        return result.rows;
    }).catch(() => {
        return [];
    });
}

//function to fetch trainer by username
async function fetchUserbyUsernameFromDb(username) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT * FROM Trainer WHERE username = :username`, { username: username });
        return result.rows;
    }).catch(() => {
        return [];
    });
}

//function to fetch timezone table by zipcode and timezone
async function fetchTimezoneFromDb(zipcode) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT * FROM Timezone WHERE zip_postal_code = :zipcode`, { zipcode: zipcode });
        return result.rows;
    }).catch(() => {
        return [];
    });
}

//function to insert new user
async function insertUserToDb(username, name, password, startdate, zipcode) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `INSERT INTO Trainer (username, name, password, start_date, zip_postal_code) VALUES (:username, :name, :password, :startdate, :zipcode)`,
            [username, name, password, startdate, zipcode],
            { autoCommit: true }
        );
        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

// Update user zipcode
async function updateUserZipcode(username, zipcode) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `UPDATE Trainer 
            SET zip_postal_code=:zipcode 
            WHERE username=:username`,
            [zipcode, username],
            { autoCommit: true }
        );
        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function fetchGymsFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM Gym');
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function insertPlayerBadge(gym, username, badge) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `INSERT INTO Trainer_Badges (gym, username, badge) VALUES (:gym, :username, :badge)`,
            [gym, username, badge],
            { autoCommit: true }
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

// inserts battle and returns auto generated battle id
async function insertBattle(date, winner) {
    return await withOracleDB(async (connection) => {
        let battle_date = date;
        const result = await connection.execute(
            `INSERT INTO Battle (battle_date, winner) VALUES (TO_DATE(:battle_date, 'dd/mm/yyyy'), :winner)`,
            [battle_date, winner],
            { autoCommit: true }
        );
        const battleid = await connection.execute(`SELECT id FROM Battle WHERE ROWID = :lastRow`, { lastRow: `${result.lastRowid}` });
        return battleid.rows[0][0];
    }).catch(() => {
        return -1;
    });
}

async function insertGymChallenge(gym, username, battle) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `INSERT INTO Gym_Challenges (gym, username, battle_id) VALUES (:gym, :username, :battle)`,
            [gym, username, battle],
            { autoCommit: true }
        );
        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}


// fetches all pokemon names in the current databse
async function fetchPokemonFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT name FROM Pokemon');
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// fetches all the moves an player pokemon has learned
async function fetchLearnedMovesFromDb(username, pokemon, nickname) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT move FROM Learned_Moves WHERE name=:pokemon AND nickname=:nickname AND tr_username=:username',
            [pokemon, nickname, username]
        );
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// Fetches the evolutions chart from the database
async function fetchEvolutionsFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT * FROM Evolutions');
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// Dynamically filter pokemon form database based on user inputted filters and parameters.
// A map is used to ensure parameter order and construct the base sql string based on given 
// filter paramters. Bind variables are used to securely pass user input to the query.
async function fetchPokedexFiltersFromDb(pokeBinds) {

    return await withOracleDB(async (connection) => {
        let filter_sql = "SELECT DISTINCT p.name FROM Pokemon p, Pokemon_Type pt WHERE p.name=pt.name";
        let sql_map = {
            "pokeattack": ` and p.attack >= `,
            "pokedefence": ` and p.defence >= `,
            "pokespeed": ` and p.speed >= `,
            "poketype": ` and pt.type = `
        }

        for (const [key, value] of pokeBinds) {
            if (key === 'type') {
                filter_sql += `${sql_map[key]}`;
                filter_sql += `':${key}'`;
            } else {
                filter_sql += `${sql_map[key]}`;
                filter_sql += `:${key}`;
            }
        }
        const bindValues = Array.from(pokeBinds.values());
        const result = await connection.execute(filter_sql, bindValues);
        return result.rows;
    }).catch(() => {
        return -1;
    });
}

// Fetches the effectiveness multiplier for the given attack and defense type
async function fetchTypeMatchupFromDb(attack, defence) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT effect_multiplier FROM Type_Versus WHERE attack_type=:attack and defense_type=:defence`,
            [attack, defence]
        );
        return result.rows[0][0];
    }).catch(() => {
        return -1;
    });

}


// Fetches the pokemon mathcing a given name in the database
async function fetchPokemonByNameFromDb(name) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT name FROM Pokemon 
                                                WHERE name LIKE :name`, { name: `%${name}%` });
        return result.rows;
    }).catch(() => {
        return [];
    });

}


// Fetches the pokemon mathcing a given name in the database
async function fetchPokemonLeaderboardFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT username, start_date
                                                 FROM Trainer t
                                                 WHERE t.username IN 
                                                    (SELECT DISTINCT tr_username
                                                    FROM Player_Pokemon pp1
                                                    WHERE NOT EXISTS ((SELECT name FROM Pokemon)
                                                                        MINUS
                                                                        (SELECT name
                                                                         FROM Player_Pokemon pp2
                                                                         WHERE pp2.tr_username=pp1.tr_username)))`);
        return result.rows;
    }).catch(() => {
        return [];
    });

}

// Fetches the pokemon mathcing a given name in the database
async function fetchGymLeaderboardFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT username, COUNT(badge)
                                                FROM Trainer_Badges
                                                GROUP BY username
                                                HAVING COUNT(badge) >= 1
                                                ORDER BY COUNT(badge) DESC`);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// Fetches the pokemon mathcing a given name in the database
async function fetchFrequentBuyersFromDb() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT username, SUM(quantity) 
                                                FROM Trainer_Items 
                                                GROUP BY username
                                                HAVING SUM(quantity) >= (
                                                                        SELECT AVG(item_quantity)
                                                                        FROM (
                                                                                SELECT SUM(quantity) AS item_quantity
                                                                                FROM Trainer_items
                                                                                GROUP BY username
                                                                              )
                                                                         )
                                                ORDER BY SUM(quantity) DESC `);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// Update the user's name in the database
async function updateName(currentuser, newNameValue) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `UPDATE Trainer 
             SET name=:newNameValue 
             WHERE username=:currentuser`,
            [newNameValue, currentuser],
            { autoCommit: true }
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

// Update the user's name in the database
async function updatePassword(currentuser, newPasswordValue) {
    return await withOracleDB(async (connection) => {

        const result = await connection.execute(
            `UPDATE Trainer 
             SET password=:newPasswordValue 
             WHERE username=:currentuser`,
            [newPasswordValue, currentuser],
            { autoCommit: true }
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}



// Insert a new player pokemon after catching it
async function insertPlayerPokemon(name, nickname, tr_username, pp_level) {
    return await withOracleDB(async (connection) => {

        const result = await connection.execute(
            `INSERT INTO Player_Pokemon (name, nickname, tr_username, pp_level) VALUES (:name, :nickname, :tr_username, :pp_level)`,
            [name, nickname, tr_username, pp_level],
            { autoCommit: true }
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function deletePlayerPokemonFromDb(username, pokemon, nickname) {
    return await withOracleDB(async (connection) => {

        const result = await connection.execute(`DELETE FROM Player_Pokemon 
            WHERE tr_username = :username AND name = :pokemon AND nickname = :nickname`,
            [username, pokemon, nickname],
            { autoCommit: true }
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

// Insert a new player pokemon move after catching it
async function insertPlayerPokemonMove(move, name, nickname, tr_username) {
    return await withOracleDB(async (connection) => {

        const result = await connection.execute(
            `INSERT INTO Learned_Moves (move, name, nickname, tr_username) VALUES (:move, :name, :nickname, :tr_username)`,
            [move, name, nickname, tr_username],
            { autoCommit: true }
        );
        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

// Queries HP, ATTACK, DEFENCE, SPEED, GENERATION, TYPES, MOVES of a pokemon by NAME
// Note: Return is an array of rows:
// ex. name = 'butterfree'
//     result = rows: [
//     [ 60, 45, 50, 70, 1, 'bug', 'air slash' ],
//     [ 60, 45, 50, 70, 1, 'bug', 'bug bite' ],
//     [ 60, 45, 50, 70, 1, 'bug', 'confusion' ],
//     [ 60, 45, 50, 70, 1, 'bug', 'gust' ],
//     [ 60, 45, 50, 70, 1, 'flying', 'air slash' ],
//     [ 60, 45, 50, 70, 1, 'flying', 'bug bite' ],
//     [ 60, 45, 50, 70, 1, 'flying', 'confusion' ],
//     [ 60, 45, 50, 70, 1, 'flying', 'gust' ]
//   ]
async function fetchPokemonStatsFromDb(pokemonName) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT hp, attack, defence, speed, generation, type, move
                                                FROM Pokemon p, Pokemon_Type t, Can_Learn l
                                                WHERE p.name=t.name and t.name=l.pokemon and p.name=:pokemonName`, [pokemonName]);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// Count number of player pokemon
async function countPlayerPokemon(username) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT Count(*) FROM Player_Pokemon WHERE tr_username =:username`, [username]);
        return result.rows[0][0];
    }).catch(() => {
        return -1;
    });
}

async function updatePokemonLevel(name, nickname, username, pplevel) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `UPDATE Player_Pokemon 
             SET pp_level=:pplevel 
             WHERE name=:name AND nickname=:nickname AND tr_username=:username`,
            [pplevel, name, nickname, username],
            { autoCommit: true }
        );

        return result.rowsAffected && result.rowsAffected > 0;
    }).catch(() => {
        return false;
    });
}

async function fetchTableNames() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT TABLE_NAME FROM USER_TABLES`);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function fetchColumnNames(tableName) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT COLUMN_NAME FROM USER_TAB_COLS WHERE TABLE_NAME = :tableName`, [tableName]);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

async function fetchSpecifiedColumnsFromDB(tableName, columnsList) {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`SELECT ${columnsList} FROM ${tableName}`);
        return result.rows;
    }).catch(() => {
        return [];
    });
}


module.exports = {
    testOracleConnection,
    fetchPlayerPokemonFromDb,
    fetchGymsFromDb,
    fetchPokemonFromDb,
    fetchEvolutionsFromDb,
    fetchItemstableFromDb,
    fetchItemsberryFromDb,
    fetchItemsmedicineFromDb,
    fetchItembyNameFromDb,
    fetchItemsAlphabetic,
    summarizeItem,
    fetchBerryByNameFromDb,
    fetchMedicineByNameFromDb,
    fetchUserAndItemFromDb,
    updateQuantity,
    insertTrainerAndItem,
    insertTimezoneDb,
    fetchUserbyUsernameFromDb,
    fetchTimezoneFromDb,
    insertBattle,
    fetchPlayerBadgesFromDb,
    insertGymChallenge,
    fetchUserFromDb,
    insertUserToDb,
    insertBattle,
    fetchTypeMatchupFromDb,
    fetchPokemonByNameFromDb,
    fetchPokemonStatsFromDb,
    insertPlayerBadge,
    insertPlayerPokemon,
    insertPlayerPokemonMove,
    fetchLearnedMovesFromDb,
    fetchPlayerItemsFromDb,
    deletePlayerPokemonFromDb,
    fetchPokemonLeaderboardFromDb,
    fetchGymLeaderboardFromDb,
    updateName,
    updatePassword,
    updateUserZipcode,
    countPlayerPokemonByType,
    countPlayerPokemon,
    updatePokemonLevel,
    fetchTableNames,
    fetchColumnNames,
    fetchSpecifiedColumnsFromDB,
    fetchPokedexFiltersFromDb,
    fetchFrequentBuyersFromDb,
    fetchPlayerBadgesRemainingFromDb
};