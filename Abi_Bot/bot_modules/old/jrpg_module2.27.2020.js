/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ABI BOT JRPG MODULE VERSION 0.1 RUNS OFF OF DISCORDIE BOT CODE WRITTEN BY ERIC/////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                        ___   _      _  ______  _____  _   
//                                       / _ \ | |    (_) | ___ \|  _  || |  
//                                      / /_\ \| |__   _  | |_/ /| |/' || |_ 
//                                      |  _  || '_ \ | | | ___ \|  /| || __|
//                                      | | | || |_) || | | |_/ /\ |_/ /| |_ 
//                                      \_| |_/|_.__/ |_| \____/  \___/  \__|
//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Required///////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const file_system = require('fs');

const v8 = require('v8');



/*
	SECTION HEADERS
	1.Required
	2.Commands
	3.Functions
	4.JRPG SETTINGS
	5.JRPG CHARACTER
	6.Loot
	7.PARTY
	8.MOBS
	9.BATTLE PROGRESSION
	10.DAMAGE CALC
	11.INVENTORY
	12.TOWNS
	13.FORMATT INFO
	14.TARGETING
	15.WORLD MAP
	F.MODULE
*/



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Commands///////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const jrpg_commands = {
	//basic character commands
	create_character : "create_character",
	check_stats : "check_stats",
	check_skills : "check_skills",
	//fast character commands
	quick_status : "status",
	//inventory commands
	check_inventory : "inventory",
	/*
		check_inventory.inspect.id
		check_inventory.list.page
		check_inventory.user.page
	*/
	inventory_inspect : "inspect",
	inventory_list : "list",
	inventory_user : "user",
	equip_item : "equip",
	unequip_item : "unequip",
	//info commands
	skill_info : "skill_info",
	//party commands
	party_list : "plist",
	party_create : "pcreate",
	party_invite : "pinvite",
	party_leave : "pleave",
	party_join : "pjoin",
	party_kick : "pkick",
	//duel commands
	call_duel : "call_duel",
	revoke_duel : "cancel_duel",
	accept_duel : "accept_duel",
	reject_duel : "reject_duel",
	//combat commands
	combat_attack : "ATTACK",
	combat_defend : "DEFEND",
	combat_skill : "CAST",
	//town commands
	trader : "trader",
	/*
		trader.inspect.id
		trader.buy.id
		trader.sell.id
		trader.list.page
	*/
	trader_inspect : "inspect",
	trader_buy : "buy",
	trader_sell : "sell",
	trader_list : "list",
	//world commands
	current_location : "location",
	travel : "travel",
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Functions//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function load_JSON(callback, file_path) {
	file_system.readFile(file_path, 'utf8', function readFileCallback(err, json_data){
		if (err){
			console.log(err);
		} else {
			callback(JSON.parse(json_data));
		};
	});
};



function remove_from_array(array, item){
	var index = array.indexOf(item);
	if (index > -1) {
		array.splice(index, 1);
	}
};



function pickRandomFromArray(array){
	var pick = array[Math.floor(Math.random() * array.length)];
	return pick
};


//shallow copy returns references
function shallow_copyArray(array){
	var copied_array = [];
	for(var i = 0; i < array.length; i++){
		copied_array[i] = array[i];
	}
	return copied_array
};



//func dict length
function dictlength(dict){
	return Object.keys(dict).length
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//JRPG SETTINGS//////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//refresh time of town stores
const store_restock_time = 3600000;
const store_refresh_time = 3600000*6;



//parties
var parties = {};
var mob_parties = {};


//mob objects
var active_mobs = {};



//party object
class party {
	constructor(name, leader){
		//basic settings
		this.name = name;
		this.party_leader = leader;
		this.members = [leader];
		this.invites = [];
		//extra settings
		this.max_size = 4;
		this.in_combat = false;
		this.battle_type = null;
		this.battle_name = null;
		//party location
		this.world_position = {
			x : 0,
			y : 0,
		};
		this.transportation = [
			"LAND"
		];
	}
};



//party member object
class party_member {
	constructor(type, name, id){
		this.type = type;
		this.name = name;
		this.id = id;
	}
};



//ongoing battles
var battles = {
	duels : {
	},
	encounter_battles : {
	},
};



//battle timer
var update_battles = null;



//duel object
class duel {
	constructor(team_1, team_2){
		//parties involved in duel
		this.TEAM_1 = team_1;
		this.TEAM_2 = team_2;
		
		//duel name
		this.duel_name = team_1+"/"+team_2;
		
		//party that requests the duel
		this.requester = team_1;
		
		//duel variables
		this.duel_started = false;
		this.turn = 0;
		this.turn_order = [];
		this.last_order = null;
		this.participants = {};
		
		//duel request accepted
		this.duel_accepted = false;
	}
};



//combat encounter object
class combat_encounter {
	constructor(player_team, mob_team){
		//parties involved in duel
		this.PLAYER_PARTY = player_team;
		this.MOB_PARTY = mob_team;
		
		//encounter name
		this.combat_encounter_name = player_team+"/"+mob_team;
		
		//encounter variables
		this.combat_encounter_started = false;
		this.turn = 0;
		this.turn_order = [],
		this.last_order = null;
		this.participants = {};
	}
};



//passive_tag
class passive_tag {
	constructor(skill, duration){
		this.skill = skill;
		this.duration = duration;
	}
};



//debuff tag
class debuff_tag {
	constructor(name, effect_name, potency_type, potency, effect, power, duration){
		this.debuff = {
			name : name,
			effect_name : effect_name,
			potency_type : potency_type,
			potency : potency,
			effect : effect,
			power : power
		};
		this.duration = duration;
	}
};



//character object
class character {
	constructor(name, job, xp){
		
		this.primary_stats = {
			name : name,
			level : 1,
			xp : xp,
			//jobs are from jobs.json
			job : job,
			hp : 0,
			mp : 0,
		};
		
		this.passive_tags = {
			
		};
		
		this.attributes = {
			stamina : 0,
			strength : 0,
			dexterity : 0,
			intelligence : 0,
			wisdom : 0,
			luck : 0,
		};
		
		this.combat_stats = {
			max_hp : 0,
			max_mp : 0,
			attack_power : 0,
			magic_power : 0,
			defence : 0,
			faith : 0,
			critical : 0,
			critical_damage : 0,
			evasion : 0,
			hit : 0,
		};
		
		this.elemental_resistances = {
			FIRE : 0,
			WATER : 0,
			WIND : 0,
			EARTH : 0,
			ICE : 0,
			LIGHTNING : 0,
			LIGHT : 0,
			DARK : 0,
		};
		
		this.status_resistances = {
			paralysis : 0,
			blind : 0,
			silence : 0,
			sleep : 0,
			poison : 0,
			burn : 0,
			confusion : 0,
			instant_death : 0,
			petrify : 0,
			fear : 0,
			stun : 0,
		};
		
		this.equipment = {
			head : null,
			chest : null,
			legs : null,
			feet : null,
			accessory_1 : null,
			accessory_2 : null,
			accessory_3 : null,
			accessory_4 : null,
			left_hand : null,
			right_hand : null,
		};
		
		this.learned_skills = {
		};
		
	}
	
};



//mob object
class mob {
	constructor(mob_obj, tier){
		
		this.primary_stats = {
			name : mob_obj.name,
			tier : 1,
			hp : mob_obj.combat_stats.max_hp,
			mp : mob_obj.combat_stats.max_mp,
		};
		
		this.tags = mob_obj.tags,
		
		this.passive_tags = {
			
		};
		
		this.combat_stats = mob_obj.combat_stats;
		
		//backupstats restore the mobs stats at the start of each round before status hit, special to mobs since they don't scale off attributes.
		this.backup_stats = mob_obj.combat_stats;
		
		this.elemental_resistances = mob_obj.elemental_resistances;
		
		this.status_resistances = mob_obj.status_resistances;
		
		this.learned_skills = mob_obj.learned_skills;
		
	}
	
};



//equipment object
/*
	I would advise against putting constructor tags here
*/
class equipable {
	constructor(type){
		//primary elements
		this.name = null;
		this.type = type;
		this.tier = null;
		this.class_lock = null;
		this.weapon_type = null;
		this.wield_type = null;
		this.id = null;
		//secondary elements
		this.stats = {};
		this.attributes = {};
		//tetiary elements
		this.elemental = null;
		this.elemental_values = {};
		this.status_values = {};
		//quaternary
		this.spell_enable = {};
		//misc
		this.rank = null;
		this.worth = null;
	}
};



//all jobs
var jobs = load_JSON(function(data){
	jobs = data
	},
	'./bot_modules/jrpg_data/jobs.json'
);



//all skills
var skills_list = load_JSON(function(data){
	skills_list = data
	},
	'./bot_modules/jrpg_data/skills.json'
);



//all equipable data
var equipable_data = load_JSON(function(data){
	equipable_data = data
	},
	//'./bot_modules/jrpg_data/equipment.json'
	'./bot_modules/jrpg_data/new_equipment.json'
);



//item name generation
var item_name_list = load_JSON(function(data){
	item_name_list = data
	},
	//'./bot_modules/jrpg_data/item_names.json'
	'./bot_modules/jrpg_data/new_item_names.json'
);



//towns list
var towns_list = load_JSON(function(data){
	towns_list = data
	},
	'towns.json'
);



//world map
var world_map = load_JSON(function(data){
	world_map = data
	},
	'./bot_modules/jrpg_data/world_tiles.json'
);



//mobs
var all_mobs = load_JSON(function(data){
	all_mobs = data
	},
	'./bot_modules/jrpg_data/mobs.json'
);



//enemy sets
var mob_sets = load_JSON(function(data){
	mob_sets = data
	},
	'./bot_modules/jrpg_data/mob_sets.json'
);



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//JRPG CHARACTER/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



function update_stats(chr, restore_character){
	//makes sure it is a character object
	if(chr.hasOwnProperty('primary_stats')){
		/*STEPS
		1.UPDATE LEVEL
		2.UDPATE ATTRIBUTES
		3.UPDATE STATS
		*/
		
		//Linear Leveling
		var xp_needed = 100*chr.primary_stats.level;
		chr.primary_stats.level = (1 + Math.floor(chr.primary_stats.xp/xp_needed));
		
		//Linear Attributes
		chr_attributes = chr.attributes;
		base_attributes = jobs[chr.primary_stats['job']]['base_stats'];
		attribute_scaling = jobs[chr.primary_stats['job']]['stat_scaling'];
		
		for (var key in chr_attributes){
			chr.attributes[key] = (base_attributes[key] + (chr.primary_stats.level-1)*attribute_scaling[key]);
		};
		
		//Linear STATS
		chr_stats = chr.combat_stats;
		
		//update character attributes from items
		for(key in chr.equipment){
			if(chr.equipment[key] != null){
				var item = chr.equipment[key];
				for(key in item.attributes){
					chr.attributes[key] += item.attributes[key];
				}
			}
		};
		//Set Stats NOTE: FIND A BETTER WAY TO DO THIS
		for (var key in chr_stats){
			if(key == "max_hp"){
				chr.combat_stats[key] = Math.floor(chr.attributes['stamina']*10 + chr.attributes['wisdom']*5)
			}else if(key == "max_mp"){
				chr.combat_stats[key] = Math.floor(chr.attributes['intelligence']*3 + chr.attributes['wisdom']*3)
			}else if(key == "attack_power"){
				chr.combat_stats[key] = Math.floor(chr.attributes['strength']*2.5 + chr.attributes['stamina']*1.5)
			}else if(key == "magic_power"){
				chr.combat_stats[key] = Math.floor(chr.attributes['intelligence']*2.5 + chr.attributes['wisdom']*1.5)
			}else if(key == "defence"){
				chr.combat_stats[key] = Math.floor(chr.attributes['stamina']*2 + chr.attributes['wisdom']*1)
			}else if(key == "faith"){
				chr.combat_stats[key] = Math.floor(chr.attributes['wisdom']*2 + chr.attributes['stamina']*1)
			}else if(key == "critical"){
				chr.combat_stats[key] = chr.attributes['luck']*2 + chr.attributes['dexterity']*2
			}else if(key == "critical_damage"){
				chr.combat_stats[key] = chr.attributes['strength']*2 + chr.attributes['intelligence']*2
			}else if(key == "evasion"){
				chr.combat_stats[key] = Math.floor(chr.attributes['luck']*2 + chr.attributes['dexterity']*2)
			}else if(key == "hit"){
				chr.combat_stats[key] = chr.attributes['dexterity']*4
			}
		};
		
		//add skills that the character knows into the skills list
		/*
			1. From levels
			2. From equipment
		*/
		//clear skills
		chr.learned_skills = {};
		//add skills back
		var class_skills = jobs[chr.primary_stats.job].skills;
		for(key in class_skills){
			//unlocked skills only
			if(class_skills[key] >= chr.primary_stats.level){
				chr.learned_skills[key] = class_skills[key]
			}
		};
			
		//reset passive tags if restoring character
		if(restore_character){
			chr.passive_tags = {}
		}
		
		//update passive skills list
		for(key in chr.learned_skills){
			//find the skill and check if it is a passive
			if(skills_list[key] != undefined){
				//this skill
				var this_skill = skills_list[key];
				//check passive
				if(this_skill.type == "PASSIVE"){
					//create new passive tag
					var copy_skill = Object.assign(this_skill, copy_skill);
					var passive = new passive_tag(copy_skill, 1);
					chr.passive_tags[key] = passive;
				}
			}
		};
		
		//reset all elemental and status resistances
		for(key in chr.elemental_resistances){
			chr.elemental_resistances[key] = 0;
		};
		for(key in chr.status_resistances){
			chr.status_resistances[key] = 0;
		};
		//update character stats from items
		for(key in chr.equipment){
			if(chr.equipment[key] != null){
				var item = chr.equipment[key];
				//get stats and stuff from item and send to character
				for(key in item.stats){
					chr.combat_stats[key] += item.stats[key];
				};
				for(key in item.elemental_values){
					chr.elemental_resistances[key] += item.elemental_values[key];
				};
				for(key in item.status_values){
					chr.status_resistances[key] += item.status_values[key];
				};
				for(key in item.spell_enable){
					chr.learned_skills[key] = item.spell_enable[key];
				};
			}
		};
		
		//restore character
		if(restore_character){
			chr.primary_stats.hp = chr.combat_stats.max_hp;
			chr.primary_stats.mp = chr.combat_stats.max_mp;
		}
	}
};



//write stats card using text
function formatt_stats(object){
	var chr = object;
	var fText = "";
	/*
	1. SHOW PRIMARY STATS
	2. SHOW ATTRIBUTES AND STATS
	3. SHOW ELEMENTAL AND STATUS RESISTANCES
	4. SHOW EQUIPMENT
	5. SHOW STATUS EFFECTS
	*/
	fText = "```css\n"+
	"NAME : "+chr.primary_stats.name+"\n"+
	"JOB : "+chr.primary_stats.job+"\n"+
	"LEVEL : "+chr.primary_stats.level+"\n"+
	"XP : "+chr.primary_stats.xp+"\n"+"\n"+
	
	"HP : ["+chr.primary_stats.hp+"/"+chr.combat_stats.max_hp+"]..."+((chr.primary_stats.hp/chr.combat_stats.max_hp)*100).toFixed(2)+"%"+"\n"+
	"MP : ["+chr.primary_stats.mp+"/"+chr.combat_stats.max_mp+"]..."+((chr.primary_stats.mp/chr.combat_stats.max_mp)*100).toFixed(2)+"%"+"\n"+"\n"+

	//attributes
	"-----[ATTRIBUTES]----------------\n"
	for(key in chr.attributes){
		fText = fText+ 
		key+" : "+chr.attributes[key]+"\n"
	};
	
	//stats
	fText = fText+"\n"+
	"-----[STATS]---------------------\n"
	for(key in chr.combat_stats){
		fText = fText+ 
		key+" : "+chr.combat_stats[key]+"\n"
	};
	
	//elemental resistances
	fText = fText+"\n"+
	"-----[ELEMENTAL RESISTANCES]-----\n"
	for(key in chr.elemental_resistances){
		fText = fText+ 
		key+" : "+chr.elemental_resistances[key]+"%\n"
	};
	
	//status resistances
	fText = fText+"\n"+
	"-----[STATUS RESISTANCES]--------\n"
	for(key in chr.status_resistances){
		fText = fText+ 
		key+" : "+chr.status_resistances[key]+"%\n"
	};
	
	//EQUIPMENT
	fText = fText+"\n"+
	"-----[EQUIPMENT]-----------------\n"
	for(key in chr.equipment){
		if(chr.equipment[key] != null){
			fText = fText+key+" : "+chr.equipment[key].name+"\n"
		}else{
			fText = fText+key+" : "+chr.equipment[key]+"\n"
		};
	};
	
	//skills effects
	fText = fText+"\n"+
	"-----[SKILLS]--------------------\n"
	for(key in chr.learned_skills){
		fText = fText+ 
		key+" : "+skills_list[key].effect+"\n"
	};
	
	//status effects
	fText = fText+"\n"+
	"-----[STATUS EFFECTS]------------\n"
	for(key in chr.passive_tags){
		var status_name = "";
		if(chr.passive_tags[key].hasOwnProperty("skill")){
			status_name = chr.passive_tags[key].skill.skill_name
		}else if(chr.passive_tags[key].hasOwnProperty("debuff")){
			status_name = chr.passive_tags[key].debuff.name
		};
		fText = fText+ 
		status_name+"\n"
	};
	
	//end text
	fText = fText+"```"
	
	return fText
};



//write quick stat check
function formatt_quick_stats(object){
	var chr = object;
	var fText = "";
	/*
	1. SHOW NAME, LEVEL, JOB
	2. SHOW HP, MP
	3. SHOW STATUS EFFECTS
	*/
	fText = "```css\n"+
	chr.primary_stats.name+" : {"+chr.primary_stats.job+" : "+chr.primary_stats.level+"}\n"+
	"HP : ["+chr.primary_stats.hp+"/"+chr.combat_stats.max_hp+"]..."+((chr.primary_stats.hp/chr.combat_stats.max_hp)*100).toFixed(2)+"%"+"\n"+
	"MP : ["+chr.primary_stats.mp+"/"+chr.combat_stats.max_mp+"]..."+((chr.primary_stats.mp/chr.combat_stats.max_mp)*100).toFixed(2)+"%"+"\n"+"\n";
	//status effects
	if(chr.passive_tags.length > 0){
		fText += "Status Effects : \n";
		for(key in chr.passive_tags){
			var status_name = "";
			if(chr.passive_tags[key].hasOwnProperty("skill")){
				status_name = chr.passive_tags[key].skill.skill_name
			}else if(chr.passive_tags[key].hasOwnProperty("debuff")){
				status_name = chr.passive_tags[key].debuff.name
			};
			fText = fText+ 
			status_name+"\n"
		};
	};
	
	fText = fText+"```"
	
	return fText
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Loot///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//generate range
function generate_variation(value, variation){
	var new_value = 0;
	new_value = value*((Math.floor(Math.random()*(variation*2))+(100-variation))/100);
	return Math.ceil(new_value)
};



//function generate
function generate_stats(array, base_chance, deprication_value){
	//
	var return_array = [];
	var copy_array = array.slice();
	//
	var base_chance = base_chance;
	var final_chance = base_chance;
	var chance_deprication = base_chance/deprication_value;
	//
	var dice_roll = Math.floor(Math.random()*100);
	//add stats
	var i = 0;
	while((dice_roll < final_chance)&&(i < 10)){
		i++;
		final_chance -= chance_deprication;
		dice_roll = Math.floor(Math.random()*100);
		//
		var this_stat = pickRandomFromArray(copy_array);
		if(this_stat != undefined){
			remove_from_array(copy_array, this_stat);
			return_array.push(this_stat)
		};
	};
	return return_array
};


/*
//create equipable -OLD
function generate_equipable(item_type, tier, id, rarity){
	//item
	var this_item = null;
	//check for the existance of the equipable type
	//if equipable data exists
	if(equipable_data != undefined){
		if(item_type in equipable_data){
			var stock_item = equipable_data[item_type];
			//procede with generation
			//PROCEDURE:
			//1. Wield Type, Classes, Tier
			//2. Stats & Attributes
			//3. Elemental Modifiers and Status Modifiers
			//4. Negative Modifiers
			//5. Abilities
			//6. Misc Elements
			//7. Name
			var new_item = new equipable(item_type);
			
			//Primary 1. Wield Type, Classes, Tier
			new_item.type = stock_item.type;
			new_item.weapon_type = item_type;
			new_item.wield_type = stock_item.wield_type;
			new_item.class_lock = stock_item.class_lock;
			new_item.tier = tier;
			new_item.id = id;
			
			//Secondary 2. Stats & Attributes 3. Elements and Status
			var base_power = stock_item.stat_base*tier;
			//stats
			var primary_stat = stock_item.primary_stat;
			//secondary stats
			//generation chances
			var gen_chances = stock_item.stat_generation;
			var possible_stats = generate_stats(stock_item.secondary_stats.slice(), gen_chances.stat_chance, gen_chances.stat_max);
			var possible_attributes = generate_stats(stock_item.attributes.slice(), gen_chances.attriubte_chance, gen_chances.attribute_max);
			var possible_elements = generate_stats(stock_item.elemental.slice(), gen_chances.elemental_chance, gen_chances.elemental_max);
			var possible_status = generate_stats(stock_item.status_type.slice(), gen_chances.status_chance, gen_chances.status_max);
			// add stats
			new_item.stats[primary_stat] = generate_variation(base_power, 20);
			for(var i = 0; i < possible_stats.length; i++){
				var multiplier = 0.66;
				if(possible_stats[i] == "max_hp"){
					multiplier = 3;
				};
				if(possible_stats[i] == "max_mp"){
					multiplier = 2;
				};
				new_item.stats[possible_stats[i]] = generate_variation(base_power*multiplier, 20);
			};
			//add attributes
			for(var i = 0; i < possible_attributes.length; i++){
				new_item.attributes[possible_attributes[i]] = generate_variation(tier, 50);
			};
			//add elemental
			for(var i = 0; i < possible_elements.length; i++){
				new_item.elemental_values[possible_elements[i]] = generate_variation(tier*2, 25);
			};
			//add status
			for(var i = 0; i < possible_status.length; i++){
				new_item.status_values[possible_status[i]] = generate_variation(tier*2, 25);
			};
			var item_element = pickRandomFromArray(possible_elements);
			if(item_element != undefined){
				new_item.elemental = item_element;
			};
			
			//4. Negative Modifers
			//first we need to determine what stats can be negative
			
			
			//5. Abilities
			var possible_abilities = [];
			//all abilities
			if(stock_item.abilities['ALL'] != undefined){
				for(key in stock_item.abilities.ALL){
					if(tier >= stock_item.abilities.ALL[key]){
						possible_abilities.push(key)
					}
				}
			};
			//element specific abilities
			if(stock_item.abilities[new_item.elemental] != undefined){
				for(key in stock_item.abilities[new_item.elemental]){
					if(tier >= stock_item.abilities[new_item.elemental][key]){
						possible_abilities.push(key)
					}
				}
			};
			//add abilties
			for(var i = 0; i < possible_abilities.length; i++){
				if(Math.floor(Math.random()*100)<gen_chances.ability_chance){
					if(Object.keys(new_item.spell_enable).length<gen_chances.ability_max){
						new_item.spell_enable[possible_abilities[i]] = possible_abilities[i];
					}
				}
			};
			
			//6. Misc Elements
			new_item.rank = 0;
			//calculate worth
			var base_worth = Math.floor(Math.random()*5)+5;
			var total_value = dictlength(new_item.stats)+dictlength(new_item.attributes)+dictlength(new_item.elemental_values)+dictlength(new_item.status_values)+dictlength(new_item.spell_enable);
			var total_worth = (3*(tier*tier)*total_value*base_worth)+(3*tier*new_item.rank);
			if(total_worth <= 0){
				total_worth = 1
			};
			new_item.worth = total_worth;
			
			//7. Generate Name
			var name_adj = "";
			var name_pre = "";
			var name = "";
			var name_sufix = "";
			//pick out what we can use
			var p_na = [];
			var p_np = [];
			var p_n = [];
			var p_ns = [];
			//add names from self
			p_n = p_n.concat(stock_item.names);
			if(item_type in item_name_list){
				//add names from all
				if(item_name_list[item_type].hasOwnProperty("ALL")){
					for(key in item_name_list[item_type].ALL){
						if(item_name_list[item_type].ALL[key] <= tier){
							p_n = p_n.concat([key])
						}
					}
				};
				if(new_item.elemental != null){
					if(new_item.elemental in item_name_list[item_type]){
						for(key in item_name_list[item_type][new_item.elemental]){
							if(item_name_list[item_type][new_item.elemental][key] <= tier){
								p_n = p_n.concat([key])
							}
						}
					}
				}
			};
			//add stat names
			if(Object.keys(new_item.stats).length>1){
				for(key in new_item.stats){
					if(key in item_name_list.stat_names){
						if(new_item.stats[key] > 0){
							p_na = p_na.concat(item_name_list.stat_names[key].stat_up)
						}else if(new_item.stats[key] < 0){
							p_na = p_na.concat(item_name_list.stat_names[key].stat_down)
						}
					}
				}
			};
			//add elemental names
			if(new_item.elemental != null){
				if(new_item.elemental in item_name_list.elemental_names){
					p_np = p_np.concat(item_name_list.elemental_names[new_item.elemental].prefix);
				}
			};
			for(key in new_item.elemental_values){
				if(key in item_name_list.elemental_names){
					if(new_item.elemental_values[key] > 0){
						p_ns = p_ns.concat(item_name_list.elemental_names[key].suffix)
					}
				}
			};
			//pick names
			if(Math.floor(Math.random()*100)<75){
				name_adj = pickRandomFromArray(p_na)
			};
			if(Math.floor(Math.random()*100)<50){
				name_pre = pickRandomFromArray(p_np)
			};
			if(Math.floor(Math.random()*100)<25){
				name_sufix = pickRandomFromArray(p_ns)
			};
			name = pickRandomFromArray(p_n);
			//create name
			var new_name = ""
			if(name_adj != undefined && name_adj != ""){
				new_name += name_adj
			};
			if(name_pre != undefined && name_pre != ""){
				if(new_name != ""){
					new_name += " "+name_pre
				}else{
					new_name += name_pre
				}
			};
			if(new_name != ""){
				new_name += " "+name
			}else{
				new_name += name
			};
			if(name_sufix != undefined && name_sufix != ""){
				new_name += " "+name_sufix
			};
			//return name
			new_item.name = new_name;
			//return item
			this_item = new_item;
		};
	};
	return this_item
};*/



function generate_equipable(item_type, tier, id, rarity){
	//item
	var this_item = null;
	//check for the existance of the equipable type
	//if equipable data exists
	if(equipable_data != undefined){
		if(item_type in equipable_data){
			var stock_item = equipable_data[item_type];
			//procede with generation
			//PROCEDURE:
			//1. Wield Type, Classes, Tier
			//2. Stats & Attributes
			//3. Elemental Modifiers and Status Modifiers
			//4. Abilities
			//5. Misc
			//6. Name
			var new_item = new equipable(item_type);
			
			//Primary 1. Wield Type, Classes, Tier
			new_item.type = stock_item.type;
			new_item.weapon_type = item_type;
			new_item.wield_type = stock_item.wield_type;
			new_item.class_lock = stock_item.class_lock;
			new_item.tier = tier;
			new_item.id = id;
			
			//Secondary 2. Stats & Attributes 3. Elements and Status
			var base_power = stock_item.stat_base*tier;
			//stats
			var primary_stat = stock_item.primary_stat;
			//1. Generate Prefix Name
			var prefixes = item_name_list.stat_prefixes;
			var p_pf = [];
			for(key in prefixes){
				p_pf.push(key)
			};
			var name_adj = "";
			if(Math.floor(Math.random()*100)<50){
				name_adj = pickRandomFromArray(p_pf)
			};
			var prefix = item_name_list.stat_prefixes[name_adj];
			//add stats
			if(prefix != undefined){
				for(key in prefix.stats){
					new_item.stats[key] = Math.round(generate_variation(tier, 50)*prefix.stats[key]);
					if(new_item.stats[key] == 0){
						delete new_item.stats[key]
					}
				};
				//add attributes
				for(key in prefix.attributes){
					new_item.attributes[key] = Math.round(generate_variation(tier, 50)*prefix.attributes[key]);
					if(new_item.attributes[key] == 0){
						delete new_item.attributes[key]
					}
				};
			};
			//secondary stats
			//generation chances
			var gen_chances = stock_item.stat_generation;
			var possible_stats = generate_stats(item_name_list.stats.slice(), gen_chances.stat_chance*rarity, gen_chances.stat_max);
			var possible_attributes = generate_stats(item_name_list.attributes.slice(), gen_chances.attriubte_chance*rarity, gen_chances.attribute_max);
			var possible_elements = generate_stats(item_name_list.elementals.slice(), gen_chances.elemental_chance*rarity, gen_chances.elemental_max);
			var possible_status = generate_stats(item_name_list.status_effects.slice(), gen_chances.status_chance*rarity, gen_chances.status_max);
			// add stats
			// add primary stat first
			new_item.stats[primary_stat] = generate_variation(base_power, 20);
			for(var i = 0; i < possible_stats.length; i++){
				var multiplier = 0.66;
				if(possible_stats[i] == "max_hp"){
					multiplier = 3;
				};
				if(possible_stats[i] == "max_mp"){
					multiplier = 2;
				};
				new_item.stats[possible_stats[i]] = generate_variation(base_power*multiplier, 20);
			};
			//add attributes
			for(var i = 0; i < possible_attributes.length; i++){
				if(possible_attributes[i] in new_item.attributes){
				}else{
					new_item.attributes[possible_attributes[i]] = generate_variation(tier, 50);
				}
			};
			
			//3. Elemental and Status
			//add elemental
			for(var i = 0; i < possible_elements.length; i++){
				if(possible_elements[i] in new_item.elemental_values){
				}else{
					new_item.elemental_values[possible_elements[i]] = generate_variation(tier*2, 25);
				}
			};
			//add status
			for(var i = 0; i < possible_status.length; i++){
				if(possible_status[i] in new_item.status_values){
				}else{
					new_item.status_values[possible_status[i]] = generate_variation(tier*2, 25);
				}
			};
			var item_element = pickRandomFromArray(possible_elements);
			if(item_element != undefined){
				new_item.elemental = item_element;
			};
			
			//4. Abilities
			var possible_abilities = [];
			//all abilities
			if(stock_item.abilities['ALL'] != undefined){
				for(key in stock_item.abilities.ALL){
					if(tier >= stock_item.abilities.ALL[key]){
						possible_abilities.push(key)
					}
				}
			};
			//element specific abilities
			if(stock_item.abilities[new_item.elemental] != undefined){
				for(key in stock_item.abilities[new_item.elemental]){
					if(tier >= stock_item.abilities[new_item.elemental][key]){
						possible_abilities.push(key)
					}
				}
			};
			//add abilties
			for(var i = 0; i < possible_abilities.length; i++){
				if(Math.floor(Math.random()*100)<gen_chances.ability_chance){
					if(Object.keys(new_item.spell_enable).length<gen_chances.ability_max){
						new_item.spell_enable[possible_abilities[i]] = possible_abilities[i];
					}
				}
			};
			
			//5. Misc Elements
			new_item.rank = 0;
			//calculate worth
			var base_worth = Math.floor(Math.random()*5)+5;
			var total_value = 0;
			for(key in new_item.stats){
				if(new_item.stats[key] > 0){
					total_value += 1
				}else{
					total_value -= 0.5
				}
			};
			for(key in new_item.attributes){
				if(new_item.attributes[key] > 0){
					total_value += 1
				}else{
					total_value -= 0.5
				}
			};
			for(key in new_item.elemental_values){
				if(new_item.elemental_values[key] > 0){
					total_value += 1
				}else{
					total_value -= 0.5
				}
			};
			for(key in new_item.status_values){
				if(new_item.status_values[key] > 0){
					total_value += 1
				}else{
					total_value -= 0.5
				}
			};
			total_value += dictlength(new_item.spell_enable);
			var total_worth = (3*(tier*tier)*total_value*base_worth)+(3*tier*new_item.rank);
			if(total_worth <= 0){
				total_worth = 1
			};
			new_item.worth = Math.floor(total_worth);
			
			//6. Generate Name
			var name_pre = "";
			var name = "";
			var name_sufix = "";
			//pick out what we can use
			var p_np = [];
			var p_n = [];
			var p_ns = [];
			//add names from self
			p_n = p_n.concat(stock_item.names);
			if(item_type in item_name_list){
				//add names from all
				if(item_name_list[item_type].hasOwnProperty("ALL")){
					for(key in item_name_list[item_type].ALL){
						if(item_name_list[item_type].ALL[key] <= tier){
							p_n = p_n.concat([key])
						}
					}
				};
				if(new_item.elemental != null){
					if(new_item.elemental in item_name_list[item_type]){
						for(key in item_name_list[item_type][new_item.elemental]){
							if(item_name_list[item_type][new_item.elemental][key] <= tier){
								p_n = p_n.concat([key])
							}
						}
					}
				}
			};
			//add elemental names
			if(new_item.elemental != null){
				if(new_item.elemental in item_name_list.elemental_names){
					p_np = p_np.concat(item_name_list.elemental_names[new_item.elemental].prefix);
				}
			};
			for(key in new_item.elemental_values){
				if(key in item_name_list.elemental_names){
					if(new_item.elemental_values[key] > 0){
						p_ns = p_ns.concat(item_name_list.elemental_names[key].suffix)
					}
				}
			};
			//pick names
			if(Math.floor(Math.random()*100)<50){
				name_pre = pickRandomFromArray(p_np)
			};
			if(Math.floor(Math.random()*100)<25){
				name_sufix = pickRandomFromArray(p_ns)
			};
			name = pickRandomFromArray(p_n);
			//create name
			var new_name = ""
			if(name_adj != undefined && name_adj != ""){
				new_name += name_adj
			};
			if(name_pre != undefined && name_pre != ""){
				if(new_name != ""){
					new_name += " "+name_pre
				}else{
					new_name += name_pre
				}
			};
			if(new_name != ""){
				new_name += " "+name
			}else{
				new_name += name
			};
			if(name_sufix != undefined && name_sufix != ""){
				new_name += " "+name_sufix
			};
			//return name
			new_item.name = new_name;
			//return item
			this_item = new_item;
		}
	};
	return this_item
};


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//PARTY//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//formmat party text
function formatt_party_list(p, users){
	var plist_text = "```css\n#"+p.name+"\n\nPARTY MEMBERS ["+p.members.length+"/"+p.max_size+"]\n\n";
	//first check if the party is in a duel
	//if the party is in a battle and there are multiple targets with the same names
	var this_duel = null;
	try {
		console.log(p.battle_type)
		this_duel = battles[p.battle_type][p.battle_name]
	} catch (err) {
		console.log(err)
	};
	//for each party member
	for(var i = 0; i < p.members.length; i ++){
		var pmember = null;
		var unit_type = null;
		try {
			//check type
			if(p.members[i].type == 'player'){
				//is a player
				pmember = users[p.members[i].id];
				unit_type = 'player'
			}
			else{
				//not players 
				if(p.members[i].type == 'mob'){
					pmember = active_mobs[p.members[i].id];
					unit_type = 'mob'
				}
			}
		} catch (err) {
			console.log(err)
		}
		//if we find a party member
		if(pmember != null){
			//check if party is in combat else
			if(p.in_combat == false){
				//if party is not in combat we can leave the text as is
				if(unit_type == 'player'){
					pcharacter = pmember['jrpg_data']['character']
					plist_text = plist_text+pmember.name+" | CHARACTER : "+pcharacter.primary_stats.name+"\n"+
					"JOB : "+pcharacter.primary_stats.job+" | HP : ("+pcharacter.primary_stats.hp+"/"+pcharacter.combat_stats.max_hp+") MP : ("+pcharacter.primary_stats.mp+"/"+pcharacter.combat_stats.max_mp+")\n\n"
				}
			}else if(p.in_combat == true && this_duel != null){
				//if the party is in a battle and there are multiple targets with the same names
				//for each key in the duel participants
				for(name in this_duel.participants){
					if(unit_type == 'player'){
						if(this_duel.participants[name].id == p.members[i].id){
							//if id matches replace name with unique_name
							pcharacter = pmember['jrpg_data']['character']
							plist_text = plist_text+pmember.name+" | CHARACTER : "+name+"\n"+
							"JOB : "+pcharacter.primary_stats.job+" | HP : ("+pcharacter.primary_stats.hp+"/"+pcharacter.combat_stats.max_hp+") MP : ("+pcharacter.primary_stats.mp+"/"+pcharacter.combat_stats.max_mp+")\n\n"
							//prevent multiple names from occuring
							break
						}
					}else if(unit_type == 'mob'){
						if(this_duel.participants[name].id == p.members[i].id){
							pcharacter = pmember;
							plist_text = plist_text+"NAME : "+name+"\n"+
							"HP : ("+pcharacter.primary_stats.hp+"/"+pcharacter.combat_stats.max_hp+") MP : ("+pcharacter.primary_stats.mp+"/"+pcharacter.combat_stats.max_mp+")\n\n"
							break
						}
					}
				}
			}
		}
	}
					
	plist_text = plist_text+"```";
	
	return plist_text
};



//checks if the user is in a party returns the party if true or false
function check_party(user){
	var in_party = false
	//check if any parties have been createDocumentFragment
	//parties is a dictionary object and doesn't have a length attribute
	if(Object.keys(parties).length >= 1){
		for(key in parties){
			var pmembers = parties[key].members;
			for(var i = 0; i < pmembers.length; i++){
				if(pmembers[i].id == user && pmembers[i].type == 'player'){
					in_party = parties[key]
				}
			}
		}
	}
	//also check mob parties
	if(Object.keys(mob_parties).length >= 1){
		for(key in mob_parties){
			var pmembers = mob_parties[key].members;
			for(var i = 0; i < pmembers.length; i++){
				if(pmembers[i].id == user && pmembers[i].type == 'mob'){
					in_party = mob_parties[key]
				}
			}
		}
	}
	//if the user does not belong to a party or no parties are created return false
	return in_party
};



//remove from party
function remove_from_party(party, target){
	var pmembers = party.members;
	for(var i = 0; i < pmembers.length; i++){
		if(pmembers[i].id == target){
			remove_from_array(pmembers, pmembers[i]);
		}
	}
};



//check if user has a character
function check_character(users, user){
	if(users[user]['jrpg_data']['character'] != null){
		if(users[user]['jrpg_data']['character'].hasOwnProperty('primary_stats')){
			return true
		}
	}
	return false
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//MOBS///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



function update_stats_mob(mob){
	//makes sure it is a character object
	if(mob.hasOwnProperty('primary_stats')){

		//reset mob stats
		mob.combat_stats = mob.backup_stats;
		
		//update passive skills list
		for(key in mob.learned_skills){
			if(skills_list[key] != undefined){
				var this_skill = skills_list[key];
				if(this_skill.type == "PASSIVE"){
					var copy_skill = Object.assign(this_skill, copy_skill);
					var passive = new passive_tag(copy_skill, 1);
					//passive skills that last for more than 1 turn
					if(copy_skill.secondary_skill_power != null){
						passive = new passive_tag(copy_skill, copy_skill.secondary_skill_power);
					};
					mob.passive_tags[key] = passive;
				}
			}
		};
		
		//reset all elemental and status resistances
		for(key in mob.elemental_resistances){
			mob.elemental_resistances[key] = 0;
		};
		for(key in mob.status_resistances){
			mob.status_resistances[key] = 0;
		}
	}
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BATTLE PROGRESSION/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//determine turn order
function determine_turn_order(participating_parties, users){
	//find out which party is going first
	var party_order = [];
	var new_turn_order = [];
	//we also need the updated names of participants
	var participants = {};
	//need to clone participating_parties first
	//short hand function copies x => x
	var all_parties = participating_parties.map((x) => x);
	//now while all_parties > 0 meaning that there are still party entries we are going to pick random participating_parties and add to order
	while(all_parties.length > 0){
		var selected_party = pickRandomFromArray(all_parties);
		//determine party type
		var t_party = null;
		if(parties[selected_party] == undefined){
			t_party = mob_parties[selected_party];
		}else{
			t_party = parties[selected_party];
		};
		//push party to party_order
		party_order.push([selected_party, t_party]);
		//remove old party from all_parties
		remove_from_array(all_parties, selected_party);
	};
	//gather all members with their parties
	var all_participants = {};
	for(var i = 0; i < party_order.length; i++){
		var t_party = party_order[i][1];
		var members = t_party.members;
		//get member from each party
		for(var m = 0; m < members.length; m++){
			//for each member check if their is another member with the same name
			if(members[m].name in all_participants){
				//add member to list with party and new name
				all_participants[members[m].name][members[m].name + "_" + Object.keys(all_participants[members[m].name]).length] = members[m]
			}else{
				//create a new dictionary
				all_participants[members[m].name] = {};
				//add members
				all_participants[members[m].name][members[m].name] = members[m]
			}
		}
	};
	//now we have to add each of the characters with their new names to the duel participants list
	for(name_type in all_participants){
		for(name in all_participants[name_type]){
			participants[name] = all_participants[name_type][name]
		}
	};
	//for each party in party_order
	for(var i = 0; i < party_order.length; i++){
		var t_party = party_order[i][1];
		var members = t_party.members;
		//for each member in the party push them to turn order
		for(var m = 0; m < members.length; m++){
			//check if user or mob
			//then check if they are dead
			if(members[m].type == "mob"){
				if(active_mobs[members[m].id].primary_stats.hp != 0){
					new_turn_order.push(members[m])
				}
			}else if(members[m].type == "player"){
				if(users[members[m].id].jrpg_data.character.primary_stats.hp != 0){
					new_turn_order.push(members[m])
				}
			}
		}
	}
	//now that turn order has been established return it
	return [party_order, new_turn_order, participants]
}




//cast a single status skill
function cast_status_skill(user, skill){
	//return text
	var return_text = "";
	//first we need to find the passive skills of the user
	var chr = user;
	//first we need to check if the skill in the passive tag exists
	var this_skill = skill;
	if(skills_list[skill.skill_name] != undefined){
		//now that the skill exists we need to execute it
		/*
			MP REFRESH
		*/
		if(this_skill.effect == "MP_REFRESH"){
			//return skill power
			var power = Math.floor(chr.combat_stats.max_mp*(this_skill.skill_power/100));
			//for number of times this passive triggers
			for(var i = 0; i < this_skill.hits; i++){
				//not max mp
				if(chr.primary_stats.mp != chr.combat_stats.max_mp){
					if(power + chr.primary_stats.mp > chr.combat_stats.max_mp){
						power = chr.combat_stats.max_mp - chr.primary_stats.mp;
					};
					//recover mp
				chr.primary_stats.mp += power;
				//set return text
				return_text += "```css\n"+chr.primary_stats.name+" recovered "+power+" MP from ["+this_skill.skill_name+"] MP("+chr.primary_stats.mp+"/"+chr.combat_stats.max_mp+")\n```";
				}
			}
		}
		/*
			HP REFRESH
		*/
		else if(this_skill.effect == "HP_REFRESH"){
			var power = Math.floor(chr.combat_stats.max_hp*(this_skill.skill_power/100));
			for(var i = 0; i < this_skill.hits; i++){
				if(chr.primary_stats.hp != chr.combat_stats.max_hp){
					if(power + chr.primary_stats.hp > chr.combat_stats.max_hp){
						power = chr.combat_stats.max_hp - chr.primary_stats.hp;
					};
					//recover hp
					chr.primary_stats.hp += power;
					//set return text
					return_text += "```css\n"+chr.primary_stats.name+" recovered "+power+" HP from ["+this_skill.skill_name+"] HP("+chr.primary_stats.hp+"/"+chr.combat_stats.max_hp+")\n```";
				}
			}
		}
	};
	return return_text
};




//cast debuffs
function cast_status_debuff(duel, user, debuff){
	return_text = "";
	//first we need to find the character
	var chr = user;
	//makes sure its not empty
	if(debuff != undefined){
		//first check if the debuff is a status debuff
		if(debuff.effect_name in chr.status_resistances){
			//test resistance
			if(Math.floor(Math.random()*100) < chr.status_resistances[debuff.effect_name]){
				//resisted
				return_text = "```css\n"+chr.primary_stats.name+" resisted ["+debuff.name+"]\n```";
				return return_text
			}
		};
		//activate status effects
		/*
			BURN
		*/
		if(debuff.effect_name == "burn"){
			var burn_power = 0;
			//depending on burn type
			if(debuff.potency_type == "FLAT"){
				var burn_effect = {
					effect : debuff.effect,
					elemental_type : null,
				};
				//calculate burn strength
				burn_power = Math.floor(calc_damage(burn_effect, Math.floor(debuff.power), user));
			}else if(debuff.potency_type == "PERCENT"){
				burn_power = chr.combat_stats.max_hp*(debuff.potency/100)
			};
			//apply burn
			burn_power = Math.floor(burn_power);
			if(chr.primary_stats.hp-burn_power < 0){
				chr.primary_stats.hp = 0;
			}else{
				chr.primary_stats.hp -= burn_power;
			}
			//set return text
			return_text += "```css\n"+chr.primary_stats.name+" was burned for "+burn_power+" by ["+debuff.name+"] HP("+chr.primary_stats.hp+"/"+chr.combat_stats.max_hp+")\n```";
		}
		/*
			PARALYSIS
		*/
		else if(debuff.effect_name == "paralysis"){
			var paralysis_power = 0;
			//paralysis strength
			if(debuff.potency_type == "FLAT"){
				paralysis_power = debuff.potency
			}else if(debuff.potency_type == "PERCENT"){
				paralysis_power = chr.combat_stats.evasion*(debuff.potency/100)
			};
			//apply paralysis
			//paralysis can go into the negatives
			paralysis_power = Math.floor(paralysis_power);
			chr.combat_stats.evasion -= paralysis_power;
			//set return text
			return_text += "```css\n"+chr.primary_stats.name+" had their evasion lowered for "+paralysis_power+" by ["+debuff.name+"]\n```";
			//full paralysis only on percent paralysis
			if(debuff.potency_type == "PERCENT"){
				if(Math.floor(Math.random()*100)<paralysis_power){
					//full paralyze
					if(duel.turn_order[0].id == user.id){
						return_text += "```css\n"+chr.primary_stats.name+" is fully paralyzed and cannot move\n```";
						remove_from_array(duel.turn_order, duel.turn_order[0]);
					}
				}
			}
		}
		/*
			BLIND
		*/
		else if(debuff.effect_name == "blind"){
			var blind_power = 0;
			if(debuff.potency_type == "FLAT"){
				blind_power = debuff.potency
			}else if(debuff.potency_type == "PERCENT"){
				blind_power = chr.combat_stats.hit*(debuff.potency/100)
			};
			//apply blind
			//hit values can go into the negatives +45 removes half of the base hit chance
			blind_power = Math.floor(blind_power)+45;
			chr.combat_stats.hit -= blind_power;
			//set return text
			return_text += "```css\n"+chr.primary_stats.name+" had their accuracy lowered for "+blind_power+" by ["+debuff.name+"]\n```";
		};
	};
	return return_text
};



//function cast all status boosting skills and all debuffing skills
function cast_status(duel, user){
	//return text
	var return_text = "";
	//first we need to find the passive skills of the user
	var chr = user;
	//for every passive tag the user has
	if(Object.keys(chr.passive_tags).length > 0){
		for(key in chr.passive_tags){
			if(chr.passive_tags[key].hasOwnProperty("skill")){
				return_text += cast_status_skill(chr, chr.passive_tags[key].skill)
			};
			if(chr.passive_tags[key].hasOwnProperty("debuff")){
				return_text += cast_status_debuff(duel, chr, chr.passive_tags[key].debuff)
			};
			//remove status once duration runs out
			if(chr.passive_tags[key].duration > 1){
				chr.passive_tags[key].duration -= 1;
			}else{
				delete chr.passive_tags[key]
			};
		}
	};
	return return_text
};



//message at the start of each turn
function formatt_turn_message(parties_order, users_order, turn, users){
	var message = "```css\n"+
	"TURN ["+turn+"] of the duel between the parties : \n\n```"
	//for each party
	for(var i = 0; i < parties_order.length; i++){
		var this_party = parties_order[i][1];
		message = ""+message+formatt_party_list(this_party, users)+"\n";
	};
	//cleanup and return
	message = message+"\n\n\n";
	return message
};



//your turn message and checking status of character
function do_turn(battle, users){
	if(battle.turn_order.length > 0){
		//check if user is still in party
		//players
		if(battle.turn_order[0].type == 'player'){
			var target_id = battle.turn_order[0].id;
			var p = check_party(target_id);
			if(p == false){
				msg = "```css\n["+battle.turn_order[0].name+"] has fled from the battle\n```";
				remove_from_array(battle.turn_order, battle.turn_order[0]);
				return msg
			};
			if(battle.last_order != target_id){
				var msg = "";
				//set last order
				battle.last_order = target_id;
				//update user stats
				update_stats(users[target_id].jrpg_data.character, false);
				//check if user is dead
				if(users[target_id].jrpg_data.character.primary_stats.hp == 0){
					msg = "```css\n["+battle.turn_order[0].name+"] was defeated\n```";
					remove_from_array(battle.turn_order, battle.turn_order[0]);
				}else{
					//next turn
					msg = "```css\n➧ It is your turn, ["+battle.turn_order[0].name+"]\n```";
					//cast status and debuffs
					msg += cast_status(battle, users[target_id].jrpg_data.character);
				}
				return msg
			}
		}else 
			//not players
			if(battle.turn_order[0].type == 'mob'){
			var target_id = battle.turn_order[0].id;
			var p = check_party(target_id);
			if(p == false){
				msg = "```css\n["+battle.turn_order[0].name+"] has fled from the battle\n```";
				remove_from_array(battle.turn_order, battle.turn_order[0]);
				return msg
			};
			if(battle.last_order != target_id){
				var msg = "";
				//set last order
				battle.last_order = target_id;
				update_stats_mob(active_mobs[target_id]);
				//check if user is dead
				if(active_mobs[target_id].primary_stats.hp == 0){
					msg = "```css\n["+battle.turn_order[0].name+"] was defeated\n```";
					remove_from_array(battle.turn_order, battle.turn_order[0]);
				}else{
					//next turn
					msg = "```css\n➧ It is the turn of, ["+battle.turn_order[0].name+"]\n```";
					//cast status and debuffs
					msg += cast_status(battle, active_mobs[target_id]);
					//do mob ai stuff
					
					//skip turns for now
					remove_from_array(battle.turn_order, battle.turn_order[0]);
				}
				return msg
			}
		}
	}
	return null
};



//win conditions return winner or null
function win_condition(users, battle, condition){
	//gather teams
	var teams = [];
	var victory_team = null;
	//what kind of battle
	if(battle instanceof duel){
		//gather teams
		teams.push(battle.TEAM_1);
		teams.push(battle.TEAM_2);
	};
	if(battle instanceof combat_encounter){
		//gather teams
		teams.push(battle.PLAYER_PARTY);
		teams.push(battle.MOB_PARTY);
	};
	//elmination condition
	if(condition == "HP_ZERO"){
		var parties_alive = [];
		for(var t = 0; t < teams.length; t++){
			var this_party = null;
			try {
				if(parties[teams[t]] != undefined){
					this_party = parties[teams[t]]
				}else if(mob_parties[teams[t]] != undefined){
					this_party = mob_parties[teams[t]]
				}
			} catch (err) {
				console.log(err)
			};
			//check if party still exists
			if(this_party != null){
				var party_hp = 0;
				for(var u = 0; u < this_party.members.length; u++){
					//players
					if(this_party.members[u].type == "player"){
						party_hp += users[this_party.members[u].id].jrpg_data.character.primary_stats.hp;
					}else
						//not players
						if(this_party.members[u].type == "mob"){
						party_hp += active_mobs[this_party.members[u].id].primary_stats.hp;
					};
				};
				if(party_hp > 0){
					parties_alive.push(teams[t]);
				};
			}
		};
		if(parties_alive.length == 1){
			victory_team = parties_alive[0]
		}
	};
	
	//no victory conditions met return null
	return victory_team
};



//Progress active battles
function execute_battles(users){
	//progress duels
	/*
		this function only progressess duels forwards by setting turn orders and stuff etc
	*/
	var all_duels = battles.duels;
	//check if there are duel requests
	if(Object.keys(all_duels).length > 0){
		//for each duel in all duel requests
		for(key in all_duels){
			var tduel = all_duels[key];
			//if the duel has been accepted but not started
			if((tduel.duel_accepted == true)&&(tduel.duel_started == false)){
				//restore both parties to full health and mana
				var teams = [parties[tduel.TEAM_1], parties[tduel.TEAM_2]];
				for(var t = 0; t < teams.length; t++){
					for(var i = 0; i < teams[t].members.length; i++){
						var this_user = teams[t].members[i].id;
						update_stats(users[this_user]['jrpg_data']['character'], true);
					}
				};
				//start duel
				tduel.duel_started = true;
				tduel.turn += 1;
				//determine turn order
				var order = determine_turn_order([tduel.TEAM_1, tduel.TEAM_2], users);
				tduel.turn_order = order[1];
				//set participants
				tduel.participants = order[2];
				//return a message that the duel has begun
				var turn_msg = formatt_turn_message(order[0], order[1], tduel.turn, users);
				return turn_msg
			}
			else if((tduel.duel_accepted == true)&&(tduel.duel_started == true)){
				//check if a team has won the duel
				var check_win = win_condition(users, tduel, "HP_ZERO");
				if(check_win != null){
					var winning_team = check_win;
					var losing_team = null;
					if(winning_team == tduel.TEAM_1){
						losing_team = tduel.TEAM_2
					}else{
						losing_team = tduel.TEAM_1
					};
					//reset parties
					if(parties[winning_team] != undefined){
						parties[winning_team].in_combat = false;
						parties[winning_team].battle_type = null;
						parties[winning_team].battle_name = null;
					};
					if(parties[losing_team] != undefined){
						parties[losing_team].in_combat = false;
						parties[losing_team].battle_type = null;
						parties[losing_team].battle_name = null;
					};
					//delete battles form battles
					delete battles.duels[tduel.duel_name];
					//end battle
					return "```css\nThe party ["+winning_team+"] has claimed victory over the party ["+losing_team+"] in their duel```"
				};
				//now we only progress the duel if the turn order has been used
				if(tduel.turn_order.length == 0){
					var order = determine_turn_order([tduel.TEAM_1, tduel.TEAM_2], users);
					tduel.turn_order = order[1];
					tduel.last_order = null;
					tduel.turn += 1;
					var turn_msg = formatt_turn_message(order[0], order[1], tduel.turn, users);
					return turn_msg
				};
				if(tduel.turn >= 1){
					var new_turn_msg = do_turn(tduel, users);
					if(new_turn_msg != null){
						return new_turn_msg
					}
				}
			};
		};
	};
	//progress encounter battles
	var all_encounter_battles = battles.encounter_battles;
	if(Object.keys(all_encounter_battles).length > 0){
		for(key in all_encounter_battles){
			var tencounter = all_encounter_battles[key];
			//First turn of duel
			if((tencounter.combat_encounter_started == true)&&(tencounter.turn == 0)){
				//start combat
				tencounter.turn += 1;
				//determine turn order
				var order = determine_turn_order([tencounter.PLAYER_PARTY, tencounter.MOB_PARTY], users);
				tencounter.turn_order = order[1];
				//set participants
				tencounter.participants = order[2];
				//return a message that the duel has begun
				var turn_msg = formatt_turn_message(order[0], order[1], tencounter.turn, users);
				return turn_msg
			}
			//next turns of duel and win conditions
			else if((tencounter.combat_encounter_started == true)&&(tencounter.turn > 0)){
				//check if there is a winner
				var check_win = win_condition(users, tencounter, "HP_ZERO");
				if(check_win != null){
					var winning_team = check_win;
					var losing_team = null;
					if(winning_team == tencounter.PLAYER_PARTY){
						losing_team = tencounter.MOB_PARTY
					}else{
						losing_team = tencounter.PLAYER_PARTY
					};
					//reset parties
					if(mob_parties[tencounter.MOB_PARTY] != undefined){
						mob_parties[tencounter.MOB_PARTY].in_combat = false;
						mob_parties[tencounter.MOB_PARTY].battle_type = null;
						mob_parties[tencounter.MOB_PARTY].battle_name = null;
					};
					if(parties[tencounter.PLAYER_PARTY] != undefined){
						parties[tencounter.PLAYER_PARTY].in_combat = false;
						parties[tencounter.PLAYER_PARTY].battle_type = null;
						parties[tencounter.PLAYER_PARTY].battle_name = null;
					};
					//since it is a mob battle we need to also delete the mobs
					for(var m = 0; m < mob_parties[tencounter.MOB_PARTY].members.length; m++){
						delete active_mobs[mob_parties[tencounter.MOB_PARTY].members[m].id];
					};
					//delete the party
					delete mob_parties[tencounter.MOB_PARTY];
					//delete battles form battles
					delete battles.encounter_battles[tencounter.combat_encounter_name];
					//end battle and reward players
					return "```css\nThe party ["+winning_team+"] has claimed victory over the party ["+losing_team+"] in their encounter```"
				};
				//if turn order is used progress
				if(tencounter.turn_order.length == 0){
					var order = determine_turn_order([tencounter.PLAYER_PARTY, tencounter.MOB_PARTY], users);
					tencounter.turn_order = order[1];
					tencounter.last_order = null;
					tencounter.turn += 1;
					var turn_msg = formatt_turn_message(order[0], order[1], tencounter.turn, users);
					return turn_msg
				};
				if(tencounter.turn >= 1){
					var new_turn_msg = do_turn(tencounter, users);
					if(new_turn_msg != null){
						return new_turn_msg
					}
				}
			};
		}
	};
	return "NILL"
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//DAMAGE CALC////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//generate base power
function calc_base_power(user, target_stats, power){
	var total_power = 0;
	for(var i = 0; i < target_stats.length; i++){
		total_power += user.combat_stats[target_stats[i]]*(power/100)
	};
	return total_power
};



//attack functions
function calc_damage(skill, stock_power, target){
	
	//determine stats of the skill
	var effect = skill.effect;
	var elemental_type = skill.elemental_type;
	
	//target stats
	var skill_target = target.combat_stats;
	
	//determine total stats into abiltity
	var total_power = stock_power;
	
	//reduce damage based on defense type
	var target_defense_stat = null;
	if(effect == "PHYSICAL"){
		target_defense_stat = skill_target.defence;
	}else if(effect == "MAGIC"){
		target_defense_stat = skill_target.faith;
	}
	
	var base_damage = total_power;
	var target_defense = base_damage*((100-(Math.pow(150,2)/(target_defense_stat+225)))/100)+target_defense_stat/3;
	
	//first damage
	var first_damage = base_damage - target_defense;
	//damage after resistances
	var second_damage = first_damage
	if(elemental_type != null){
		second_damage = first_damage-((target.elemental_resistances[elemental_type]/100)*second_damage)
	};
	
	//final damage
	var final_damage = Math.floor(second_damage);
	if(final_damage < 1){
		final_damage = 1
	};
	
	return final_damage
};



//calculate heal strength
function calc_heal(skill, user, target){
	//determine stats of the skill
	var effect = skill.effect;
	var target_stats = skill.target_stats;
	var skill_power = skill.skill_power;
	var elemental_type = skill.elemental_type;
	//user stats
	var user_stats = user.combat_stats;
	//target stats
	var skill_target = target.combat_stats;
	//determine total stats into abiltity
	var total_power = 0;
	for(var i = 0; i < target_stats.length; i++){
		total_power += user_stats[target_stats[i]]*(skill_power/100)
	};
	var base_heal = total_power;
	var second_heal = total_power;
	//if you are resistant to an element, you are healed for less by that element
	if(elemental_type != null){
		second_heal = total_power-((target.elemental_resistances[elemental_type]/100)*total_power)
	};
	var final_heal = Math.floor(second_heal);
	return final_heal
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//HIT HANDLE/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//single_heal_handle
function single_heal_handle(skill, user, target, weaken){
	var user_character = user;
	var target_character = target;
	var target_eva = target.combat_stats.evasion;
	var return_text = "";
	//no miss or fail chance but crit chance
	//calculate heal amount
	var this_heal = Math.floor(calc_heal(skill, user, target)*(weaken/100));
	//can't heal dead things
	if(target_character.primary_stats.hp > 0){
		//calculate critical hits
		var user_crit = user.combat_stats.critical;
		var bonus_crit = user_crit-target_eva;
		if(bonus_crit < 0){
			bonus_crit = 0
		};
		//1% base crit
		var crit_chance = 1+bonus_crit;
		if(Math.floor(Math.random() * Math.floor(100))<crit_chance){
			//critical heal
			//critical heal strength
			var critical_damage = 125+user.combat_stats.critical_damage-(target_eva/4);
			if(critical_damage < 125){
				critical_damage = 125;
			};
			this_heal *= (critical_damage/100);
			this_heal = Math.floor(this_heal);
			
			return_text += "```css\n{✝}"+user_character.primary_stats.name+" cast ["+skill.skill_name+"] at "+target_character.primary_stats.name+" and critically healed for "+this_heal+"!\n```"
		}
		else{
			return_text += "```css\n{✝}"+user_character.primary_stats.name+" cast ["+skill.skill_name+"] at "+target_character.primary_stats.name+" and healed for "+this_heal+"!\n```"
		}
		//heal target
		if(target_character.primary_stats.hp + this_heal > target_character.combat_stats.max_hp){
			target_character.primary_stats.hp = target_character.combat_stats.max_hp;
		}else{
			target_character.primary_stats.hp += this_heal;
		}
	}else{
		return_text += "```css\n{✝}"+user_character.primary_stats.name+" cast ["+skill.skill_name+"] at "+target_character.primary_stats.name+" but failed!\n```"
	};
	return return_text
};



//single_hit_handle
function single_hit_handle(skill, user, target, weaken){
	var user_character = user;
	var target_character = target;
	var return_text = "";
	var user_hit = user.combat_stats.hit;
	var target_eva = target.combat_stats.evasion;
	//calculate hit or miss
	//hit chance 90% base hit
	var hit_chance = 90+user_hit-target_eva;
	if(Math.floor(Math.random() * 100)<hit_chance){
		//hit
		//calculate attack damage
		var stock_power = calc_base_power(user, skill.target_stats, skill.skill_power);
		var this_attack = Math.floor(calc_damage(skill, stock_power, target)*(weaken/100));
		//calculate critical hits
		var user_crit = user.combat_stats.critical;
		var bonus_crit = user_crit-target_eva;
		if(bonus_crit < 0){
			bonus_crit = 0
		};
		//1% base crit
		var crit_chance = 1+bonus_crit;
		if(Math.floor(Math.random() * 100)<crit_chance){
			//critical strike
			//critical strength
			var critical_damage = 125+user.combat_stats.critical_damage-target_eva;
			if(critical_damage < 125){
				critical_damage = 125;
			};
			this_attack *= (critical_damage/100);
			this_attack = Math.floor(this_attack);
			if(skill.name == "attack"){
				return_text += "```css\n{⚔}"+user_character.primary_stats.name+" attacked "+target_character.primary_stats.name+" and critically striked for "+this_attack+"!\n```"
			}else{
				return_text += "```css\n{⚔}"+user_character.primary_stats.name+" cast ["+skill.skill_name+"] at "+target_character.primary_stats.name+" and critically striked for "+this_attack+"!\n```"
			}
		}
		else{
			//regular hit
			if(skill.name == "attack"){
				return_text += "```css\n{⚔}"+user_character.primary_stats.name+" attacked "+target_character.primary_stats.name+" for "+this_attack+"!\n```"
			}else{
				return_text += "```css\n{⚔}"+user_character.primary_stats.name+" cast ["+skill.skill_name+"] at "+target_character.primary_stats.name+" for "+this_attack+"!\n```"
			}
		}
		/*
			Deal with the target's passive abilties
		*/
		var target_damage_mitigation = 0;
		//cast battle passives of the target
		if(Object.keys(target_character.passive_tags).length > 0){
			for(key in target_character.passive_tags){
				var passive = target_character.passive_tags[key].skill;
				//check if the passive skill type exists
				if(key in skills_list){
					/*
						Damage Reduction Abilties
					*/
					if(passive.effect == "REDUCE_ALL_DAMAGE"){
						//calculate damage mitigated
						var mitigation = Math.floor(this_attack*(passive.skill_power/100));
						target_damage_mitigation += mitigation;
						//give return text
						return_text += "```css\n{🛡}"+target_character.primary_stats.name+"'s ["+passive.skill_name+"] reduced damage by "+mitigation+"!\n```"
					}
				}
			}
		};
		/*
			bonus effects of skill
		*/
		if(skill.bonus_effects != undefined){
			if(Object.keys(skill.bonus_effects).length > 0){
				for(key in skill.bonus_effects){
					var Beffect = skill.bonus_effects[key];
					/*
						Targeted status
					*/
					if(key == "target_status"){
						//check if status effect will be applied
						if(Math.floor(Math.random()*100) < Beffect.proc_chance){
							var Bpower = 0;
							var c_strength = 0;
							//check potency type
							if(Beffect.potency_type == "FLAT"){
								//Bpower
								for(var i = 0; i < skill.target_stats.length; i++){
									Bpower += user_character.combat_stats[skill.target_stats[i]]*(Beffect.potency/100)
								};
								//check strength
								var pseudo_skill = {
									effect : skill.effect,
									elemental_type : null,
								};
								c_strength = Math.floor(calc_damage(pseudo_skill, Bpower, target)*(weaken/100))
							}else if(Beffect.potency_type == "PERCENT"){
								c_strength = Beffect.potency
							};
							/*
								Create a status tag
							*/
							var Btag = new debuff_tag(
								Beffect.name,
								Beffect.effect_name,
								Beffect.potency_type,
								Beffect.potency,
								Beffect.effect,
								Bpower,
								Beffect.duration
							);
							//replace status tag if the potency is greater, if potency is less
							if(Beffect.name in target_character.passive_tags){
								var old_debuff = target_character.passive_tags[Beffect.name];
								if(old_debuff.hasOwnProperty("debuff")){
									if(old_debuff.debuff.power > Bpower){
										old_debuff.duration += 1
									}else{
										target_character.passive_tags[Beffect.name] = Btag;
									};
								};
							}else{
								target_character.passive_tags[Beffect.name] = Btag;
							};
							//add text
							return_text += "```css\n"+target_character.primary_stats.name+" was affected by ["+Beffect.name+"]!\n```"
						};
					};
				};
			};
		};
		/*
			Damage the target
		*/
		//true final damage
		this_attack -= target_damage_mitigation;
		if(target_character.primary_stats.hp - this_attack < 0){
			target_character.primary_stats.hp = 0;
		}else{
			target_character.primary_stats.hp -= this_attack;
		}
	}
	else{
		//miss
		if(skill.name == "attack"){
			return_text += "```css\n{⚔}"+user_character.primary_stats.name+" attacked "+target_character.primary_stats.name+", but "+user_character.primary_stats.name+" missed!\n```"
		}else{
			return_text += "```css\n{⚔}"+user_character.primary_stats.name+" cast ["+skill.skill_name+"] at "+target_character.primary_stats.name+", but "+user_character.primary_stats.name+" missed!\n```"
		}
	
	};
	
	return return_text
};



//cast passive
function apply_passive(skill, user, target, weaken){
	var user_character = user;
	var target_character = target;
	var return_text = "";
	//applying passives cannot miss
	//set up the passive
	var copy_skill = Object.assign(skill, copy_skill);
	copy_skill.skill_power = skill.skill_power*(weaken/100)
	var duration = skill.secondary_skill_power;
	//add tag
	var passive = new passive_tag(copy_skill, duration);
	target_character.passive_tags[skill.skill_name] = passive;
	//cast the status effect
	cast_status_skill(user, copy_skill);
	//return text
	return_text = "```css\n"+user_character.primary_stats.name+" cast ["+skill.skill_name+"] at "+target_character.primary_stats.name+".\n```"
	return return_text
};



//skill active
function execute_single_cast(user, target, skill, users){
	//find player character
	var user_character = user;
	var target_character = target;
	//execute single attack
	var return_text = "";
	//check mana
	var user_mp = user_character.primary_stats.mp;
	var mp_cost = skill.mp_cost;
	var weak = 100;
	//if user does not have enough mp execute exhaust cast
	if(user_mp-mp_cost < 0){
		//chance of either exhuasted spell or no spell
		var cast_chance = Math.floor(user_mp/mp_cost*100);
		if(Math.floor(Math.random() * Math.floor(100))<cast_chance){
			//cast weakened spell
			return_text = return_text+"```css\n"+user_character.primary_stats.name+" is exhuasted but still casted a spell!\n```";
			weak = cast_chance;
			user_character.primary_stats.mp = 0;
		}else{
			//fail spell cast
			return_text = return_text+"```css\n"+user_character.primary_stats.name+" is exhuasted and failed to cast ["+skill.skill_name+"] at "+target_character.primary_stats.name+"!\n```";
			return return_text
		}
	}else{
			//user mana
		user_character.primary_stats.mp -= mp_cost;
	};
	//first loops number of hits
	var hits = skill.hits;
	for(var h = 0; h < hits; h++){
		/*
			Single hit abilties that are targeted
		*/
		if(skill.type == "HIT"){
			//hit single target
			var attack = single_hit_handle(skill, user, target, weak);
			return_text = return_text+attack;
		}
		/*
			Targted hit_all abilties
		*/
		else if(skill.type == "HIT_ALL"){
			//hit all targets
			//first we need to find all targets
			var target_party = null;
			//player parties
			for(key in parties){
				for(var i = 0; i < parties[key].members.length; i++){
					if(users[parties[key].members[i].id].jrpg_data.character == target){
						target_party = parties[key]
					}
				}
			}
			//mob parties
			for(key in mob_parties){
				for(var i = 0; i < mob_parties[key].members.length; i++){
					if(active_mobs[mob_parties[key].members[i].id] == target){
						target_party = mob_parties[key]
					}
				}
			}
			//for each member in the target party
			for(var m = 0; m < target_party.members.length; m++){
				//players
				if(target_party.members[m].type == 'player'){
					var target_member = users[target_party.members[m].id];
					var attack = single_hit_handle(skill, user, target_member, weak);
					return_text = return_text+attack;
				}else
					//mobs
					if(target_party.members[m].type == 'mob'){
					var target_member = active_mobs[target_party.members[m].id];
					var attack = single_hit_handle(skill, user, target_member, weak);
					return_text = return_text+attack;
				}
			}
		}
		/*
			Single target healing abilties
		*/
		else if(skill.type == "HEAL"){
			var heal = single_heal_handle(skill, user, target, weak);
			return_text = return_text+heal;
		};
	}
	/*
		Passive applying abilities
	*/
	if(skill.type == "PASSIVE"){
		var passive = apply_passive(skill, user, target, weak);
		return_text = return_text+passive;
	};
	return return_text
};



//use_skill
function use_skill(user, target, skill, users){
	var return_text = "";
	//find the users character
	var user_character = user;
	var target_character = target;
	//if skill type is a passive
	if(skill.type == "PASSIVE"){
		return_text = execute_single_cast(user, target, skill, users);
	}
	else
	//do two attacks if the user dual wields, otherwise execute one attack only
	if((user_character.equipment.left_hand != null)&&(user_character.equipment.right_hand != null)){
		//if a weapon in both hands
		if((user_character.equipment.left_hand.type == 'weapon')&&(user_character.equipment.right_hand.type == 'weapon')){
			//execute double attack with weapon elements
			var copy_skill = Object.assign(skill, copy_skill);
			if(skill.skill_name == "basic_attack"){
				copy_skill.elemental_type = user_character.equipment.left_hand.elemental;
				return_text += execute_single_cast(user, target, copy_skill, users);
				copy_skill.elemental_type = user_character.equipment.right_hand.elemental;
				return_text += execute_single_cast(user, target, copy_skill, users);
			}else{
				return_text += execute_single_cast(user, target, copy_skill, users);
				return_text += execute_single_cast(user, target, copy_skill, users);
			};
		}else{
			//execute single attack with weapon elements
			var copy_skill = Object.assign(skill, copy_skill);
			if(skill.name == "basic_attack"){
				if(user_character.equipment.right_hand != null){
					copy_skill.elemental_type = user_character.equipment.left_hand.elemental;
				}else if(user_character.equipment.left_hand != null){
					copy_skill.elemental_type = user_character.equipment.right_hand.elemental;
				}
			};
			return_text = execute_single_cast(user, target, copy_skill, users);
		}
	}else{
		//execute single attack
		return_text = execute_single_cast(user, target, skill, users);
	};
	return return_text
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//INVENTORY//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//fomatt inventory
function formatt_inventory(target, page){
	var return_text = "";
	//page
	var tpage = Math.floor(Number(page));
	if(tpage === Infinity || String(tpage) !== page){
		return "<invalid page number>"
	};
	//format display
	return_text = "```css\n"+
	"Inventory of : ["+target.name+"]```";
	//get inventory
	var keys = Object.keys(target.jrpg_data.inventory);
	if(keys.length > 0){
		return_text += "```css\nPage #"+tpage+"\n";
		//target keys based on page
		var target_keys = 20*tpage-1;
		var start_key = 20*(tpage-1);
		for(var i = start_key; i < target_keys; i++){
			//if key exists
			if(keys[i] != undefined){
				var item = target.jrpg_data.inventory[keys[i]];
				//add item to display
				return_text += "#"+item.id+" : {"+item.tier+"} "+item.name+"\n";
			}
		}
		return_text += "```";
	};
	return return_text
};



//equip item
function equipItem(users, user, item, slot){
	var return_text = "";
	//check which slot the item goes in
	var item_slot = item.wield_type;
	if(slot in users[user].jrpg_data.character.equipment){
		//check if item is class locked
		if(item.class_lock.includes(users[user].jrpg_data.character.primary_stats.job)){
			//item should have a wield type
			//weapons are fundamentally different from other pieces of equipment so we need to do them seperately
			if(item_slot == 'one_hand' || item_slot == 'two_hand'){
				//weapon equipping
				var enable_double_weapon = false;
				//check if user has dual_wield
				if('dual_wield' in users[user].jrpg_data.character.learned_skills){
					enable_double_weapon = true
				};
				//check slots
				if(slot == 'left_hand' || slot == 'right_hand'){
					//unequip item if dual wield is false
					if(enable_double_weapon == false || item_slot == "two_hand"){
						users[user].jrpg_data.character.equipment['left_hand'] = null;
						users[user].jrpg_data.character.equipment['right_hand'] = null;
					};
					//if user already has the item equipped unequip it
					if(users[user].jrpg_data.character.equipment['left_hand'] != null){
						if(users[user].jrpg_data.character.equipment['left_hand'].id == item.id){
							users[user].jrpg_data.character.equipment['left_hand'] = null
						}
					};
					if(users[user].jrpg_data.character.equipment['right_hand'] != null){
						if(users[user].jrpg_data.character.equipment['right_hand'].id == item.id){
							users[user].jrpg_data.character.equipment['right_hand'] = null
						}
					};
					//equip item
					users[user].jrpg_data.character.equipment[slot] = item;
					//return text
					return_text = "```css\n["+users[user].name+"] #Inventory : Equipped item {"+item.name+"} to {"+slot+"}```";
				}else{
					return_text = "```css\n["+users[user].name+"] #Inventory : Item does not belong in that slot```"
				};
			}else{
				//item equipping
				if(slot in users[user].jrpg_data.character.equipment && item_slot == slot){
					//very easy for equipping other pieces of equipment
					//clear old slot
					users[user].jrpg_data.character.equipment[item_slot] = null;
					//equip item
					users[user].jrpg_data.character.equipment[item_slot] = item;
					//chat text
					return_text = "```css\n["+users[user].name+"] #Inventory : Equipped item {"+item.name+"} to {"+item_slot+"}```"
				}else{
					return_text = "```css\n["+users[user].name+"] #Inventory : Item does not belong in that slot```";
				}
			}
		}else{
			return_text = "```css\n["+users[user].name+"] #Inventory : Your job cannot equip that item```";
		}
	}
	else{
		//item slot does not exist
		return_text = "```css\n["+users[user].name+"] #Inventory : Item does not belong in that slot```";
	};
	//update user stats
	update_stats(users[user].jrpg_data.character, false);
	return return_text
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//TOWNS//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//save store data
function save_towns(){
	//grab required data
	var json = JSON.stringify(towns_list);
	
	//write file
	file_system.writeFile('towns.json', json, 'utf8', function (error) {
    if (error) throw error;
    });
};



//identifier
function create_item_identifier(dictionary){
	var identifier = Math.floor((Math.random()*900000))+100000;
	var i = 0;
	while((identifier in dictionary)&&(i < 10)){
		i++;
		identifier = Math.floor((Math.random()*900000))+100000;
	};
	return identifier = Math.floor((Math.random()*900000))+100000;
};



//restock store
function restock_store(store){
	var new_stock = {}
	//add old stock
	for(key in store.stock){
		new_stock[key] = store.stock[key]
	};
	//determine missing stock
	var missing_stock = store.max_stock-Object.keys(store.stock).length;
	for(var i = 0; i < missing_stock; i++){
		var keys = Object.keys(equipable_data);
		var random_key = Math.floor(Math.random()*keys.length);
		var id = create_item_identifier(new_stock);
		var item = generate_equipable(keys[random_key], store.tier, id, 1);
		new_stock[id] = item
	};
	return new_stock
};



//update cities
function update_cities(){
	/*
		1. Check if stores need to be restocked
		2. Check if quests need to be updated
	*/
	for(key in towns_list){
		//this town
		var town = towns_list[key];
		//check if town has a general TRADER
		if(town != undefined){
			if(town.hasOwnProperty("TRADER")){
				var d = new Date();
				var n = d.getTime();
				//check if trader needs to be restocked
				var keys = Object.keys(town.TRADER.stock);
				if(keys.length < town.TRADER.max_stock){
					//check when the store was last stocked
					if(town.TRADER.last_stock == null){
						//never stocked, restock
						var restock = restock_store(town.TRADER);
						town.TRADER.stock = restock;
						//restock time
						town.TRADER.last_stock = n;
					}else{
						//6 hours
						var restock_time = town.TRADER.last_stock+store_restock_time; 
						if(n > restock_time){
							//restock time
							town.TRADER.last_stock = n;
							//restock the store
							var restock = restock_store(town.TRADER);
							town.TRADER.stock = restock
						}
					}
				};
				//check if trader needs to be refreshed
				if(town.TRADER.last_refresh == null){
					//refresh all stock
					town.TRADER.stock = {};
					var restock = restock_store(town.TRADER);
					town.TRADER.stock = restock;
					//refresh time
					town.TRADER.last_refresh = n;
				}else{
					var refresh_time = town.TRADER.last_refresh+store_refresh_time; 
					if(n > refresh_time){
						//refresh time
						town.TRADER.last_refresh = n;
						//refresh all stock
						town.TRADER.stock = {};
						var restock = restock_store(town.TRADER);
						town.TRADER.stock = restock;
					}
				}
			}
		}
	};
	//save town data
	save_towns()
};



//give item
function give_item(users, user, item){
	//item id
	var identifier = Math.floor((Math.random()*900000))+100000;
	//check user has a character
	if(users[user].jrpg_data.character != null){
		//unique identifier, I mean NO WAY, is someone going to have 1 MILLION ITEMS right?
		var i = 0;
		while((identifier in users[user].jrpg_data.inventory)&&(i < 10)){
			i++;
			identifier = Math.floor((Math.random()*900000))+100000;
		};
		//give user the item
		item.id = identifier;
		users[user].jrpg_data.inventory[identifier] = item;
	};
};



//convert milliseconds to hours
function timeConvertHours(miliseconds){
	var num = miliseconds;
	if(num < 0){
		num = 0
	};
	var total_hours = num/3.6e6;
	var rhours = Math.floor(total_hours);
	var minutes = Math.floor((total_hours-rhours)*60);
	return rhours+" hours "+minutes+" minutes"
};



//fomatt trader page
function formatt_shop(town, shop, page, shop_name){
	var return_text = "";
	//page
	var tpage = Math.floor(Number(page));
	if(tpage === Infinity || String(tpage) !== page){
		return "<invalid page number>"
	};
	//return time
	var t = new Date().getTime();
	var restock_time = shop.last_stock+store_restock_time-t;
	var refresh_time = shop.last_refresh+store_refresh_time-t;
	//format display
	return_text = "```css\n"+
	"Inventory of the "+shop_name+" of ["+town.town_name+"] {"+shop.tier+"}\n"+
	"Restocks in : "+timeConvertHours(restock_time)+"\n"+
	"Refreshes in : "+timeConvertHours(refresh_time)+"```";
	//get inventory
	var keys = Object.keys(shop.stock);
	if(keys.length > 0){
		return_text += "```css\n"+
		"Showing Page #"+tpage+"\n";
		//target keys based on page
		var target_keys = 20*tpage-1;
		var start_key = 20*(tpage-1);
		for(var i = start_key; i < target_keys; i++){
			//if key exists
			if(keys[i] != undefined){
				var item = shop.stock[keys[i]];
				//makes sure item id is id
				shop.stock[keys[i]].id = keys[i];
				//add item to display
				return_text += "#"+item.id+" : {"+item.tier+"} "+item.name+" ["+item.worth+"]\n";
			}
		};
		return_text += "```";
	};
	return return_text
};



//buy item
function buy_item(users, user, l, purchase_id, currency){
	var return_text = null;
	var item = towns_list[l[0]][l[1]].stock[purchase_id];
	//check if user has the money to buy the item
	var item_price = item.worth;
	//user money
	var user_money = users[user].jrpg_data.currencies[currency];
	//if user_money is undefined that means the currency used is the generic token, otherwise it is a special currency
	if(user_money == undefined){
		user_money = users[user].currency;
	};
	//now we can check if the user can afford the item
	if(user_money >= item_price){
		//subtract money
		if(users[user].jrpg_data.currencies[currency] == undefined){
			users[user].currency -= item_price;
			user_money = users[user].currency
		}else{
			users[user].jrpg_data.currencies[currency] -= item_price;
			user_money = users[user].jrpg_data.currencies[currency]
		};
		
		//clone object before we delete it
		var item_clone = v8.deserialize(v8.serialize(item));
		//need to trasnfer item
		give_item(users, user, item_clone);
		
		//give return text
		return_text = "```css\n"+
		users[user].name+", thank you for purchasing ["+item.name+"]```"+
		"```css\n"+users[user].name+" your new balance is "+user_money+"```";
		
		//delete item from shop
		delete towns_list[l[0]][l[1]].stock[purchase_id];
	}else{
		//cannot afford item
		return_text = "```css\n"+users[user].name+" you cannot afford ["+item.name+"]```";
	};
	return return_text
};



//sell item to shop
function sell_item(users, user, item_id, l){
	var return_text = null;
	var item = users[user].jrpg_data.inventory[item_id];
	//user has item to sell
	if(item != undefined){
		//check if the shop exists
		if(towns_list[l[0]][l[1]] != undefined){
			//sell item
			//gives tokens
			var item_price = item.worth;
			var item_clone = v8.deserialize(v8.serialize(item));
			//give item clone a new id
			var id = create_item_identifier(towns_list[l[0]][l[1]].stock);
			//give new id to item
			item_clone.id = id;
			//give store item
			towns_list[l[0]][l[1]].stock[id] = item_clone;
			//give money
			users[user].currency += item_price;
			//text to display
			return_text = "```css\n"+
			users[user].name+" sold ["+item.name+"] for "+item_price+"```"+
			"```css\n"+users[user].name+" your new balance is "+users[user].currency+"```";
			//delete item from player inventory
			delete users[user].jrpg_data.inventory[item_id]
		}else{
			return_text = "<you cannot sell items at this location>"
		}
	}else{
		return_text = "<you do not own this item>"
	};
	return return_text
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//FORMATT INFO///////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//return item stats
function fomatt_item_stats(item){
	var return_text = null;
	//return different formats for each type of equipment
	if(item.type == "weapon"){
		return_text = "```css\n"+
		item.name+" +"+item.rank+" | Tier {"+item.tier+"} | "+"#"+item.id+"\n"+
		"["+item.type+"]."+item.wield_type+"\n"+
		"Equippable To: ";
		for(var i = 0; i < item.class_lock.length; i++){
			return_text += "("+item.class_lock[i]+")";
		};
		return_text += "\nElement : ["+item.elemental+"]\n\n"+
		"#Stats\n";
		for(key in item.stats){
			return_text += key+" : "+item.stats[key]+"\n"
		};
		if(Object.keys(item.attributes).length > 0){
			return_text += "\n"+
			"#Attributes\n";
			for(key in item.attributes){
				return_text += key+" : "+item.attributes[key]+"\n"
			};
		};
		if(Object.keys(item.elemental_values).length > 0){
			return_text += "\n"+
			"#Elemental_Resistances\n";
			for(key in item.elemental_values){
				return_text += key+" : "+item.elemental_values[key]+"%\n"
			};
		};
		if(Object.keys(item.status_values).length > 0){
			return_text += "\n"+
			"#Status_Resistances\n";
			for(key in item.status_values){
				return_text += key+" : "+item.status_values[key]+"%\n"
			};
		};
		if(Object.keys(item.spell_enable).length > 0){
			return_text += "\n"+
			"#Abilities\n";
			for(key in item.spell_enable){
				return_text += key+"\n"
			};
		};
		return_text += "\n\nWorth ["+item.worth+"]```"
	};
	return return_text
};



//display skills
function formatt_skills(object){
	var chr = object;
	var fText = "";
	
	fText = "```css\n"+
	"Skills of ["+chr.primary_stats.name+"] #"+chr.primary_stats.job+"\n```"+
	"```css\n"
	for(key in chr.learned_skills){
		fText += "["+skills_list[key].mp_cost+"] "+key+" : "+skills_list[key].effect+"\n"
	};
	fText += "```";
	return fText
};



//skill info
function formatt_skill_info(skill_name){
	var return_text = null;
	if(skill_name in skills_list){
		var skill = skills_list[skill_name];
		//fomatt text
		return_text = "```css\n["+skill.skill_name+"]\n"+
		"Mp Cost : "+skill.mp_cost+"\n"+
		"Type : "+skill.type+"\n"+
		"Effect : "+skill.effect+"\n";
		if(skill.elemental_type != null){
			return_text+="Element : "+skill.elemental_type+"\n";
		};
		if(skill.target_stats != null){
			return_text+="Target Stats : "+skill.skill_power+"% of ";
			for(var i=0; i < skill.target_stats.length; i++){
				return_text+="("+skill.target_stats[i]+")";
			}
			return_text+="\n";
		}else if(skill.target_stats == null && skill.skill_power != null){
			return_text+="Skill Power : "+skill.skill_power+"\n";
		};
		if(skill.hits != null){
			return_text+="Hits : "+skill.hits+"\n";
		};
		//bonus effects
		if(skill.bonus_effects != null){
			if(Object.keys(skill.bonus_effects).length > 0){
				return_text += "\n{Extra Effects}\n";
				//for each key
				for(key in skill.bonus_effects){
					return_text += "{"+key+":'"+skill.bonus_effects[key].name+"'}: \n";
					if(skill.bonus_effects[key].effect_name != null){
						return_text += "	Extra Effect : "+skill.bonus_effects[key].effect_name+"\n"
					};
					if(skill.bonus_effects[key].potency_type != null){
						return_text += "	Type : "+skill.bonus_effects[key].potency_type+"\n"
					};
					if(skill.bonus_effects[key].proc_chance != null){
						return_text += "	Chance : "+skill.bonus_effects[key].proc_chance+"%\n"
					};
					if(skill.bonus_effects[key].effect != null){
						return_text += "	Effect : "+skill.bonus_effects[key].effect+"\n"
					};
					if(skill.bonus_effects[key].potency != null){
						return_text += "	Power : "+skill.bonus_effects[key].potency+"\n"
					};
					if(skill.bonus_effects[key].duration != null){
						return_text += "	Duration : "+skill.bonus_effects[key].duration+"\n\n"
					};
				};
			};
		};
		return_text+="```";
	}
	return return_text
};



//zone info
function formatt_zone_info(location_object){
	/*
		location object from determine_location functions
		consists of an array
		[0] = zone_name
		[1] = player location
	*/
	var return_text = null;
	//check if zone exists
	if(location_object != null){
		if(world_map[location_object[0]] != undefined){
			//formatt text
			//add a time feature in the future
			return_text = "```css\n"+
			"Current Coordinates : ("+location_object[1].x+","+location_object[1].y+")\n"+
			"Region : "+location_object[0]+"\n"+
			"Travesable By : ";
			for(var i = 0; i < world_map[location_object[0]].travel_methods.length; i++){
				return_text += world_map[location_object[0]].travel_methods[i]+" "
			};
			return_text += "\n\nRegion Description : \n"+world_map[location_object[0]].description+"\n\n```"
		};
	};
	return return_text
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//TARGETING//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//return user id from sting
function target_user_id(string){
	var target_id = 0;
	target_id = string.substring(string.lastIndexOf("<@") + 2, string.lastIndexOf(">"));
	//nicknames
	if(string.includes("<@!")){
		target_id = string.substring(string.lastIndexOf("<@!") + 3, string.lastIndexOf(">"));
	};
	return target_id				
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//WORLD MAP//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//check location
/*
	1.check_location if the player is a town or location
	2.determine_location is used to finding where the player is on the world map
*/
function check_location(user, premise){
	//target location
	var this_location = null;
	//check if user is in a town
	for(town in towns_list){
		if(towns_list[town]["town_location"].x == user.jrpg_data.user_position.x && towns_list[town]["town_location"].y == user.jrpg_data.user_position.y){
			//set user location
			user.jrpg_data.user_location = town;
			this_location = [user.jrpg_data.user_location];
		}
	};
	//if not check where the user is
	if(this_location == null){
		var position = [user.jrpg_data.user_position.x, user.jrpg_data.user_position.y]
		var find_location = determine_location(position);
		if(find_location != null){
			if(find_location.length >= 1){
				user.jrpg_data.user_location = find_location[0]
			}
		}
	};
	//set location
	if(user.jrpg_data.user_location in towns_list){
		this_location = [user.jrpg_data.user_location];
		//check if the premise exists
		if(towns_list[user.jrpg_data.user_location][premise] != undefined){
			this_location.push(premise)
		}
	};
	return this_location
};



function determine_location(position){
	//we need to find this value
	var this_location = null;
	/*
		position is an  array = [x,y]
		1.first we take the players location and start incrementing the y_pos by one each time
		2.then we check this test postion with each of the zones and the borders of the zones
		3.if the test point hits a border of a zone then we know which zone the player is in
	*/
	var testpoint = {
		x : position[0],
		y : position[1]
	};
	var closestpoint = {
		x : 0,
		y : 0
	};
	//make sure world map exists
	if(world_map != undefined){
		//gather all the points
		var all_vertex = [];
		for(zone in world_map){
			for(var i = 0; i < world_map[zone]["border_points"].length; i++){
				all_vertex.push(world_map[zone]["border_points"][i])
			};
		};
		//define the closest border vertex
		var nearest_dist = -1;
		for(var p = 0; p < all_vertex.length; p++){
			//test distance from a border point
			var test_dist = Math.floor((all_vertex[p].x-testpoint.x)*(all_vertex[p].x-testpoint.x)+(all_vertex[p].y-testpoint.y)*(all_vertex[p].y-testpoint.y))
			//if the distance is shorter than before then set as new closest point
			if(nearest_dist == -1 || test_dist < nearest_dist){
				nearest_dist = test_dist;
				closestpoint = all_vertex[p]
			}
		};
		//now that we have a line segement we can determine the intersection points, and then the closests intersection point will be the border line
		/*
			slope_1 = test_point -> closest point
			slope_2 = A -> B border points
			y_int_1 = test_point -> closest point
			y_int_2 = A -> B border points
		*/
		var intersections = [];
		//
		//for each of the border lines calculate an intersection
		for(zone in world_map){
			//test each border
			for(var i = 0; i < world_map[zone]["border_points"].length; i++){
				var border_point_1, border_point_2;
				//if the border point is the last border point loop the border pair
				//-1 is because once we are at the last border point the border become the last -> first
				if(i == world_map[zone]["border_points"].length-1){
					border_point_1 = world_map[zone]["border_points"][i];
					border_point_2 = world_map[zone]["border_points"][0]
				}else{
					border_point_1 = world_map[zone]["border_points"][i];
					border_point_2 = world_map[zone]["border_points"][i+1]
				};
				//if there are border points we have a line segment and we can calculate for an intersection
				if(border_point_1 != undefined && border_point_2 != undefined){
					/*
						There are a series of cases that can occur here
						1.Both lines are skew lines and have one intersection point
						2.One of the lines is vertical and thus has an undefined slope
						3.Lines are parallel and thus they never intersect unless they are the same line
					*/
					var slope_1 = (closestpoint.y-testpoint.y)/(closestpoint.x-testpoint.x);
					var slope_2 = (border_point_1.y-border_point_2.y)/(border_point_1.x-border_point_2.x);
					//y_intercepts
					var y_int_1 = testpoint.y-slope_1*testpoint.x;
					var y_int_2 = border_point_1.y-slope_2*border_point_1.x
					//find the intersect point
					var x = 0;
					var y = 0;
					//if slope_1 is defined but slope_2 is not
					if(isFinite(slope_1) == true && isFinite(slope_2) == false){
						x = border_point_1.x;
						y = slope_1*x+y_int_1
					}
					//if slope_2 is defined but slope_1 is not
					else if(isFinite(slope_2) == true && isFinite(slope_1) == false){
						x = testpoint.x;
						y = slope_2*x+y_int_2				
					}
					//if slope_1 and slope_2 are defined and are not equal
					else if(isFinite(slope_1) == true && isFinite(slope_2) == true && slope_1 != slope_2){
						x = (y_int_2-y_int_1)/(slope_1-slope_2);
						y = slope_1*x+y_int_1;
					};
					//now we need to see if x and y lie within min max x y determined by border points
					if((((x-border_point_1.x)*(x-border_point_2.x)) <= 0)&&(((y-border_point_1.y)*(y-border_point_2.y)) <= 0)){
						//calculate distance from player
						var calculate_dist = Math.sqrt((x-testpoint.x)*(x-testpoint.x)+(y-testpoint.y)*(y-testpoint.y));
						//insert point into intersections
						var this_intersection = {
							x : x,
							y : y,
							border_parent : zone,
							dist : calculate_dist
						}
						intersections.push(this_intersection);
					}
				}
			};
		}
		//determine the closest intersection and then find the region
		var closest_border = null;
		var nearest_border = -1;
		for(var b = 0; b < intersections.length; b++){
			//if the distance is shorter than before then set as new closest point
			if(nearest_border == -1 || intersections[b].dist < nearest_border){
				nearest_border = intersections[b].dist;
				closest_border = intersections[b]
			}
		};
		//return location
		if(closest_border != null){
			/*
				[0] = zone_name
				[1] = player_coordinates
			*/
			this_location = [closest_border.border_parent, testpoint]
		}
	};
	
	return this_location
};



//move party command
//destination should be array [0] is x and [1] is y
function move_party(local_party, users, destination){
	//message text
	var return_text = null;
	//start cordinates
	var s_cords = {
		x : users[local_party.party_leader.id].jrpg_data.user_position.x,
		y : users[local_party.party_leader.id].jrpg_data.user_position.y,
	};
	//target cordinates
	var t_cords = {
		x : destination[0],
		y : destination[1],
	};
		
	//since we are using vectors it doesn't matter if we go straight up or down
	var direction_vector = {
		x : t_cords.x - s_cords.x,
		y : t_cords.y - s_cords.y,
	}
	//convert direction vector into unit vector
	var d_vector_magnitude = Math.sqrt(direction_vector.x*direction_vector.x+direction_vector.y*direction_vector.y);
	direction_vector.x /=  d_vector_magnitude;
	direction_vector.y /= d_vector_magnitude;
	/*
		if you are confused at the current vector
			
		X = x + m d.x
		Y = y + m d.y
			
		since d.x and d.y make a unit vector if we increment m by one we move one unit in the direction of the target X,Y from x,y
	*/
	//first check if the magnitude is greater than 1 
	if(d_vector_magnitude < 1){
		return "<the party is already at the destination>"
	};
	//set up start locaiton
	local_party.world_position.x = s_cords.x;
	local_party.world_position.y = s_cords.y;
	//the next step is to use the magnitude of the distance between the two points, easily done since it is d_vector_magnitude
	//we are going to need to do some funky math at the end to snap the player back to the target location because it is a grid system and we are moving across it with skew lines
	//but generally we just need to increment each of the positions along the way
	//also we need to start at i = 1 because we need to increment starting at 1
	for(var i = 1; i <= Math.floor(d_vector_magnitude); i++){
		//generate new position
		var move_to_position = {
			x : s_cords.x + i*direction_vector.x,
			y : s_cords.y + i*direction_vector.y,
		};
		//check to see if the party can move to this position
		//round to the move_to_position cords to the nearest tile
		move_to_position.x = Math.floor(move_to_position.x);
		move_to_position.y = Math.floor(move_to_position.y);
		//check location
		var next_location = determine_location([move_to_position.x, move_to_position.y]);
		//does location exist
		if(next_location != null){
			//set next_location to an actual location object
			var obj_location = world_map[next_location[0]];
			/*
				Now that we have this happening we have some different events that can occur while traveling/moving
				1.The party runs into some terrain that they cannot cross and traveling ends, message plays
					a.The party runs into a combat encounter!
						i.normal encounter
						ii.ambush encounter
						iii.advantage encounter
					b.The party runs into a non-combat encounter.
					c.The party runs into some random event, i.e "party_member_x tried to tell a joke but no one laughed."
			*/
			//first check that the party can move to the next tile
			var can_move_to = false
			for(var z = 0; z < local_party.transportation.length; z++){
				if(obj_location.travel_methods.includes(local_party.transportation[z])){
					can_move_to = true
				};
			}
			//do encounter stuff
			if(can_move_to == true){
				//DO THE ENCOUNTER STUFF HERE
				//do mob encounters first
				if(Object.keys(obj_location.encounters.mob_groups).length >= 1){
					//encounter true if is true then that means we step out of loop
					var encounter_true = false;
					//for each possible mob group check if the encounter occurs
					for(key in obj_location.encounters.mob_groups){
						var mob_counter_chance = Math.floor(Math.random() * 1000);
						if(mob_counter_chance < obj_location.encounters.mob_groups[key].chance){
							//do encounter
							encounter_true = true
							//create new mob party make sure the party doesn't already exist
							//the name is generated from the mob group name + an id
							var party_name = key + "-" + Math.floor(Math.random()*900000);
							while((party_name in mob_parties)&&(i < 10)){
								i++;
								party_name = key + "-" + Math.floor(Math.random()*900000);
							};
							//find the mob group
							var mob_group = null;
							for(size in mob_sets){
								if(key in mob_sets[size]){
									mob_group = mob_sets[size][key];
									break
								}
							};
							//if there is a mob group then add the mobs the mobs
							//save mob ids
							var mob_ids = [];
							if(mob_group != null){
								//create the mobs
								for(n_mob in mob_group.mobs){
									//for amount of mobs in mob group
									for(var n = 0; n < mob_group.mobs[n_mob].number; n++){
										//create a new mob
										var new_mob_id = Math.floor(Math.random()*900000);
										while((new_mob_id in active_mobs)&&(i < 10)){
											i++;
											new_mob_id = Math.floor(Math.random()*900000);
										};
										//find the new mob
										for(sizes in all_mobs){
											if(n_mob in all_mobs[sizes]){
												//now create the new mob
												active_mobs[new_mob_id] = new mob(all_mobs[sizes][n_mob], mob_group.mobs[n_mob].tier);
												//push id to array
												mob_ids.push(new_mob_id);
												break
											}
										};
									};
								}
							};
							//assign a mob leader
							var m_leader = new party_member('mob', active_mobs[mob_ids[0]].primary_stats.name, mob_ids[0]);
							//remove mob leader from mob ids
							mob_ids.splice(0,1);
							//create the new mob party and add the mobs to the party
							mob_parties[party_name] = new party(party_name, m_leader);
							//add everyone else to the mob party
							for(var m = 0; m < mob_ids.length; m++){
								var n_mob_member = new party_member('mob', active_mobs[mob_ids[m]].primary_stats.name, mob_ids[m]);
								mob_parties[party_name].members.push(n_mob_member)
							};
							//now that the parties are made we need to initate a battle between the two parties player and mob
							var battle_encounter_name = local_party.name+"/"+party_name;
							//else error since the battle name already exists
							if(battle_encounter_name in battles.encounter_battles){
								return "<an error occured>"
							}else{
								//create battle
								battles.encounter_battles[battle_encounter_name] = new combat_encounter(local_party.name, party_name);
							};
							
							//start the battle
							//set incombat to true
							local_party.in_combat = true;
							mob_parties[party_name].in_combat = true;
							
							local_party.battle_type = "encounter_battles";
							mob_parties[party_name].battle_type = "encounter_battles";
							
							local_party.battle_name = battle_encounter_name;
							mob_parties[party_name].battle_name = battle_encounter_name;
							
							battles.encounter_battles[battle_encounter_name].combat_encounter_started = true;
							
							//setup the encounter details
							return_text = "```css\n»TRAVEL EVENT«\nParty Name : #"+local_party.name+"\n\n"+mob_group.description+"\nGet ready for a combat encounter! Current position : ("+move_to_position.x+","+move_to_position.y+")```"
							//leave loop there is only one encounter
							break
						}
					};
					//break out of loop if an encounter happens
					if(encounter_true == true){
						break
					};
				};
				//set party position to new location
				local_party.world_position.x = move_to_position.x;
				local_party.world_position.y = move_to_position.y;
				
				//This is for when we reach the final position
				if(i == Math.floor(d_vector_magnitude)){
					//this is where the funky stuff happens
					return_text = "```css\n»TRAVEL EVENT«\nParty Name : #"+local_party.name+"\nThe party has reach their destination and arrived at ("+obj_location.zone_name+") at ("+move_to_position.x+","+move_to_position.y+")```"
					/*
						1.we are at the location
						2. we are not at the location thus we need to check to see if we can move to that location then move to it.
					*/
					if(move_to_position.x != t_cords.x || move_to_position.y != t_cords.y){
						var test_location = determine_location([t_cords.x, t_cords.y]);
						if(test_location != null){
							for(var z = 0; z < local_party.transportation.length; z++){
								if(world_map[test_location[0]].travel_methods.includes(local_party.transportation[z])){
									//set move to position cords
									move_to_position.x = t_cords.x;
									move_to_position.y = t_cords.y;
									//set party position to new location
									local_party.world_position.x = move_to_position.x;
									local_party.world_position.y = move_to_position.y;
									//set text
									return_text = "```css\n»TRAVEL EVENT«\nParty Name : #"+local_party.name+"\nThe party has reach their destination and arrived at ("+obj_location.zone_name+") at ("+move_to_position.x+","+move_to_position.y+")```"
									break
								}else{
									//we ran into a problem where we can't move to this location any more
									return_text = "```css\n»TRAVEL EVENT«\nParty Name : #"+local_party.name+"\nThe party has reached an impasse in their travels upon reaching ("+obj_location.zone_name+") at ("+move_to_position.x+","+move_to_position.y+")```"
									//break out of the travel loop
									break
								}
							}
						}
					}
				};
			}else{
				//we ran into a problem where we can't move to this location any more
				return_text = "```css\n»TRAVEL EVENT«\nParty Name : #"+local_party.name+"\nThe party has reached an impasse in their travels upon reaching ("+obj_location.zone_name+") at ("+move_to_position.x+","+move_to_position.y+")```"
				//break out of the travel loop
				break
			}
		};
	};
	//move all party members to the party location
	for(var p = 0; p < local_party.members.length; p++){
		var this_player = users[local_party.members[p].id];
		if(this_player != undefined){
			this_player.jrpg_data.user_position.x = local_party.world_position.x;
			this_player.jrpg_data.user_position.y = local_party.world_position.y
		};
	};
	//after all movement display text
	return return_text
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//MODULE/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//jrpg module call
module.exports = {
	
	/*
	jrpg_combat
	
	battle_contents:
	1. run battles
	*/
	jrpg_combat : function(msg_object, users){
		var combat_message = execute_battles(users);
		return combat_message
	},
	
	
	
	/*
	jrpg_main
	
	cities:
	1.Update Cities
	
	command_contents:
	1. create character
	2. check stats
	3. party commands
	4. duel commands
	
	battle_contents:
	1. run battles
	*/
	jrpg_main : function(msg_object, users){
		/*
			jrpg_cities
		*/
		update_cities();
		/*
			Commands
		*/
		//users
		var message = msg_object.message.content;
		var author = msg_object.message.author.id;
		//check if author exists
		if(author in users){
		}else{
			return "<NO USER PROFILE>"
		};
		//splice message by spaces
		var msg_parts = message.split(".");
		//check if first part is a command
		if(msg_parts.length > 1){
			/*
				CREATE CHARACTER COMMAND
				1.COMMAND
				2.CHARACTER NAME
				3.CHARACTER JOB
			*/
			if((msg_parts[0] == jrpg_commands['create_character'])&&(msg_parts.length == 3)){
				//check if in party, can only create_characters out of party
				var p = check_party(author);
				if(p != false){
					return "<you cannot create a character while in a party>"
				};
				//check name length
				if(msg_parts[1].length > 32){
					return "<length of name exceedes 32 characters>"
				};
				//no @user names
				if(msg_parts[1].includes("<@" || "<@!")){
					return "<there are restricted characters in the name>"
				}
				//check if job requested exists
				if(msg_parts[2] in jobs){
					//create character
					users[author]['jrpg_data']['character'] = new character(msg_parts[1], msg_parts[2], 0);
					//update stats
					update_stats(users[author]['jrpg_data']['character'], true);
					return ("<successfully created character " + msg_parts[1] + ">")
				}else{
					//job error
					return "<that job does not exist>"
				}
			}
			/*
				CHECK STATS COMMAND
				1.COMMAND
				2.OPTIONAL TO CHECK OTHER CHARACTERS
			*/
			else if((msg_parts[0] == jrpg_commands['check_stats'])&&(msg_parts.length < 3)){
				//the stats of the character we want to display
				var display_chr = null;
				//if second arguement doesn't exit check own stats
				var mention = msg_parts[1];
				if(msg_parts.length == 2){
					var target_id = target_user_id(mention);
					//test if target is in user_data
					if(target_id in users){
						if(users[target_id]['jrpg_data']['character'] == null){
							return "<no character found>"
						};
						//test for character can't use try because user objects create with null character and we cant use instanceof because the data is loaded from a json
						if(users[target_id]['jrpg_data']['character'].hasOwnProperty('primary_stats')){
							display_chr = users[target_id]['jrpg_data']['character']
						}else{
							return "<no character found>"
						}
					}
				}else{
					//no second arugment check stats for user that send message
					if(users[target_id]['jrpg_data']['character'] == null){
						return "<no character found>"
					};
					if(users[author]['jrpg_data']['character'].hasOwnProperty('primary_stats')){
						display_chr = users[author]['jrpg_data']['character']
					}else{
						return "<no character found>"
					}
				};
				//if the character is null send no message
				if (display_chr == null) {
					return "<no character found>"
				}else if(display_chr.hasOwnProperty('primary_stats')){
					//Return the edited stats
					return formatt_stats(display_chr)
				}
			}
			/*
				CHECK SKILLS COMMAND
			*/
			else if((msg_parts[0] == jrpg_commands['check_skills'])&&(msg_parts.length < 3)){
				//the character we want to display
				var display_chr = null;
				//if second arguement doesn't exit check own stats
				var mention = msg_parts[1];
				if(msg_parts.length == 2){
					var target_id = target_user_id(mention);
					//test if target is in user_data
					if(target_id in users){
						if(users[target_id]['jrpg_data']['character'] == null){
							return "<no character found>"
						};
						//test for character can't use try because user objects create with null character and we cant use instanceof because the data is loaded from a json
						if(users[target_id]['jrpg_data']['character'].hasOwnProperty('learned_skills')){
							display_chr = users[target_id]['jrpg_data']['character']
						}else{
							return "<no character found>"
						}
					}
				}
				//if the character is null send no message
				if (display_chr == null) {
					return "<no character found>"
				}else if(display_chr.hasOwnProperty('learned_skills')){
					//Return the edited stats
					return formatt_skills(display_chr)
				}
			}
			/*
				QUICK CHECK COMMANDS
				1.quick_status
			*/
			else if((msg_parts[0] == jrpg_commands['quick_status'])&&(msg_parts.length < 3)){
				//the character we want to display
				var display_chr = null;
				//if second arguement doesn't exit check own stats
				var mention = msg_parts[1];
				if(msg_parts.length == 2){
					var target_id = target_user_id(mention);
					//test if target is in user_data
					if(target_id in users){
						if(users[target_id]['jrpg_data']['character'] == null){
							return "<no character found>"
						};
						display_chr = users[target_id]['jrpg_data']['character']
					}
				}
				//if the character is null send no message
				if(display_chr == null){
					return "<no character found>"
				}else{
					//Return the edited stats
					return formatt_quick_stats(display_chr)
				}
			}
			/*
				QUICK CHECK COMMANDS
			*/
			/*
				PARTY COMMANDS
				1. CREATE PARTIES
				2. JOIN PARTIES
				3. LEAVE PARTIES
				4. DISBAND PARTIES
				5. KICK MEMBERS
			*/
			//create party
			else if((msg_parts[0] == jrpg_commands['party_create'])&&(msg_parts.length == 2)){
				//check if user has a character
				if (check_character(users, author) == false){
					return "<you must create a character before creating a party>"
				};
				//check to see if user belongs to a party
				if (check_party(author) == false){
					/*
					1. COMMAND
					2. NAME
					*/
					party_name = msg_parts[1]
					//check if party name is already taken
					if(party_name in parties){
						return "<party name has already been taken>"
					}else{
						//create new party
						var newPLeader = new party_member('player', users[author].jrpg_data.character.primary_stats.name, author);
						parties[party_name] = new party(party_name, newPLeader);
						return "<successfully created new party " + party_name + ">"
					}
				}else{
					return "<you already belong to a party>"
				}
			}
			//list party members
			else if((msg_parts[0] == jrpg_commands['party_list'])&&(msg_parts.length == 2)){
				var p = null;
				//check if party exists
				try {
					p = parties[msg_parts[1]]
				} catch (err) {
					console.log(err)
				};
				//now that party is checked if it exists
				if(p != null){
					return formatt_party_list(p, users)
				}else{
					return "<that party does not exist>"
				}
			}
			else if((msg_parts[0] == jrpg_commands['party_invite'])&&(msg_parts.length == 2)){
				//check if user is in a party
				var p = check_party(author);
				if(p == false){
					return "<you do not belong to a party>"
				}else{
					//check if the sender is a party leader
					if(author == p.party_leader.id){
						//check if the party still has spaces
						if(p.members.length < p.max_size){
							//add invite to invites if target exists
							var mention = msg_parts[1];
							var target_id = target_user_id(mention);
							//test if target is in user_data
							if(target_id in users){
								//test for character can't use try because user objects create with null character and we cant use instanceof because the data is loaded from a json
								if(users[target_id]['jrpg_data']['character'].hasOwnProperty('primary_stats')){
									p.invites.push(target_id);
									return "<**"+users[author].jrpg_data.character.primary_stats.name+"** has invited **"+users[target_id].jrpg_data.character.primary_stats.name+"** to the party **"+ p.name+"**>"
								}else{
									return "<user does not have a created character>"
								}
							}else{
								return "<user does not have a created character>"
							}
						}else{
							return "<the max size of the party has been reached>"
						}
					}else{
						return "<you are not the leader of the party>"
					}
				}
			}
			else if((msg_parts[0] == jrpg_commands['party_join'])&&(msg_parts.length < 3)){
				//check if user is in a party
				var p = check_party(author);
				if(p == false){
					//if the user has a character
					if(users[author]['jrpg_data']['character'] != undefined){
						if(users[author]['jrpg_data']['character'].hasOwnProperty('primary_stats')){
							//check if the user has an invite
							var target_party = msg_parts[1];
							//check if party exists
							if(target_party in parties){
								//if user has an invite
								var ft_party = parties[target_party];
								if(ft_party.invites.includes(author)){
									//if the party is full
									if(ft_party.members.length < ft_party.max_size){
										//party is in combat
										if(ft_party.in_combat == false){
											//join the party
											var newPMemember = new party_member('player', users[author].jrpg_data.character.primary_stats.name, author);
											ft_party.members.push(newPMemember);
											//remove from invites
											remove_from_array(ft_party.invites, author)
											return "<**"+users[author].jrpg_data.character.primary_stats.name+"** has joined the party **"+ft_party.name+"**>"
										}else{
											return "<that party is currently in battle>"
										}
									}else{
										return "<that party is currently full>"
									}
								}else{
									return "<you have not been invited to that party>"
								}
							}else{
								return "<that party does not exist>"
							}
						}
					}else{
						return "<you need a character before you can join a party>"
					}
				}else{
					return "<you are already in a party>"
				}
			}
			else if((msg_parts[0] == jrpg_commands['party_leave'])&&(msg_parts.length < 3)){
				//check if user is part of a party
				var p = check_party(author);
				if(p == false){
					return "<you are not in a party>"
				}else{
					//if party exists
					if(msg_parts[1] in parties){
						var t_party = parties[msg_parts[1]];
						//if user is in that party
						if(t_party == p){
							//remove from party
							remove_from_party(t_party, author);
							//if the member is a leader disband party
							if(author == p.party_leader.id){
								//remove party from list of parties
								var pName = String(p.name);
								delete parties[p.name];
								return "<**"+pName+"** was disbanded>"
							}else{
								return "<**"+users[author].jrpg_data.character.primary_stats.name+"** left the party **"+p.name+"**>"
							}
						}else{
							return "<you do not belong to that party>"
						}
					}else{
						return "<that party does not exist>"
					}
				}
			}
			else if((msg_parts[0] == jrpg_commands['party_kick'])&&(msg_parts.length < 3)){
				//check if user is part of a party
				var p = check_party(author);
				if(p == false){
					return "<you are not in a party>"
				}else{
					//if the user is the leader of the party
					if(author == p.party_leader.id){
						var mention = msg_parts[1];
						var target = target_user_id(mention)
						//if user is in that party
						var check_p = check_party(target);
						if(check_p != false){
							if(check_p == p){
								//if kicking self
								if(target != author){
									//kick target
									remove_from_party(p, target);
									return "<**"+users[target].jrpg_data.character.primary_stats.name+"** was removed from **"+p.name+"**>"
								}else{
									return "<you cannot kick yourself>"
								}
							}else{
								return "<the person you are trying to kick does not exist>"
							}
						}else{
							return "<the person you are trying to kick does not exist>"
						}
					}else{
						return "<you are not the leader of your current party>"
					}
				}
			}
			/*
				DUEL COMMANDS
				1. CREATE DUEL
				3. COMBAT
			*/
			//call duel
			else if((msg_parts[0] == jrpg_commands['call_duel'])&&(msg_parts.length == 2)){
				//if user belongs to a party
				var p = check_party(author);
				if(p == false){
					return "<you must be in a party to call a duel>"
				}else{
					//is the user the leader of the part
					if(author == p.party_leader.id){
						//check if the opposing party exists
						var duel_target = msg_parts[1];
						if(duel_target in parties){
							//check if the other party is already in a duel
							if(parties[duel_target].in_combat == true){
								return "<the party you requested a duel with is already in a battle>"
							}
							//check if the other party is self
							if(duel_target == p.name){
								return "<you cannot call a duel with yourself>"
							}
							//check if the duel already exists
							var duel_name = p.name+"/"+duel_target;
							if(duel_name in battles.duels){
								return "<the duel you requested has already been proposed>"
							}else{
								//create duel
								battles.duels[duel_name] = new duel(p.name, duel_target);
								return "<party **"+p.name+"** has requested a duel with party **"+duel_target+"**>"
							}
						}else{
							return "<the party you requested a duel with does not exist>"
						}
					}else{
						return "<you must be the leader of the party to call a duel>"
					}
				}
			}
			//revoke duel
			else if((msg_parts[0] == jrpg_commands['revoke_duel'])&&(msg_parts.length == 2)){
				//if user belongs to a party
				var p = check_party(author);
				if(p == false){
					return "<you must be in a party to cancel a duel>"
				}else{
					//party leader only
					if(author == p.party_leader.id){
						//check if other party exists
						var duel_target = msg_parts[1];
						if(duel_target in parties){
							//check if the duel request exists
							var duel_name = p.name+"/"+duel_target;
							if(duel_name in battles.duels){
								//check if the duel has already started
								if(battles.duels[duel_name].duel_accepted == false){
									//remove duel request
									delete battles.duels[duel_name];
									return "<the duel request between **"+p.name+"** and **"+duel_target+"** has been revoked>"
								}else{
									return "<this duel has already begun>"
								}
							}else{
								return "<this duel request does not exist>"
							}
						}else{
							return "<you are trying to cancel a duel with a party that doesn't exist>"
						}
					}else{
						return "<you must be the leader of the party to cancel a duel>"
					}
				}
			}
			//accept duel
			else if((msg_parts[0] == jrpg_commands['accept_duel'])&&(msg_parts.length == 2)){
				//if user belongs to a party
				var p = check_party(author);
				if(p == false){
					return "<you must be in a party to accept a duel>"
				}else{
					//party leader only
					if(author == p.party_leader.id){
						//check if other party exists
						var duel_target = msg_parts[1];
						if(duel_target in parties){
							//check if duel requests exists
							var duel_name = duel_target+"/"+p.name;
							if(duel_name in battles.duels){
								//duel request exists check to make sure your party is not in battle
								if(p.in_combat == true){
									return "<you cannot accept a duel while in combat>"
								};
								//make sure that other party is not in combat
								if(parties[duel_target].in_combat == false){
									//accept duel
									var this_duel = battles.duels[duel_name];
									//set combat and battle type for both parties
									p.in_combat = true;
									parties[duel_target].in_combat = true;
									
									p.battle_type = "duels";
									parties[duel_target].battle_type = "duels";
									
									p.battle_name = duel_name;
									parties[duel_target].battle_name = duel_name;
									
									//start duel
									this_duel.duel_accepted = true;
									
									return "<the duel between **"+duel_target+"** and **"+p.name+"** has been accepted and will start soon>"
								}else{
									return "<the other party is in a battle and cannot duel at the moment>"
								}
							}else{
								return "<that duel request does not exist>"
							}
						}else{
							return "<you cannot accept the duel of a party that does not exist>"
						}
					}else{
						return "<you must be the leader of the party to accept a duel>"
					}
				}
			}
			//reject duel
			else if((msg_parts[0] == jrpg_commands['reject_duel'])&&(msg_parts.length == 2)){
				//if user belongs to a party
				var p = check_party(author);
				if(p == false){
					return "<you must be in a party to reject a duel>"
				}else{
					//party leader only
					if(author == p.party_leader.id){
						//check if other party exists
						var duel_target = msg_parts[1];
						if(duel_target in parties){
							//check if duel requests exists
							var duel_name = duel_target+"/"+p.name;
							if(duel_name in battles.duels){
								//reject duel request
								delete battles.duels[duel_name];
								return "<**"+p.name+"** has rejected the duel request of **"+duel_target+"**>"
							}else{
								return "<that duel request does not exist>"
							}
						}else{
							return "<you cannot reject the duel of a party that does not exist>"
						}
					}else{
						return "<you must be the leader of the party to reject a duel>"
					}
				}
			}
			/*
				COMBAT COMMANDS
				1. ATTACK
				2. DEFEND
				3. CAST SPELLS
			*/
			else if((msg_parts[0] == jrpg_commands['combat_attack'])&&(msg_parts.length == 2)){
				//if user belongs to a party
				var p = check_party(author);
				if(p == false){
					return "<you are not in a battle>"
				}else{
					//check if party is in battle
					if(p.in_combat == true){
						//look for battle
						var this_battle = undefined;
						//test to see if battle type exists
						try {
							this_battle = battles[p.battle_type]
						} catch (err) {
							console.log(err)
						};
						//then we test to see if we can find the battle
						if(this_battle != undefined){
							this_battle = this_battle[p.battle_name]
							if(this_battle != undefined){
								//execute attack logic
								var mention = msg_parts[1];
								var target_id = target_user_id(mention);
								var target_type = null;
								//check if target_name is in duel_participants
								if(mention in this_battle.participants){
									//set id
									target_id = this_battle.participants[mention].id;
									target_type = this_battle.participants[mention].type
								};
								//create a list of combatants
								var combatants = [];
								if(p.battle_type == "encounter_battles"){
									combatants = mob_parties[this_battle.MOB_PARTY].members.concat(parties[this_battle.PLAYER_PARTY].members);
								}else if(p.battle_type == "duels"){
									combatants = parties[this_battle.TEAM_1].members.concat(parties[this_battle.TEAM_2].members);
								};
								//check if it is currently this users turn
								if(this_battle.turn_order.length > 0){
									if(this_battle.turn_order[0].id == author){
										//if the target is in the list of targets
										for(var i = 0; i < combatants.length; i++){
											if(combatants[i].id == target_id){
												//execute attack
												if(target_type == 'player'){
													var basic_attack = skills_list.basic_attack;
													var this_attack = use_skill(users[author].jrpg_data.character, users[target_id].jrpg_data.character, basic_attack, users);
													//remove user from list of turn order
													remove_from_array(this_battle.turn_order, this_battle.turn_order[0]);
													//msg to server
													return this_attack
												}else if(target_type == 'mob'){
													var basic_attack = skills_list.basic_attack;
													var this_attack = use_skill(users[author].jrpg_data.character, active_mobs[target_id], basic_attack, users);
													//remove user from list of turn order
													remove_from_array(this_battle.turn_order, this_battle.turn_order[0]);
													//msg to server
													return this_attack
												}else{
													console.log("Error target_type : "+target_type+" does not exist")
												}
											}
										}
										//not in list of combatants
										return "<that target is not in the current battle>"
									}else{
										return "<it is not your turn yet>"
									}
								}
							}
						};
					}else{
						return "<your party is not currently in a battle>"
					}
					return "<your party is not currently in a battle>"
				}
			}
			else if((msg_parts[0] == jrpg_commands['combat_defend'])&&(msg_parts.length >= 2)){
			//if user belongs to a party
				var p = check_party(author);
				if(p == false){
					return "<you are not in a battle>"
				}else{
					//check if party is in battle
					if(p.in_combat == true){
						//look for battle
						var this_battle = undefined;
						//test to see if battle type exists
						try {
							this_battle = battles[p.battle_type]
						} catch (err) {
							console.log(err)
						};
						//then we test to see if we can find the battle
						if(this_battle != undefined){
							this_battle = this_battle[p.battle_name]
							if(this_battle != undefined){
								//defend logic
								var logic = msg_parts[1];
								if(logic == "self"){
									//check if it is currently this users turn
									if(this_battle.turn_order.length > 0){
										if(this_battle.turn_order[0].id == author){
											//defend self
											var guard = skills_list.guard;
											var guard_self = use_skill(users[author].jrpg_data.character, users[author].jrpg_data.character, guard, users);
											//remove user from list of turn order
											remove_from_array(this_battle.turn_order, this_battle.turn_order[0]);
											//msg to server
											return guard_self
										}else{
											return "<it is not your turn yet>"
										}
									}
								}
							}
						};
					}else{
						return "<your party is not currently in a battle>"
					}
					return "<your party is not currently in a battle>"
				}
			}
			else if((msg_parts[0] == jrpg_commands['combat_skill'])&&(msg_parts.length == 3)){
				//if user belongs to a party
				var p = check_party(author);
				if(p == false){
					return "<you are not in a battle>"
				}else{
					//check if party is in battle
					if(p.in_combat == true){
						//look for battle
						var this_battle = undefined;
						//test to see if battle type exists
						try {
							this_battle = battles[p.battle_type]
						} catch (err) {
							console.log(err)
						};
						//then we test to see if we can find the battle
						if(this_battle != undefined){
							this_battle = this_battle[p.battle_name]
							if(this_battle != undefined){
								//execute spell logic
								var skill_name = msg_parts[1];
								var mention = msg_parts[2];
								var target_id = target_user_id(mention);
								var target_type = null;
								//check if target_name is in duel_participants
								if(mention in this_battle.participants){
									//set id
									target_id = this_battle.participants[mention].id;
									target_type = this_battle.participants[mention].type
								};
								//create a list of combatants
								var combatants = [];
								if(p.battle_type == "encounter_battles"){
									combatants = mob_parties[this_battle.MOB_PARTY].members.concat(parties[this_battle.PLAYER_PARTY].members);
								}else if(p.battle_type == "duels"){
									combatants = parties[this_battle.TEAM_1].members.concat(parties[this_battle.TEAM_2].members);
								};
								//check if it is currently this users turn
								if(this_battle.turn_order.length > 0){
									if(this_battle.turn_order[0].id == author){
										//if the target is in the list of targets
										for(var i = 0; i < combatants.length; i++){
											if(combatants[i].id == target_id){
												//execute spell
												var this_skill = skills_list[skill_name];
												if(this_skill != undefined){
													//check if user has the skill
													if(skill_name in users[author].jrpg_data.character.learned_skills){
														//check if skill is a passive
														if(this_skill.type == "PASSIVE"){
															return "<you cannot cast a passive skill>"
														}
														//cast skill
														if(target_type == 'player'){
															var this_attack = use_skill(users[author].jrpg_data.character, users[target_id].jrpg_data.character, this_skill, users);
															//move turn
															remove_from_array(this_battle.turn_order, this_battle.turn_order[0]);
															//msg to server
															return this_attack
														}else if(target_type == 'mob'){
															var this_attack = use_skill(users[author].jrpg_data.character, active_mobs[target_id], this_skill, users);
															//move turn
															remove_from_array(this_battle.turn_order, this_battle.turn_order[0]);
															//msg to server
															return this_attack
														}
													}else{
														return "<you do not know that skill>"
													}
												}else{
													return "<that skill does not exist>"
												}
											}
										}
										//not in list of combatants
										return "<that target is not in the current battle>"
									}else{
										return "<it is not your turn yet>"
									}
								}
							}
						};
					}else{
						return "<your party is not currently in a battle>"
					}
					return "<your party is not currently in a battle>"
				}
			}
			/*
				Inventory commands
				1. CHECK
				2. INSPECT ITEMS
				3. EQUIP
				4. UNEQUIP
			*/
			//check inventory of others
			else if((msg_parts[0] == jrpg_commands['check_inventory'])&&(msg_parts.length >= 3)){
				//target
				var inventory_c = msg_parts[1];
				var target_id = target_user_id(inventory_c);
				//check if target has a character
				if(target in users){
					if(users[target].jrpg_data.character != null){
						var page = msg_parts[2];
						//display inventory
						var inventory_display = formatt_inventory(users[target], page);
						return inventory_display
					}else{
						return "<that user does not have a character>"
					}
				}
				else if(users[author].jrpg_data.character != null){
					/*
						inspect and list
					*/
					//display self inventory
					if(inventory_c == jrpg_commands['inventory_list']){
						var page = msg_parts[2];
						//display inventory
						var inventory_display = formatt_inventory(users[author], page);
						return inventory_display
					}
					//inspect item in self inventory
					else if(inventory_c == jrpg_commands['inventory_inspect']){
						var item_id = msg_parts[2];
						//check if user has the item
						if(item_id in users[author].jrpg_data.inventory){
							//give item description
							description = fomatt_item_stats(users[author].jrpg_data.inventory[item_id]);
							if(description != null){
								return description
							}else{
								return "<something went wrong>"
							}
						}else{
							return "<you do not own that item>"
						}
					}
					/*
						equip and unequip
					*/
					else if(inventory_c == jrpg_commands['equip_item'] && msg_parts.length == 4){
						//check if user is in combat
						var p = check_party(author);
						//doesn't matter if user is in a party or not
						if(p != false){
							if(p.in_combat == true){
								return "<you are in a battle>"
							}
						};
						//equip item other wise
						var item_id = msg_parts[2];
						var equip_slot = msg_parts[3];
						//check if user has item
						if(item_id in users[author].jrpg_data.inventory){
							//equip item
							var item = users[author].jrpg_data.inventory[item_id];
							var equip_message = equipItem(users, author, item, equip_slot);
							return equip_message
						}else{
							return "<you do not own that item>"
						}
					}
					else if(inventory_c == jrpg_commands['unequip_item'] && msg_parts.length == 4){
						
					}
				}
			}
			/*
				TOWN COMMANDS
				1. Traders
					a.Check Traders
					b.Buy from Traders
					c.Sell to Traders
			*/
			else if((msg_parts[0] == jrpg_commands['trader'])&&(msg_parts.length >= 2)){
				/*
					commands:
					1. buy
					2. sell
					3. list
					4.inspect
				*/
				//check if user has a character
				if(users[author].jrpg_data.character != null){
					//check if user is in a city
				    var l = check_location(users[author], "TRADER");
					if(l != null){
						if(l[0] in towns_list){
							//check if user is in combat
							var p = check_party(author);
							//doesn't matter if user is in a party or not
							if(p != false){
								if(p.in_combat == true){
									return "<you are in a battle>"
								}
							};
							//we must check if a trader exists
							if(l[1] != undefined){
								//now we can check what command the user wanted
								var trader_c = msg_parts[1];
								if(trader_c == jrpg_commands['trader_list']){
									//list stock of the trader
									var page = msg_parts[2];
									var display_shop = formatt_shop(towns_list[l[0]], towns_list[l[0]][l[1]], page, "TRADER");
									return display_shop
								}
								else if(trader_c == jrpg_commands['trader_inspect']){
									//id of item
									var id = msg_parts[2];
									var description = null;
									//check if item is in stock
									if(id in towns_list[l[0]][l[1]].stock){
										description = fomatt_item_stats(towns_list[l[0]][l[1]].stock[id]);
										if(description != null){
											return description
										}else{
											return "<something went wrong>"
										}
									}else{
										return "<this item does not exist>"
									}
								}
								else if(trader_c == jrpg_commands['trader_buy']){
									//id
									var purchase_id = msg_parts[2];
									//check if the item exists
									if(purchase_id in towns_list[l[0]][l[1]].stock){
										//buy item
										var purchase = buy_item(users, author, l, purchase_id, "Tokens")
										if(purchase != null){
											return purchase
										}else{
											return "<something went wrong>"
										}
									}else{
										return "<this item does not exist>"
									}
								}
								else if(trader_c == jrpg_commands['trader_sell']){
									//sell item
									var sell_id = msg_parts[2];
									//check if user has the item
									if(sell_id in users[author].jrpg_data.inventory){
										//sell item
										var sell = sell_item(users, author, sell_id, l)
										if(sell != null){
											return sell
										}else{
											return "<something went wrong>"
										}
									}else{
										return "<you do not own that item>"
									}
								}
							}else{
								return "<this city does not have a trader>"
							}
						}else{
							return "<you are not in a city>"
						}
					}else{
						return "<you are not in a city>"
					}
				}else{
					return "<you need to create a character first>"
				}
			}
			/*
				INFO COMMANDS
				1. Skill Info
			*/
			else if((msg_parts[0] == jrpg_commands['skill_info'])&&(msg_parts.length >= 2)){
				//if user has a character
				if(users[author].jrpg_data.character != null){
					var skill_name = msg_parts[1]
					//if skill exists
					if(skill_name in skills_list){
						//show skill
						var info = formatt_skill_info(skill_name);
						if(info != null){
							return info
						}else{
							return "<something went wrong>"
						}
					}else{
						return "<that skill does not exist>"
					}
				}else{
					return "<you need to create a character first>"
				}
			}
			/*
				WORLD COMMANDS
				1. current location
				2. travel to
			*/
			else if((msg_parts[0] == jrpg_commands['current_location'])&&(msg_parts.length >= 2)){
				//find target id
				var target_id = target_user_id(msg_parts[1]);
				//if target exists
				if(users[target_id] != undefined){
					//if the target has a player
					if(users[target_id].jrpg_data.character != null){
						//determine the location of the player
						var position = [users[target_id].jrpg_data.user_position.x, users[target_id].jrpg_data.user_position.y]
						var current_location = determine_location(position);
						//create a location message
						var info = formatt_zone_info(current_location)
						if(info != null){
							return info
						}else{
							return "<something went wrong>"
						}
					}else{
						return "<that user does not have a character created>"
					}
				}else{
					return "<that user does not have a character created>"
				}
			}
			else if((msg_parts[0] == jrpg_commands['travel'])&&(msg_parts.length >= 2)){
				//check if the player is in a party
				p = check_party(author);
				if(p != false){
					//check if the sender is a party leader
					if(author == p.party_leader.id){
						//check if party is not in combat
						if(p.in_combat == false){
							//check if travel request has coordinates
							if(msg_parts.length >= 3){
								//check if coordinates are numbers
								var x = parseInt(msg_parts[1]) , y = parseInt(msg_parts[2])
								if(Number.isInteger(x) && Number.isInteger(y)){
									//input travel request
									var move_info = move_party(p, users, [x,y]);
									if(move_info != null){
										return move_info
									}else{
										return "<something went wrong>"
									}
								}else{
									return "<incorrect coordinates provided>"
								}
							}else{
								return "<incorrect number of arguements>"
							}
						}else{
							return "<you are in a battle>"
						}
					}else{
						return "<you are not the leader of the party>"
					}
				}else{
					return "<you do not belong to a party>"
				}
			}
		};
		//if everything fails
		return "NILL"
	}
};
