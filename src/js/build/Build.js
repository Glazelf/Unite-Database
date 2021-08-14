/*
* The main Build class used to represent a build and its Pokemon
*/

function Build(id, level){
	level = typeof level !== 'undefined' ? level : true;

	let self = this;
	let gm = GameMaster.getInstance();

	self.heldItems = [];
	self.battleItem = null;
	self.stageId = '';
	self.level = 1;
	self.stats = {}; // Object containing the final calculated stats
	self.statParts = {}; // ojbect containing the parts and bonuses making up each stat
	self.moves = {
		basic: {},
		slot1: {},
		slot2: {},
		unite: {},
		passive: {}
	};

	// Apply a new Pokemon to this build

	self.setPokemon = function(id){
		let data = gm.getPokemonById(id);

		// Map JSON data to Pokemon attributes
		self.pokemonId = data.pokemonId;
		self.baseStats = data.stats;
		self.stages = data.stages;
		self.role = data.role;
		self.type = data.type;
		self.style = data.style;
		self.difficulty = data.difficulty;
		self.stages = data.stages;
		self.movePool = data.moves;
		self.ratings = data.ratings;
		self.stageId = self.stages[0].stageId;

		// Set initial moves
		self.moves.basic = new Move("basic", self.movePool.basic);
		self.moves.unite = new Move("unite", self.movePool.unite);
		self.moves.passive = new Move("passive", self.movePool.passive);
		self.moves.slot1 = new Move("slot1", self.movePool.slot1[0]);
		self.moves.slot2 = new Move("slot2", self.movePool.slot2[0]);

		self.setStats();
	}

	// Set the level for this Pokemon

	self.setLevel = function(value){
		value = parseInt(value);

		if((value < 1) || (value > 15)){
			value = 1;
		}

		self.level = value;

		// Set this Pokemon's evolutionary stage at its current level
		for(var i = 0; i < self.stages.length; i++){
			if(self.level >= self.stages[i].level){
				self.stageId = self.stages[i].stageId;
			}
		}

		self.setStats();
	}

	// Set the Pokemon's stats at its current level

	self.setStats = function(){
		self.stats = self.calculateStats(self.level);
	}

	// Return this build's stats at a given level

	self.calculateStats = function(level){

		// Organize each stat into its parts and bonuses

		let stats = {
			hp: { value: 0, parts: []},
			atk: { value: 0, parts: []},
			def: { value: 0, parts: []},
			spA: { value: 0, parts: []},
			spD: { value: 0, parts: []},
			speed: { value: 0, parts: []}
		};

		// Determine base stats
		let statSet = self.baseStats[level - 1];

		// Cycle through each stat and discover base stats and bonuses

		for(var key in stats){
			if(stats.hasOwnProperty(key)){
				let parts = stats[key].parts;
				let baseStat = statSet[key];

				// Add base stat
				parts.push({
					source: "base_stat",
					value: baseStat
				});

				// Add bonuses from held items

				for(var i = 0; i < self.heldItems.length; i++){
					let item = self.heldItems[i];
					let boosts = item.boosts;

					let part = {
						source: item.itemId,
						value: 0
					}

					// Check primary effect
					if(item.stat == key){
						if(item.type == "number"){
							part.value += item.value;
						} else if(item.type == "percent"){
							part.value += item.value * (parts[0].value / 100);
						}
					}

					// Check secondary boosts

					for(var n = 0; n < boosts.length; n++){
						if(boosts[n].stat == key){
							part.value += boosts[n].value;
						}
					}

					if(part.value != 0){
						parts.push(part);
					}
				}

				// Add up all parts
				for(var i = 0; i < parts.length; i++){
					stats[key].value += parts[i].value;
				}
			}
		}

		return stats;
	}

	// Shorthand for accessing stat values
	self.stat = function(key, round){
		let stat = self.stats[key].value;
		if(round){
			stat = displayFloat(stat, 1);
		}

		return stat;
	}

	// Check to see if this Pokemon is holding a specific item

	self.hasHeldItem = function(itemId){
		for(var i = 0; i < self.heldItems.length; i++){
			if(self.heldItems[i].itemId == itemId){
				return true;
			}
		}

		return false;
	}

	// Give this Pokemon a specific held item

	self.giveHeldItem = function(item, slot){
		slot = typeof slot !== 'undefined' ? slot : self.heldItems.length;

		if(slot >= self.heldItems.length){
			self.heldItems.push(item);
		} else{
			self.heldItems[slot] = item;
		}
	}

	// Give this Pokemon a specific battle item

	self.giveBattleItem = function(item){
		self.battleItem = item;
	}

	// Select a move of a given ID for a given slot

	self.selectMove = function(moveId, slot){
		let moveArr = self.movePool[slot];

		for(var i = 0; i < moveArr.length; i++){
			if(moveArr[i].moveId == moveId){
				self.moves[slot] = new Move(slot, moveArr[i]);
				break;
			}
		}
	}


	self.setPokemon(id); // Initialize with given ID
	self.setLevel(level);
}
