const express = require('express');
const appService = require('./appService');

const router = express.Router();

// ----------------------------------------------------------
// API endpoints
// Modify or extend these routes based on your project's needs.
router.get('/check-db-connection', async (req, res) => {
    const isConnect = await appService.testOracleConnection();
    if (isConnect) {
        res.send('connected');
    } else {
        res.send('unable to connect');
    }
});

router.get('/demotable', async (req, res) => {
    const tableContent = await appService.fetchDemotableFromDb();
    res.json({data: tableContent});
});

router.post("/initiate-demotable", async (req, res) => {
    const initiateResult = await appService.initiateDemotable();
    if (initiateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/insert-demotable", async (req, res) => {
    const { id, name } = req.body;
    const insertResult = await appService.insertDemotable(id, name);
    if (insertResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.post("/update-name-demotable", async (req, res) => {
    const { oldName, newName } = req.body;
    const updateResult = await appService.updateNameDemotable(oldName, newName);
    if (updateResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

router.get('/count-demotable', async (req, res) => {
    const tableCount = await appService.countDemotable();
    if (tableCount >= 0) {
        res.json({
            success: true,
            count: tableCount
        });
    } else {
        res.status(500).json({
            success: false,
            count: tableCount
        });
    }
});

router.get('/player-pokemon', async (req, res) => {
    const tableContent = await appService.fetchPlayerPokemonFromDb(req.headers['username']);
    res.json({data: tableContent});
});

// add player pokemon after catching it
router.post("/player-pokemon/catch", async (req, res) => {
    const {name, nickname, tr_username, pp_level} = req.body;
    const insertResult = await appService.insertPlayerPokemon(name, nickname, tr_username, pp_level);
    if (insertResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});


// add player pokemon move after catching it
router.post("/player-pokemon/learned-move", async (req, res) => {
    const {move, name, nickname, tr_username} = req.body;
    const insertResult = await appService.insertPlayerPokemonMove(move, name, nickname, tr_username);
    if (insertResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

// get player badges
router.get('/player-badges', async (req, res) => {
    const tableContent = await appService.fetchPlayerBadgesFromDb(req.headers['username']);
    res.json({data: tableContent});
});

// add player badge
router.post("/player-badges", async (req, res) => {
    const { gym, username, badge } = req.body;
    const insertResult = await appService.insertPlayerBadge(gym, username, badge);
    if (insertResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

// get player badges received from specific gym
router.get('/player-badges/:gym', async (req, res) => {
    const { gym } = req.params;
    const tableContent = await appService.fetchPlayerBadgesFromDb(req.headers['username'], gym);
    res.json({data: tableContent});
});

router.get('/gym', async (req, res) => {
    const tableContent = await appService.fetchGymsFromDb();
    res.json({data: tableContent});
});

// get the names of badges a particular gym offers
router.get('/badges/:gym', async (req, res) => {
    const { gym } = req.params;
    const tableContent = await appService.fetchGymBadgesFromDb(gym);
    res.json({data: tableContent});
});

router.post("/insert-battle", async (req, res) => {
    const {date, winner } = req.body;
    const insertResult = await appService.insertBattle(date, winner);
    if (insertResult > 0) {
        res.json({ success: true , id: insertResult});
    } else {
        res.status(500).json({ success: false , id: -1});
    }
});

router.post("/challenge-gym", async (req, res) => {
    const { gym, username, battle } = req.body;
    const insertResult = await appService.insertGymChallenge(gym, username, battle);
    if (insertResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});


//get items from database
router.get('/store', async (req, res) => {
    const tableContent = await appService.fetchItemstableFromDb();
    res.json({data: tableContent});
});

//get items_berries from databse
router.get('/store_berry', async (req, res) => {
    const tableContent = await appService.fetchItemsberryFromDb();
    res.json({data: tableContent});
});

//get items_medicine from databse
router.get('/store_medicine', async (req, res) => {
    const tableContent = await appService.fetchItemsmedicineFromDb();
    res.json({data: tableContent});
});

//get items by name from databse
router.get('/store/:name', async (req, res) => {
    //parse the parameter from address
    const name = req.params.name;
    const tableContent = await appService.fetchItembyNameFromDb(name);
    res.json({data: tableContent});
});

router.post("/insert-user", async (req, res) => {
    const { id, name } = req.body;
    const insertResult = await appService.insertDemotable(id, name);
    if (insertResult) {
        res.json({ success: true });
    } else {
        res.status(500).json({ success: false });
    }
});

//get users by username and password from databse
//Use username: Suicune7, password: cpsc304IsCool to test for now
//Issues: the username and password is not case sensitive
router.get('/login/:username/:password', async (req, res) => {
    //parse the parameter from address
    const { username, password } = req.params;
    const tableContent = await appService.fetchUserFromDb(username, password);
    res.json({data: tableContent});
});

//Get pokemon for display in the pokedex 
router.get('/pokedex', async (req, res) => {
    const tableContent = await appService.fetchPokemonFromDb();
    res.json({data: tableContent});
});

//Get pokemon evolutions for display in the pokedex 
router.get('/pokedex/evolutions', async (req, res) => {
    const tableContent = await appService.fetchEvolutionsFromDb();
    res.json({data: tableContent});
});

// Get all pokemon that match the requested type
router.get('/pokedex/find-by-name/:name', async (req, res) => {
    const tableContent = await appService.fetchPokemonByNameFromDb(req.params.name);
    res.json({data: tableContent});
});

// Get all pokemon that match the requested type
router.get('/pokedex/type-filter/:type', async (req, res) => {
    const tableContent = await appService.fetchTypeFiltersFromDb(req.params.type);
    res.json({data: tableContent});
});

// Get the type effectiveness match-up of the requested types
router.get('/pokedex/effectiveness', async (req, res) => {
    const {attack, defence} = req.headers;
    const multiplier = await appService.fetchTypeMatchupFromDb(attack, defence);

    if (multiplier >= 0) {
        res.json({
            success: true,
            num: multiplier
        });
    } else {
        res.status(500).json({
            success: false,
            count: multiplier
        });
    }

});

// Get pokemon stats from database
router.get('/pokemon/stats/:name', async (req, res) => {
    const content = await appService.fetchPokemonStatsFromDb(req.params.name);
    res.json({data: content});
});







module.exports = router;