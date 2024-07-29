/*
 * These functions below are for various webpage functionalities.
 * Each function serves to process data on the frontend:
 *      - Before sending requests to the backend.
 *      - After receiving responses from the backend.
 *
 * To tailor them to your specific needs,
 * adjust or expand these functions to match both your
 *   backend endpoints
 * and
 *   HTML structure.
 *
 */

// TODO: update this, using for now in place of login

let trainer = ""; //initial setup of global variable trainer
const username = "Suicune7"

// This function checks the database connection and updates its status on the frontend.
async function checkDbConnection() {
    const statusElem = document.getElementById('dbStatus');
    // const loadingGifElem = document.getElementById('loadingGif');

    const response = await fetch('/check-db-connection', {
        method: "GET"
    });

    // Hide the loading GIF once the response is received.
    // loadingGifElem.style.display = 'none';
    // Display the statusElem's text in the placeholder.
    statusElem.style.display = 'inline';

    response.text()
    .then((text) => {
        statusElem.textContent = text;
    })
    .catch((error) => {
        statusElem.textContent = 'connection timed out';  // Adjust error handling if required.
    });
}

// Fetches data from the demotable and displays it.
// Modified this so that it updates any table with data fetched from 'endpoint'
async function fetchAndDisplayUsers(elementID, endpoint, user = null) {
    const tableElement = document.getElementById(elementID);
    const tableBody = tableElement.querySelector('tbody');

    const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
            'username': user
        }
    });

    const responseData = await response.json();
    const demotableContent = responseData.data;

    // Always clear old, already fetched data before new fetching process.
    if (tableBody) {
        tableBody.innerHTML = '';
    }

    demotableContent.forEach(user => {
        const row = tableBody.insertRow();
        user.forEach((field, index) => {
            const cell = row.insertCell(index);
            cell.textContent = field;
        });
    });
}

// This function resets or initializes the demotable.
async function resetDemotable() {
    const response = await fetch("/initiate-demotable", {
        method: 'POST'
    });
    const responseData = await response.json();

    if (responseData.success) {
        const messageElement = document.getElementById('resetResultMsg');
        messageElement.textContent = "demotable initiated successfully!";
        fetchTableData();
    } else {
        alert("Error initiating table!");
    }
}

// Inserts new records into the demotable.
async function insertDemotable(event) {
    event.preventDefault();

    const idValue = document.getElementById('insertId').value;
    const nameValue = document.getElementById('insertName').value;

    const response = await fetch('/insert-demotable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            id: idValue,
            name: nameValue
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('insertResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Data inserted successfully!";
        fetchTableData();
    } else {
        messageElement.textContent = "Error inserting data!";
    }
}

// Updates names in the demotable.
async function updateNameDemotable(event) {
    event.preventDefault();

    const oldNameValue = document.getElementById('updateOldName').value;
    const newNameValue = document.getElementById('updateNewName').value;

    const response = await fetch('/update-name-demotable', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            oldName: oldNameValue,
            newName: newNameValue
        })
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('updateNameResultMsg');

    if (responseData.success) {
        messageElement.textContent = "Name updated successfully!";
        fetchTableData();
    } else {
        messageElement.textContent = "Error updating name!";
    }
}

// Counts rows in the demotable.
// Modify the function accordingly if using different aggregate functions or procedures.
async function countDemotable() {
    const response = await fetch("/count-demotable", {
        method: 'GET'
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('countResultMsg');

    if (responseData.success) {
        const tupleCount = responseData.count;
        messageElement.textContent = `The number of tuples in demotable: ${tupleCount}`;
    } else {
        alert("Error in count demotable!");
    }
}

// Filters visable pokemon in the pokedex according to user-selected type.
async function filterPokemonType() {
    const typeElement = document.getElementById('pokemonType');
    const type = typeElement.value;

    const tableElement = document.getElementById("pokedex-pokemon-table");
    const tableBody = tableElement.querySelector('tbody');

    if(type == "all") {
        fetchAndDisplayUsers('pokedex-pokemon-table', '/pokedex');
        return;
    }

    const response = await fetch(`/pokedex/type-filter/${type}`, {
        method: 'GET', 
    });

    const responseData = await response.json();
    const tableContent = responseData.data;

    // Always clear old, already fetched data before new fetching process.
    if (tableBody) {
        tableBody.innerHTML = '';
    }

    tableContent.forEach(user => {
        const row = tableBody.insertRow();
        user.forEach((field, index) => {
            const cell = row.insertCell(index);
            cell.textContent = field;
        });
    });
}

async function getEffectiveness() {
    const attackTypeElement = document.getElementById('pokemonAttackType');
    const defenceTypeElement = document.getElementById('pokemonDefenceType');
    const attackType = attackTypeElement.value;
    const defenceType = defenceTypeElement.value;

    const response = await fetch("/pokedex/effectiveness", {
        method: 'GET',
        headers: {
            'attack': attackType,
            'defence': defenceType
        }
    });

    const responseData = await response.json();
    const messageElement = document.getElementById('effectivenessMsg');

    if (responseData.success) {
        const effectiveness = responseData.num;
        messageElement.textContent = `${effectiveness} X Effectiveness`;
    } else {
        alert("Error in retrieving data");
    }

}


// Challenges the gym whose name is entered. Creates record of gym battle, gym challenge, and adds any
// badges won during challenge to player inventory
// Sorry for how long and complex this function is ---- TODO: make more readable
async function challengeGym(event) {
    event.preventDefault();
    let winner;
    Math.random() > 0.5 ? winner = 'player' : winner = 'leader';   // determine battle victor

    const gymName = document.getElementById('searchName').value;
    const gymNameClean = gymName.toLowerCase().split(' ').map(word => word[0].toUpperCase() + word.substring(1)).join(' ');

    const date = new Date();
    let currentDate = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

    // create battle record
    const response = await fetch('/insert-battle', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            date: currentDate,
            winner: winner
        })
    });
    const responseData = await response.json();
    const battleid = responseData.id;
    if (!responseData.success) {
        alert("Error inserting battle");
    }

    // challenge gym 
    const challengeResponse = await fetch('/challenge-gym', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            gym: gymNameClean,
            username: username,
            battle: battleid
        })
    });
    const challengeResponseData = await challengeResponse.json();
    const messageElement = document.getElementById('gymResultMsg');

    if (challengeResponseData.success) {
        if (winner === 'player') {
            messageElement.textContent = `Congratulations! You won the battle at ${gymNameClean}!!!`
        } else {
            messageElement.textContent = `You were defeated in battle at ${gymNameClean}...`
        }
    } else {
        messageElement.textContent = `Error challenging gym: ${gymNameClean}. Check that the entered gym name actually exists`;
    }

    // if player won battle, player receives badge from gym if they haven't already collected them all
    if (winner === 'player' && challengeResponseData.success) {

        // get array of badges that particular gym offers
        const gymBadgeResponse = await fetch(`/badges/${gymNameClean}`, {
            method: 'GET', 
        });
        const gymBadgesJson = await gymBadgeResponse.json();
        let gymBadgesOffered = [];
        Object.values(gymBadgesJson.data).forEach(value => gymBadgesOffered.push(value[0])); 

        // get array of badges player has already acquired from that gym 
        const playerBadgesResponse = await fetch(`/player-badges/${gymNameClean}`, {
            method: 'GET',
            headers: {
                'username': username
            }
        });
        const playerBadgesJson = await playerBadgesResponse.json();
        let playerBadges = [];
        Object.values(playerBadgesJson.data).forEach(value => playerBadges.push(value[0])); 

        const badgesNotAquired = gymBadgesOffered.filter((badge) => !playerBadges.includes(badge));
        if (badgesNotAquired.length === 0) {
            messageElement.textContent += ` You have already aquired all possible badges from ${gymNameClean}`;
        } else {

            const newBadge = badgesNotAquired[0];

            const challengeResponse = await fetch('/player-badges', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    gym: gymNameClean,
                    username: username,
                    badge: newBadge
                })
            });

            messageElement.textContent += ` You aquire the ${newBadge} badge from ${gymNameClean}`;
        }

    }
}

// Filter items by dropdown menue
async function filterItems() {
    const itemElement = document.getElementById("items");
    const item = itemElement.value;

    const tableElement = document.getElementById("item-table");
    const tableBody = tableElement.querySelector('tbody');

    if (item == "berries") {
        await fetchAndDisplayUsers('item-table', '/store_berry');
        return;
    } else if (item == 'medicine') {
        fetchAndDisplayUsers('item-table', '/store_medicine');
        return;
    } else {
        fetchAndDisplayUsers('item-table', '/store');
        return;
    }
}

// Find and display the pokemon with the user-inputted name
async function getPokemonByName() {
    const name = document.getElementById("nameInput").value.toLowerCase();
    fetchAndDisplayUsers('pokedex-pokemon-table', `/pokedex/find-by-name/${name}`);
}

// Find items by enter name
async function findItemByName() {
    const item = document.getElementById("findbyname").value;
    const tableElement = document.getElementById("item-table");
    const tableBody = tableElement.querySelector('tbody');

    const response = await fetch(`/store/${item}`, {
        method: 'GET',
    });

    const responseData = await response.json();

    // If no items are found
    if (responseData.data.length == 0) {
        console.log("No item found");
        return;
    }

    fetchAndDisplayUsers('item-table', `/store/${item}`);
}

// Simple helper to allow Pokemon search by name at "enter" press
async function searchEnter(e) {
    if(e.key =='Enter') {
        getPokemonByName();
    }
}

// Handler for click event on pokedex pokemon table
async function populatePokemonStats(pokemonName) {

    resetStats();

    // GET data
    const response = await fetch(`/pokemon/stats/${pokemonName}`, {
        method: 'GET', 
    });

    const responseData = await response.json();
    const contentRows = responseData.data;

    if (responseData.data.length == 0) {
        alert("Error: No stats found");
        return;
    }

    //NAME
    const nameAttribute = document.getElementById('pokemon-stats-name');
    nameAttribute.innerHTML += pokemonName;

    //HP, ATTACK, DEFENCE, SPEED, GEN
    const hPAttribute = document.getElementById('pokemon-stats-hp');
    hPAttribute.innerHTML += contentRows[0][0];
    const attackAttribute = document.getElementById('pokemon-stats-attack');
    attackAttribute.innerHTML += contentRows[0][1];
    const defenceAttribute = document.getElementById('pokemon-stats-defence');
    defenceAttribute.innerHTML += contentRows[0][2];
    const speedAttribute = document.getElementById('pokemon-stats-speed');
    speedAttribute.innerHTML += contentRows[0][3];
    const genAttribute = document.getElementById('pokemon-stats-gen');
    genAttribute.innerHTML += contentRows[0][4];

    //TYPE
    const typeAttribute = document.getElementById('pokemon-stats-type');
    

    //MOVES
    const moveAttribute = document.getElementById('pokemon-stats-moves');
}

// Helper to reset result block for pokedex (may refactor)
async function resetStats() {

    const nameAttribute = document.getElementById('pokemon-stats-name');
    const strongName = document.createElement('strong');
    strongName.textContent = 'NAME: '; 
    nameAttribute.textContent = '';
    nameAttribute.appendChild(strongName);

    const hPAttribute = document.getElementById('pokemon-stats-hp');
    const strongHP= document.createElement('strong');
    strongHP.textContent = 'HP: ';
    hPAttribute.textContent = ''; 
    hPAttribute.appendChild(strongHP);

    const attackAttribute = document.getElementById('pokemon-stats-attack');
    const strongAttack= document.createElement('strong');
    strongAttack.textContent = 'ATTACK: ';
    attackAttribute.textContent = ''; 
    attackAttribute.appendChild(strongAttack);

    const defenceAttribute = document.getElementById('pokemon-stats-defence');
    const strongDefence= document.createElement('strong');
    strongDefence.textContent = 'DEFENCE: ';
    defenceAttribute.textContent = ''; 
    defenceAttribute.appendChild(strongDefence);

    const speedAttribute = document.getElementById('pokemon-stats-speed');
    const strongSpeed = document.createElement('strong');
    strongSpeed.textContent = 'SPEED: ';
    speedAttribute.textContent = ''; 
    speedAttribute.appendChild(strongSpeed);

    const genAttribute = document.getElementById('pokemon-stats-gen');
    const strongGen = document.createElement('strong');
    strongGen.textContent = 'GENERATION: ';
    genAttribute.textContent = ''; 
    genAttribute.appendChild(strongGen);

    const typeAttribute = document.getElementById('pokemon-stats-type');
    const strongType = document.createElement('strong');
    strongType.textContent = 'TYPE: ';
    typeAttribute.textContent = ''; 
    typeAttribute.appendChild(strongType);


    const movesAttribute = document.getElementById('pokemon-stats-moves');
    const strongMoves = document.createElement('strong');
    strongMoves.textContent = 'MOVES: ';
    movesAttribute.textContent = ''; 
    movesAttribute.appendChild(strongMoves);

}

// Verify login information
//Use username: Suicune7, password: cpsc304IsCool to test for now
async function verifyLogin() {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    console.log(username, password);

    const response = await fetch(`/login/${username}/${password}`, {
        method: 'GET',
    });

    const responseData = await response.json();

    // If username and password does not match, pop up alert window.
    if (responseData.data.length == 0) {
        alert("username and password combination is wrong. pleaese try again or do you want to sign up (๑❛ᴗ❛๑) ?");
        return;
    }

    // If username and password match, direct to index.html
    trainer = username; // set the global variable trainer to username;
    window.location.href = 'index.html';
}

// Inserts new user information into the trainer table
async function insertUser(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const nickname = document.getElementById('nickname').value;
    const zipcode = document.getElementById('zipcode').value;
    const startdate = new Date();
    const timezone = document.getElementById('timezone').value;

    const response = await fetch('/insert-user', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username,
            name: nickname,
            password: password,
            start_date: startdate,
            zip_postal_code: zipcode  //do we have timezone table created?
        })
    });

    const responseData = await response.json();

    if (responseData.success) {
        console.log("Data inserted successfully!");
        fetchTableData();
    } else {
        console.log("Data inserted NOT WORK");
    }


    // const messageElement = document.getElementById('insertResultMsg');

    // if (responseData.success) {
    //     messageElement.textContent = "Data inserted successfully!";
    //     fetchTableData();
    // } else {
    //     messageElement.textContent = "Error inserting data!";
    // }
}

// ---------------------------------------------------------------
// Initializes the webpage functionalities.
// Add or remove event listeners based on the desired functionalities.
window.onload = function() {
    fetchTableData();
    if (document.body.id == 'home') {
        // I've commented this out because for some unknown reason it causes multiple error messages to display otherwise
        // but everything seems to be working fine - might want to investigate more later
        // checkDbConnection();
        document.getElementById("resetDemotable").addEventListener("click", resetDemotable);
        document.getElementById("insertDemotable").addEventListener("submit", insertDemotable);
        document.getElementById("updataNameDemotable").addEventListener("submit", updateNameDemotable);
        document.getElementById("countDemotable").addEventListener("click", countDemotable);
    } else if (document.body.id == 'pokedex') {
        document.getElementById("type-search-button").addEventListener("click", filterPokemonType);
        document.getElementById("effectiveness-button").addEventListener("click", getEffectiveness);
        document.getElementById("name-search-button").addEventListener("click", getPokemonByName);
        document.getElementById("reset-button").addEventListener("click", () => {
            fetchTableData();
            resetStats();
        });
        document.getElementById("nameInput").addEventListener('keypress', searchEnter);
        document.getElementById("pokedex-pokemon-table").addEventListener('click', (e) => {
            if (e.target.tagName === 'TD') {populatePokemonStats(e.target.textContent);}
        });
    } else if (document.body.id == 'gym') {
        document.getElementById("gym-search").addEventListener("submit", challengeGym);
    } else if (document.body.id == 'store') {
        document.getElementById("findbytype-button").addEventListener("click", filterItems);
        document.getElementById("findbyname-button").addEventListener("click", findItemByName);
    } else if (document.body.id == 'login') {
        //sign up button direct to signup page
        document.getElementById("signup-btn").addEventListener("click", function () {
            window.location.href = 'signup.html';
        });
        //login button to login
        document.getElementById("login-btn").addEventListener("click", verifyLogin);
    } else if (document.body.id == 'signup') {
        document.getElementById("register-btn").addEventListener("click", insertUser);
    }
};

// General function to refresh the displayed table data.
// You can invoke this after any table-modifying operation to keep consistency.
function fetchTableData() {
    if (document.body.id == 'home') {
        fetchAndDisplayUsers('demotable', '/demotable');
    } else if (document.body.id == 'team') {
        fetchAndDisplayUsers('team-pokemon-table', '/player-pokemon', username);
        fetchAndDisplayUsers('team-badges', '/player-badges', username);
    } else if (document.body.id == 'gym') {
        fetchAndDisplayUsers('gym-table', '/gym');
    } else if (document.body.id == 'pokedex') {
        fetchAndDisplayUsers('pokedex-pokemon-table', '/pokedex');
        fetchAndDisplayUsers('pokedex-evolution-table', '/pokedex/evolutions');
    } else if (document.body.id == 'store') {
        fetchAndDisplayUsers('item-table', '/store');
    }
}
