/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ABI BOT JRPG MODULE VERSION 0.1 RUNS OFF OF DISCORDIE BOT, SCRIPT WRITTEN BY ERIC//////////////////////////////////////
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

const Canvas = require('canvas');



/*
	SECTION HEADERS
	1. Required
	2. Commands
	3. GENERAL_FUNCTIONS
	4. JRPG_SPECIFIC_FUNCTIONS
	5. JRPG_SETTINGS
	6. DISCORD_VARIABLES
	7. JRPG_CHARACTER
	8. ITEMS
	9. PARTY
	10. MOBS
	11. BATTLE_PROGRESSION
	12. STATUS_EFFECTS
	13. DAMAGE_CALC
	14. HIT_HANDLE
	15. INVENTORY
	16. TOWNS
	17. FORMATT_INFO
	18. TARGETING
	19. WORLD_MAP
	20. UI
	F. MODULE
*/



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Commands///////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const jrpg_commands = {
	//basic character commands
	create_character : "create_character",
	check_stats : "check_stats",
	check_skills : "skills",
	//fast character commands
	quick_status : "status",
	//inventory commands
	check_inventory : "inventory",
	/*
		check_inventory.inspect.id
		check_inventory.list.page
		check_inventory.user.page#
	*/
	inventory_inspect : "inspect",
	inventory_list : "list",
	inventory_user : "user",
	equip_item : "equip",
	unequip_item : "unequip",
	use_item : "use",
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
	combat_attack : "attack",
	combat_defend : "defend",
	combat_skill : "cast",
	//town commands
	//trader
	trader : "trader",
	/*
		trader.inspect.id
		trader.buy.id
		trader.sell.id
		trader.list.page#
	*/
	trader_inspect : "inspect",
	trader_buy : "buy",
	trader_sell : "sell",
	trader_list : "list",
	//apothecary
	apothecary : "apothecary",
	/*
		apothecary.list.page#
		apothecary.buy.item.quanity
	*/
	apothecary_list : "list",
	apothecary_buy : "buy",
	//world commands
	current_location : "location",
	travel : "travel",
	//ui commands
	battle_ui : "!ui",
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//GENERAL_FUNCTIONS//////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function load_JSON(callback, file_path) {
	file_system.readFile(file_path, 'utf8', function readFileCallback(err, json_data){
		if (err){
			console.log(err);
		} else {
			console.log("file loaded : ("+file_path+")");
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


//copy returns references
function copyArray(array){
	var copied_array = [];
	for(var i = 0; i < array.length; i++){
		copied_array[i] = array[i];
	}
	return copied_array
};



//inverts a dicts keys and values
const reverseMap = o => Object.keys(o).reduce((pre,key) =>
	Object.assign(pre,{[o[key]]:key}),{})
	
	

//find child - finds the nested object inside the object given a name 1st occurence
function findChild(child, object){
	var find = null
	if(object instanceof Array){
		for(var i=0; i < object.length; i++){
			find = findChild(child, object[i]);
			if(find != null){
				break
			}
		}
	}
	else{
		for(var key in object){
			if(key == child){
				return object[key]
			};
			if(object[key] instanceof Object || object[key] instanceof Array){
				find = findChild(child, object[key]);
				if(find != null){
					break
				}
			}
		}
	}
	return find
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//JRPG_SPECIFIC_FUNCTIONS////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//find if the user id is in players or mobs and return the character
function findChrById(users, id){
	if(id in users){
		return users[id].jrpg_data.character;
	}else if(id in active_mobs){
		return active_mobs[id];
	};
	return null
};



//find battle from id
function findBattleById(id){
	var p = check_party(id);
	if(p != false){
		if(p.in_combat == true){
			var this_battle = undefined;
			try {
				this_battle = battles[p.battle_type]
			} catch (err){
				console.log(err)
			};
			if(this_battle!=undefined){
				this_battle = this_battle[p.battle_name]
				if(this_battle != undefined){
					return this_battle
				}
			}
		}
	}
	return null
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//JRPG_SETTINGS//////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//refresh time of town stores
const store_restock_time = 3600000;
const store_refresh_time = 3600000*6;



//parties
var parties = {};
var mob_parties = {};


//mob objects
var active_mobs = {};


//active ui object
class active_ui_object {
	constructor(id, owner, type){
		//identifiers
		this.ui_id = id;
		this.ui_owner = owner;
		this.channel = null;
		this.message = null;
		this.is_linked = false;
		//type
		this.ui_type = type;
		//ui_vars
		this.ui_page = 0;
		this.ui_sub_page = 0;
		this.ui_options = {};
	}
};



//const ui settings
const ui_settings = {
	resPerPage : 5,
	t_key : 'targets',
	s_key : 'skills',
	s_skill : 'selected_skill',
};


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
		this.participant_variables = {};
		
		//duel request accepted
		this.duel_accepted = false;
	}
};



//combat encounter object
class combat_encounter {
	constructor(player_team, mob_team){
		//parties involved in duel
		this.TEAM_1 = player_team;
		this.TEAM_2 = mob_team;
		
		//encounter name
		this.combat_encounter_name = player_team+"/"+mob_team;
		
		//encounter variables
		this.combat_encounter_started = false;
		this.turn = 0;
		this.turn_order = [],
		this.last_order = null;
		this.participants = {};
		this.participant_variables = {};
	}
};



//participant variable object
class participant_variables_obj {
	constructor(target_name, id, type){
		this.target_name = target_name;
		this.id = id;
		this.type = type;
		this.ac = 0;
		this.threat = 0;
	}
};



//passive_tag
class passive_tag {
	constructor(skill, duration, source){
		this.skill = skill;
		this.source = source;
		this.duration = duration;
		this.ac = 0;
	}
};



//debuff tag
class debuff_tag {
	constructor(name, effect_name, potency_type, potency, effect, power, duration, source){
		this.debuff = {
			name : name,
			effect_name : effect_name,
			potency_type : potency_type,
			potency : potency,
			effect : effect,
			power : power
		};
		this.source = source;
		this.duration = duration;
		this.ac = 0;
	}
};



//character object
class character {
	constructor(id, name, job, xp){
		
		this.id = id;
		
		this.primary_stats = {
			name : name,
			level : 1,
			xp : xp,
			//jobs are from jobs.json
			job : job,
			hp : 0,
			mp : 0,
			ac : 0,
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
			base_ac : 0,
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
		
		this.base_stats = {
			combat_stats : Object.assign({},this.combat_stats),
			elemental_resistances : Object.assign({},this.elemental_resistances),
			status_resistances : Object.assign({},this.status_resistances),
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
	constructor(id, mob_obj, tier){
		
		this.id = id;
		
		this.primary_stats = {
			name : mob_obj.name,
			tier : 1,
			hp : mob_obj.combat_stats.max_hp,
			mp : mob_obj.combat_stats.max_mp,
			ac : mob_obj.combat_stats.base_ac,
		};
		
		this.tags = Object.assign({},mob_obj.tags),
		
		this.mob_settings = Object.assign({},mob_obj.mob_settings),
		
		this.passive_tags = {
			
		};
		
		this.combat_stats = Object.assign({},mob_obj.combat_stats);
		
		this.elemental_resistances = Object.assign({},mob_obj.elemental_resistances);
		
		this.status_resistances = Object.assign({},mob_obj.status_resistances);
		
		//base stats restore the mobs stats at the start of each round before status hit, special to mobs since they don't scale off attributes.
		this.base_stats = {
			combat_stats : Object.assign({},mob_obj.combat_stats),
			elemental_resistances : Object.assign({},mob_obj.elemental_resistances),
			status_resistances : Object.assign({},mob_obj.status_resistances),
		};
		
		this.learned_skills = Object.assign({},mob_obj.learned_skills);
		
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
		this.tier = 0;
		this.class_lock = null;
		this.weapon_type = null;
		this.wield_type = null;
		this.id = null;
		//secondary elements
		this.ac = 0;
		this.stats = {};
		this.attributes = {};
		//tetiary elements
		this.elemental = null;
		this.elemental_values = {};
		this.status_values = {};
		//quaternary
		this.spell_enable = {};
		//misc
		this.rank = 0;
		this.worth = 0;
	}
};



//item object, potions, materials, use items etc.
class item {
	constructor(object){
		this.name = null;
		this.id = null;
		this.type = object.type;
		this.use_type = object.use_type;
	}
};


class consumable extends item {
	constructor(object){
		//clone object
		var item_clone = Object.assign({}, object);
		//return name, id, type, and use type
		super(item_clone);
		//consumable stats
		this.quality = 0;
		//effect stats
		this.effect = item_clone.effect;
		this.effect_settings = Object.assign({}, item_clone.effect_settings);
		//misc
		this.worth = 0;
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



//stock_equipment
var stock_equipment = load_JSON(function(data){
	stock_equipment = data
	},
	'./bot_modules/jrpg_data/equipment.json'
);



//equipment_generation
var equipment_generation_settings = load_JSON(function(data){
	equipment_generation_settings = data
	},
	'./bot_modules/jrpg_data/equipment_generation.json'
);



//stock items
var stock_items = load_JSON(function(data){
	stock_items = data
	},
	'./bot_modules/jrpg_data/items.json'
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



//enemy ai
var mob_combat_ai = load_JSON(function(data){
	mob_combat_ai = data
	},
	'./bot_modules/jrpg_data/mob_ai.json'
);



//enemy sets
var mob_sets = load_JSON(function(data){
	mob_sets = data
	},
	'./bot_modules/jrpg_data/mob_sets.json'
);



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//DISCORD_VARIABLES//////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//emoticon icons for discord reactions
const emoticon_list = {
	'0' : '0️⃣',
	'1' : '1️⃣',
	'2' : '2️⃣',
	'3' : '3️⃣',
	'4' : '4️⃣',
	'5' : '5️⃣',
	'6' : '6️⃣',
	'7' : '7️⃣',
	'8' : '8️⃣',
	'9' : '9️⃣'
};

const t_emoticon_list = reverseMap(emoticon_list);



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//JRPG_CHARACTER/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



function update_stats(chr, restore_character){
	//makes sure it is a character object
	if(chr["primary_stats"] != undefined){
		/*STEPS
		1.UPDATE LEVEL
		2.UDPATE ATTRIBUTES
		3.UPDATE STATS
		*/
		
		//Linear Leveling
		var xp_needed = 100;
		chr.primary_stats.level = (1 + Math.floor(chr.primary_stats.xp/xp_needed));
		
		//Base Action Cost
		chr.combat_stats.base_ac = jobs[chr.primary_stats['job']]['base_ac'];
		chr.primary_stats.ac = chr.combat_stats.base_ac;
		
		//Linear Attributes
		chr_attributes = chr.attributes;
		base_attributes = jobs[chr.primary_stats['job']]['base_stats'];
		attribute_scaling = jobs[chr.primary_stats['job']]['stat_scaling'];
		
		for(var key in chr_attributes){
			chr.attributes[key] = (base_attributes[key] + (chr.primary_stats.level-1)*attribute_scaling[key]);
		};
		
		//update character attributes from items
		for(var key in chr.equipment){
			if(chr.equipment[key] != null){
				var item = chr.equipment[key];
				for(var akey in item.attributes){
					chr.attributes[akey] += item.attributes[akey];
				}
			}
		};
		//Set Stats NOTE: FIND A BETTER WAY TO DO THIS
		for(var key in chr.combat_stats){
			if(key == "max_hp"){
				chr.combat_stats[key] = Math.floor(chr.attributes['stamina']*10 + chr.attributes['wisdom']*5)
			}else if(key == "max_mp"){
				chr.combat_stats[key] = Math.floor(chr.attributes['intelligence']*3 + chr.attributes['wisdom']*3)
			}else if(key == "attack_power"){
				chr.combat_stats[key] = Math.floor(chr.attributes['strength']*2.5 + chr.attributes['stamina']*1.5 + chr.attributes['dexterity']*0.25)
			}else if(key == "magic_power"){
				chr.combat_stats[key] = Math.floor(chr.attributes['intelligence']*2.5 + chr.attributes['wisdom']*1.5 + chr.attributes['dexterity']*0.25)
			}else if(key == "defence"){
				chr.combat_stats[key] = Math.floor(chr.attributes['stamina']*2 + chr.attributes['wisdom']*1)
			}else if(key == "faith"){
				chr.combat_stats[key] = Math.floor(chr.attributes['wisdom']*2 + chr.attributes['stamina']*1)
			}else if(key == "critical"){
				chr.combat_stats[key] = Math.floor(chr.attributes['luck']*0.8 + chr.attributes['dexterity']*0.8 + chr.attributes['strength']*0.2 + chr.attributes['intelligence']*0.2)
			}else if(key == "critical_damage"){
				chr.combat_stats[key] = Math.floor(chr.attributes['strength']*1.3 + chr.attributes['intelligence']*1.3 + chr.attributes['dexterity']*0.65 + chr.attributes['luck']*0.65)
			}else if(key == "evasion"){
				chr.combat_stats[key] = Math.floor(chr.attributes['luck']*0.75 + chr.attributes['dexterity']*0.75 + chr.attributes['strength']*0.1 + chr.attributes['intelligence']*0.1)
			}else if(key == "hit"){
				chr.combat_stats[key] = Math.floor(chr.attributes['dexterity']*1.25 + chr.attributes['strength']*0.1 + chr.attributes['intelligence']*0.1)
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
		for(var key in class_skills){
			//unlocked skills only
			if(class_skills[key] <= chr.primary_stats.level){
				chr.learned_skills[key] = class_skills[key]
			}
		};
			
		//reset passive tags if restoring character
		if(restore_character){
			chr.passive_tags = {}
		}
		
		//reset all elemental and status resistances
		for(var key in chr.elemental_resistances){
			chr.elemental_resistances[key] = 0;
		};
		for(var key in chr.status_resistances){
			chr.status_resistances[key] = 0;
		};
		
		//update character stats from items
		for(var key in chr.equipment){
			if(chr.equipment[key] != null){
				var item = chr.equipment[key];
				//action cost
				chr.primary_stats.ac += item.ac;
				//get stats and stuff from item and send to character
				for(var key in item.stats){
					chr.combat_stats[key] += item.stats[key];
				};
				for(var key in item.elemental_values){
					chr.elemental_resistances[key] += item.elemental_values[key];
				};
				for(var key in item.status_values){
					chr.status_resistances[key] += item.status_values[key];
				};
				for(var key in item.spell_enable){
					chr.learned_skills[key] = item.spell_enable[key];
				};
			}
		};
		
		//reset all stats, elemental and status resistances
		chr.base_stats.combat_stats = Object.assign({},chr.combat_stats);
		chr.base_stats.elemental_resistances = Object.assign({},chr.elemental_resistances);	
		chr.base_stats.status_resistances =Object.assign({},chr.status_resistances);
		
		//update passive skills list after skills have been added form equipment
		for(var key in chr.learned_skills){
			//find the skill and check if it is a passive
			if(skills_list[key] != undefined){
				//this skill
				var this_skill = skills_list[key];
				//check passive
				if(this_skill.type == "PASSIVE"){
					//create new passive tag
					var copy_skill = Object.assign({}, this_skill);
					var passive = new passive_tag(copy_skill, 2, chr.id);
					chr.passive_tags[key] = passive;
				}
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
	
	"HP {HEALTH POINTS} : ["+chr.primary_stats.hp+"/"+chr.combat_stats.max_hp+"]..."+((chr.primary_stats.hp/chr.combat_stats.max_hp)*100).toFixed(2)+"%"+"\n"+
	"MP {MANA POINTS}   : ["+chr.primary_stats.mp+"/"+chr.combat_stats.max_mp+"]..."+((chr.primary_stats.mp/chr.combat_stats.max_mp)*100).toFixed(2)+"%"+"\n"+
	"AC {ACTION COST}   : ["+chr.primary_stats.ac+"]\n\n"+

	//attributes
	"-----[ATTRIBUTES]----------------\n"
	for(var key in chr.attributes){
		fText = fText+ 
		key+" : "+chr.attributes[key]+"\n"
	};
	
	//stats
	fText = fText+"\n"+
	"-----[STATS]---------------------\n"
	for(var key in chr.combat_stats){
		fText = fText+ 
		key+" : "+chr.combat_stats[key]+"\n"
	};
	
	//elemental resistances
	fText = fText+"\n"+
	"-----[ELEMENTAL RESISTANCES]-----\n"
	for(var key in chr.elemental_resistances){
		fText = fText+ 
		key+" : "+chr.elemental_resistances[key]+"%\n"
	};
	
	//status resistances
	fText = fText+"\n"+
	"-----[STATUS RESISTANCES]--------\n"
	for(var key in chr.status_resistances){
		fText = fText+ 
		key+" : "+chr.status_resistances[key]+"%\n"
	};
	
	//EQUIPMENT
	fText = fText+"\n"+
	"-----[EQUIPMENT]-----------------\n"
	for(var key in chr.equipment){
		if(chr.equipment[key] != null){
			fText = fText+key+" : "+chr.equipment[key].name+"\n"
		}else{
			fText = fText+key+" : "+chr.equipment[key]+"\n"
		};
	};
	
	//skills effects
	fText = fText+"\n"+
	"-----[SKILLS]--------------------\n"
	for(var key in chr.learned_skills){
		fText = fText+ 
		key+" : "+skills_list[key].effect+"\n"
	};
	
	//status effects
	fText = fText+"\n"+
	"-----[STATUS EFFECTS]------------\n"
	for(var key in chr.passive_tags){
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
		for(var key in chr.passive_tags){
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
//ITEMS///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//generate range
function generate_variation(value, variation){
	var new_value = 0;
	new_value = value*((Math.floor(Math.random()*(variation*2))+(100-variation))/100);
	return Math.round(new_value)
};



//pick a stat
function pick_stat(stat_list, current_stats){
	var return_stat = null;
	//check if there is an availible stat
	var available_stats = stat_list.length;
	for(var i = 0; i < stat_list.length; i++){
		if(stat_list[i] in current_stats){
			available_stats -= 1
		}
	};
	if(available_stats > 0){
		return_stat = pickRandomFromArray(stat_list);
		while(return_stat in current_stats){
			return_stat = pickRandomFromArray(stat_list)
		}
	};
	return return_stat
};



//generate stats
function create_stats(obj){
	/*
		obj : {
			"tier"
			"new_item"
			"stock_item"
			"quality_settings"
			"stat_on_item"
			"stat_weight"
			"stat_count_stock"
			"stock_count_quality"
			"variance"
		}
	*/
	//generate extra stats
	var stat_count = Math.round(obj.quality_settings.counts[obj.stock_count_quality] * obj.stock_item.stat_generation[obj.stat_count_stock]);
			
	for(var i = 0; i < stat_count; i++){
		var stat_chance = Math.floor(Math.random() * 100);
		var all_stats = Object.keys(equipment_generation_settings[obj.stat_weight]);
		//positive stat
		if(stat_chance > 0 && stat_chance <= obj.quality_settings.positive_chance){
			var new_stat = pick_stat(all_stats, obj.new_item[obj.stat_on_item]);
			if(new_stat != null){
				var new_stat_value = Math.round(obj.tier * equipment_generation_settings[obj.stat_weight][new_stat] * obj.quality_settings.modifier);
				if(new_stat_value != 0){
					obj.new_item[obj.stat_on_item][new_stat] = new_stat_value
				}
			}
		}else
			//negative stat
			if(stat_chance > obj.quality_settings.positive_chance && stat_chance <= obj.quality_settings.negative_chance+obj.quality_settings.positive_chance){
			var new_stat = pick_stat(all_stats, obj.new_item[obj.stat_on_item]);
			if(new_stat != null){
				var new_stat_value = -1*Math.round(obj.tier * equipment_generation_settings[obj.stat_weight][new_stat] * obj.quality_settings.modifier);
				if(new_stat_value != 0){
					obj.new_item[obj.stat_on_item][new_stat] = new_stat_value
				}
			}
		}
	}
}



//create item
function create_equipement(item_type, tier, id){
	//this item
	var this_item = null;
	//make sure we have data loaded
	//check if this type of item exists
	if(stock_equipment != undefined && equipment_generation_settings != undefined){
		if(item_type in stock_equipment){

			var stock_item = stock_equipment[item_type];
			var new_item = new equipable(item_type);
			
			//basic stats
			new_item.type = stock_item.type;
			new_item.weapon_type = item_type;
			new_item.wield_type = stock_item.wield_type;
			new_item.class_lock = stock_item.class_lock;
			new_item.tier = tier;
			new_item.id = id;
			new_item.rank = 0;
			
			//determine quality
			var item_quality = null;
			var threshold = 0;
			var generated_quality = Math.floor(Math.random() * 1000);
			for(var i = 0; i < equipment_generation_settings.quality_chances.length; i++){
				//check if generated quality is between two values
				if(generated_quality > threshold && generated_quality <= threshold + equipment_generation_settings.quality_chances[i][1]){
					//this quality
					item_quality = equipment_generation_settings.quality_chances[i][0];
					break
				}else{
					threshold += equipment_generation_settings.quality_chances[i][1]
				}
			};
			//break if item quality is bad
			if(item_quality == null){
				return null
			}
			//generate item
			var iq_stats = equipment_generation_settings.quality[item_quality];
			
			//generate ac value
			new_item.ac = Math.round(stock_item.base_ac*iq_stats.ac_modifier);
			
			//add primary stats
			new_item.stats[stock_item.primary_stat] = Math.round(tier * stock_item.primary_stat_base * iq_stats.modifier);
			
			//generate stats
			create_stats(
				obj = {
					"tier" : tier,
					"new_item" : new_item,
					"stock_item" : stock_item,
					"quality_settings" : iq_stats,
					"stat_on_item" : "stats",
					"stat_weight" : "stat_weights",
					"stat_count_stock" : "stat_count",
					"stock_count_quality" : "stat_count_weight",
				}
			);
			//attributes
			create_stats(
				obj = {
					"tier" : tier,
					"new_item" : new_item,
					"stock_item" : stock_item,
					"quality_settings" : iq_stats,
					"stat_on_item" : "attributes",
					"stat_weight" : "attribute_weights",
					"stat_count_stock" : "attribute_count",
					"stock_count_quality" : "attribute_count_weight",
				}
			);
			//status
			create_stats(
				obj = {
					"tier" : tier,
					"new_item" : new_item,
					"stock_item" : stock_item,
					"quality_settings" : iq_stats,
					"stat_on_item" : "status_values",
					"stat_weight" : "status_weights",
					"stat_count_stock" : "status_count",
					"stock_count_quality" : "status_count_weight",
				}
			);
			//elemental
			create_stats(
				obj = {
					"tier" : tier,
					"new_item" : new_item,
					"stock_item" : stock_item,
					"quality_settings" : iq_stats,
					"stat_on_item" : "elemental_values",
					"stat_weight" : "elemental_weights",
					"stat_count_stock" : "elemental_count",
					"stock_count_quality" : "elemental_count_weight",
				}
			);
			
			//set elemental type
			var possible_elements = []
			for(var key in new_item.elemental_values){
				if(new_item.elemental_values[key] > 0){
					possible_elements.push(key)
				}
			};
			if(possible_elements.length > 0){
				//TEMP
				if(Math.random()*100 > 33){
					new_item.elemental = pickRandomFromArray(possible_elements)
				}
			};
			
			//generate abilities
			var ability_count = Math.floor(iq_stats.counts.ability_count_weight * stock_item.stat_generation.ability_count);
			if(ability_count > 0){
				//gather possible skills
				var possible_abilities = [];
				var guaranteed_abilities = [];
				for(var key in stock_item.abilities.GUARANTEED){
					if(stock_item.abilities.GUARANTEED[key] <= tier){
						guaranteed_abilities.push(key)
					}
				};
				for(var key in stock_item.abilities.ALL){
					if(stock_item.abilities.ALL[key] <= tier){
						possible_abilities.push(key)
					}
				};
				for(var key in new_item.elemental_values){
					if(key in stock_item.abilities){
						for(ability in stock_item.abilities[key]){
							if(stock_item.abilities[key][ability] <= tier){
								possible_abilities.push(ability)
							}
						}
					}
				};
				//generate skills
				for(var i = 0; i < guaranteed_abilities.length; i++){
					if(Object.keys(new_item.spell_enable).length < ability_count){
						var abilities_remaining = guaranteed_abilities.length;
						for(var key in new_item.spell_enable){
							if(key in guaranteed_abilities){
								abilities_remaining -= 1
							}
						};
						var add_ability = pickRandomFromArray(guaranteed_abilities);
						while(add_ability in new_item.spell_enable && abilities_remaining != 0){
							add_ability = pickRandomFromArray(guaranteed_abilities)
						};
						if(abilities_remaining != 0){
							new_item.spell_enable[add_ability] = add_ability
							abilities_remaining -= 1
						}
					}
				};
				for(var i = 0; i < possible_abilities.length; i++){
					if(Object.keys(new_item.spell_enable).length < ability_count){
						var abilities_remaining = possible_abilities.length;
						for(var key in new_item.spell_enable){
							if(key in possible_abilities){
								abilities_remaining -= 1
							}
						};
						var add_ability = pickRandomFromArray(possible_abilities);
						while(add_ability in new_item.spell_enable && abilities_remaining != 0){
							add_ability = pickRandomFromArray(possible_abilities)
						};
						if(abilities_remaining != 0){
							//TEMP
							if(Math.random()*100 < 75){
								new_item.spell_enable[add_ability] = add_ability
								abilities_remaining -= 1
							}
						}
					}
				}
			};
			
			//create name
			var base_names = [];
			for(var key in stock_item.names){
				if(stock_item.names[key] <= tier){
					base_names.push(key)
				}
			}
			var name = pickRandomFromArray(base_names);
			
			//temporarily add a quality prefix FIX THIS
			if(iq_stats.quality_names.length > 0){
				name = pickRandomFromArray(iq_stats.quality_names) + " " + name
			};
			
			new_item.name = name;
			
			//calculate worth
			//TEMP
			var worth = Math.random() * tier * stock_item.primary_stat_base + tier*stock_item.primary_stat_base;
			for(var key in new_item.stats){
				if(new_item.stats[key] > 0){
					worth += stock_item.primary_stat_base/2 * tier * 2
				}else{
					worth -= stock_item.primary_stat_base/2 * tier
				}
			};
			for(var key in new_item.attributes){
				if(new_item.attributes[key] > 0){
					worth += stock_item.primary_stat_base/1 * tier * 2
				}else{
					worth -= stock_item.primary_stat_base/1 * tier
				}
			};
			for(var key in new_item.status_values){
				if(new_item.status_values[key] > 0){
					worth += stock_item.primary_stat_base/2 * tier * 2
				}else{
					worth -= stock_item.primary_stat_base/2 *tier
				}
			};
			for(var key in new_item.abilities){
				if(new_item.abilities[key] > 0){
					worth += stock_item.primary_stat_base/1 * tier * 5
				}else{
					worth -= stock_item.primary_stat_base/1 *tier
				}
			};
			if(worth <= 0){
				worth = 1
			};
			new_item.worth = Math.floor(worth)
			//set item
			this_item = new_item
		}
	};
	return this_item
};



//ITEM CREATION
/*
	1.Potions
*/
function create_item(item_type, item_name, id){
	//item to return
	var this_item = null;
	//check if item type exists
	if(item_type in stock_items){
		//check item itself exists
		if(item_name in stock_items[item_type]){
			//CONSUMABLES
			if(item_type == "consumable"){
				var new_consumable = new consumable(stock_items[item_type][item_name]);
				//set status
				new_consumable.id = id;
				new_consumable.name = String(stock_items[item_type][item_name].name);
				this_item = new_consumable;
			}
		}
	};
	//return object
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



//combat party list
function formatt_compact_party_list(p, users){
	var plist_text = "```css\nPARTY NAME : #"+p.name+"\n\n";
	var this_duel = null;
	try {
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
					plist_text = plist_text+pcharacter.primary_stats.name+" | JOB : "+pcharacter.primary_stats.job+"\n"+
					"HP : ("+pcharacter.primary_stats.hp+"/"+pcharacter.combat_stats.max_hp+") MP : ("+pcharacter.primary_stats.mp+"/"+pcharacter.combat_stats.max_mp+")\n\n"
				}
			}else if(p.in_combat == true && this_duel != null){
				//if the party is in a battle and there are multiple targets with the same names
				//for each key in the duel participants
				for(name in this_duel.participants){
					if(unit_type == 'player'){
						if(this_duel.participants[name].id == p.members[i].id){
							//if id matches replace name with unique_name
							pcharacter = pmember['jrpg_data']['character']
							plist_text = plist_text+name+" | JOB : "+pcharacter.primary_stats.job+"\n"+
							"HP : ("+pcharacter.primary_stats.hp+"/"+pcharacter.combat_stats.max_hp+") MP : ("+pcharacter.primary_stats.mp+"/"+pcharacter.combat_stats.max_mp+")\n\n"
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
		for(var key in parties){
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
		for(var key in mob_parties){
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
	if(mob["primary_stats"] != undefined){

		//reset mob stats, elemental and status resistances
		mob.combat_stats = Object.assign({},mob.base_stats.combat_stats);
		mob.elemental_resistances = Object.assign({},mob.base_stats.elemental_resistances);	
		mob.status_resistances =Object.assign({},mob.base_stats.status_resistances);
		
		//update passive skills list
		for(var key in mob.learned_skills){
			if(skills_list[key] != undefined){
				var this_skill = skills_list[key];
				if(this_skill.type == "PASSIVE"){
					var copy_skill = Object.assign({}, this_skill);
					var passive = new passive_tag(copy_skill, 1, mob.id);
					//passive skills that last for more than 1 turn
					if(copy_skill.secondary_skill_power != null){
						passive = new passive_tag(copy_skill, copy_skill.secondary_skill_power, mob.id);
					};
					mob.passive_tags[key] = passive;
				};
			};
		};
	};
};



//mob ai functions
function do_mob_turn(mob, battle, users){
	var return_text = "";
	/*
		1.check if mob has ai else skip turn
		2.determine if the mob is targeting enemy or ally
		3.execute mob ai for abilties used
		
	*/
	if(mob.mob_settings.hasOwnProperty("mob_combat_ai")){
		var mob_ai = mob_combat_ai[mob.mob_settings.mob_combat_ai];
		/*
		1.ROTATION -> Mob executes a rotation of abilties
		*/
		//ROTATION
		if(mob_ai.type == "ROTATION"){
			var rotation = mob_ai.parameters.rotation;
			//track how many turns the mob has
			mob.mob_settings.turns_taken += 1;
			//determine which stage of the rotation we are at
			var current_action = (mob.mob_settings.turns_taken - Math.floor((mob.mob_settings.turns_taken-1)/rotation.length)*rotation.length)-1;
			//if exists
			if(rotation[current_action] != undefined){
				/*
					CAST SKILL
				*/
				if(rotation[current_action].action == "cast_skill"){
					//determine targets
					var conditions = rotation[current_action].conditions;
					//enemy
					if(conditions.target == "enemy"){
						//DETERMINE TARGETS
						//array of ids
						var targets_ids = [];
						var all_parties = [battle.TEAM_1, battle.TEAM_2];
						for(var i = 0; i < all_parties.length; i++){
							//determine what party it is first
							var t_party = null;
							if(parties[all_parties[i]] == undefined){
								t_party = mob_parties[all_parties[i]];
							}else{
								t_party = parties[all_parties[i]];
							};
							//check the party to see if thing is not a member
							if(t_party != null){
								var add_targets = [];
								for(var p = 0; p < t_party.members.length; p++){
									//add member to target list
									add_targets.push(t_party.members[p].id);
									//if in this party then remove all member from target list
									if(t_party.members[p].id == mob.id){
										add_targets = [];
										break
									}
								};
								//push add_targets to targets
								for(var a = 0; a < add_targets.length; a++){
									//check to see if they are alive you know
									var target_chr = undefined;
									if(add_targets[a] in battle.participant_variables){
										if(battle.participant_variables[add_targets[a]].type == "player"){
											target_chr = users[add_targets[a]].jrpg_data.character;
										}else if(battle.participant_variables[add_targets[a]].type == "mob"){
											target_chr = active_mobs[add_targets[a]];
										};
									};
									if(target_chr != undefined){
										if(target_chr.primary_stats.hp > 0){
											targets_ids.push(add_targets[a]);
										};
									};
								};
							}
						};
						//EXECUTE LOGIC
						if(targets_ids.length > 0){
							//determine skill
							//default is basic attack
							var action_skill = skills_list["basic_attack"];
							if(conditions.ability in skills_list){
								if(mob.primary_stats.mp >= skills_list[conditions.ability].mp_cost){
									action_skill = skills_list[conditions.ability];
								}
							};
							//SORT TARGETS
							var targets = [];
							//sort by threat levels
							for(var i = 0; i < targets_ids.length; i++){
								if(targets_ids[i] in battle.participant_variables){
									//add one member to start
									if(targets.length == 0){
										targets.push(battle.participant_variables[targets_ids[i]]);
									};
									//sort
									for(var a = 0; a < targets.length; a++){
										if(battle.participant_variables[targets_ids[i]].threat >= targets[a].threat && i != 0){
											targets.splice(a,0,battle.participant_variables[targets_ids[i]]);
											break
										}else if(battle.participant_variables[targets_ids[i]].threat < targets[a].threat && i != 0){
											targets.splice(a+1,0,battle.participant_variables[targets_ids[i]]);
											break
										}
									}
								}
							};				
							//EXECUTE LOGIC
							if(conditions.target_condition == "highest_threat"){	
								//sort all targets at the same threat level into an array
								var highest_threats = [targets[0]];
								for(var i = 1; i < targets.length; i++){
									if(targets[i].threat == highest_threats[0].threat){
										highest_threats.push(targets[i])
									}
								};
								//pick target
								var final_target = pickRandomFromArray(highest_threats);
								//find the target
								var target_chr = undefined;
								if(final_target.type == "player"){
									target_chr = users[final_target.id].jrpg_data.character;
								}else if(final_target.type == "mob"){
									target_chr = active_mobs[final_target.id];
								};
								//cast skill
								if(target_chr != undefined){
									return_text += use_skill(mob, target_chr, action_skill, users);
								};
							}
						};
					}else
						//allies
						if(conditions.target == "ally"){
					}
				}
			}
		};
	};
	
	return return_text
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BATTLE_PROGRESSION/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//function cast all status boosting skills and all debuffing skills
function cast_status(duel, users, user){
	//return text
	var return_text = "";
	//first we need to find the passive skills of the user
	var chr = user;
	//for every passive tag the user has
	if(Object.keys(chr.passive_tags).length > 0){
		for(var k=0; k<Object.keys(chr.passive_tags).length; k++){
			var key = Object.keys(chr.passive_tags)[k];
			//cast status effects
			if(chr.passive_tags[key].hasOwnProperty("skill")){
				return_text += cast_status_skill(chr, chr.passive_tags[key].skill)
			};
			if(chr.passive_tags[key].hasOwnProperty("debuff")){
				return_text += cast_status_debuff(duel, users, chr, chr.passive_tags[key].debuff)
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
		teams.push(battle.TEAM_1);
		teams.push(battle.TEAM_2);
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



//message at the start of each turn
function formatt_turn_message(all_parties, turn, users){
	var message = "```css\n"+
	"➧ {BATTLE STATUS} ["+turn+"]\n```"
	//for each party
	for(var i = 0; i < all_parties.length; i++){
		var this_party = all_parties[i][1];
		//combat party list is compact compared to party list
		message = ""+message+formatt_compact_party_list(this_party, users);
	};
	//cleanup and return
	return message
};



//your turn message and checking status of character
function do_turn(battle, users){
	//determine order
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
					msg += cast_status(battle, users, users[target_id].jrpg_data.character);
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
					msg += cast_status(battle, users, active_mobs[target_id]);
					//check if incapacitated, if id is the same then mob gets a turn
					if(battle.turn_order[0] != undefined){
						//do mob ai stuff
						msg += do_mob_turn(active_mobs[target_id], battle, users);
						//skip turns for now
						remove_from_array(battle.turn_order, battle.turn_order[0]);
					}
				}
				return msg
			}
		}
	}
	return null
};



//determine participants
function determine_participants(participating_parties, users){
	//set parties in combat
	//parties that we will use for determining order
	var registered_parties = [];
	//need to clone participating_parties first
	//short hand function copies x => x
	var all_parties = participating_parties.map((x) => x);
	//map registered parties
	for(var i=0; i < all_parties.length; i++){
		//selected party is party name
		selected_party = all_parties[i];
		//determine party type
		//t_party is the actual party obj
		var t_party = null;
		if(parties[selected_party] == undefined){
			t_party = mob_parties[selected_party];
		}else{
			t_party = parties[selected_party];
		};
		//push party to registered_parties
		registered_parties.push([selected_party, t_party]);
	};
	//set names of all participants
	//gather all members with their parties
	var all_participants = {};
	var participants = {};
	for(var i = 0; i < registered_parties.length; i++){
		var t_party = registered_parties[i][1];
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
	for(var name_type in all_participants){
		for(name in all_participants[name_type]){
			participants[name] = all_participants[name_type][name]
		}
	};

	//return participants
	return [registered_parties, participants]
}



//progress battle
function progress_battle(battle, users){
	//progress all particpants ac by 1 unit, progress battle by 1 turn
	battle.turn += 1;
	//check if particpants is not empty
	if(Object.keys(battle.participants).length > 0){
		for(var key in battle.participants){
			//find participant in participant variables
			if(battle.participants[key].id in battle.participant_variables){
				//progress by one unit
				battle.participant_variables[battle.participants[key].id].ac += 1;
			}
		}
	};
	//gather all participants that do have a turn
	var turn_order = [];
	//check each thing in participants variables against their stats
	for(var key in battle.participant_variables){
		//the current participant we are testing
		t_participant = battle.participant_variables[key];
		var t_chr = null;
		//determine what kind of character it is
		if(t_participant.type == 'player'){
			t_chr = users[t_participant.id].jrpg_data.character;
		}else if(t_participant.type == 'mob'){
			t_chr = active_mobs[t_participant.id];
		};
		//check if can move
		if(t_chr != null && t_chr != undefined){
			//if action cost points is greater than action cost add the user to the list of possible moves
			if(t_participant.ac >= t_chr.primary_stats.ac){
				turn_order.push(t_participant.id);
			}
		}
	};
	//determine who is going next
	if(turn_order.length > 0){
		//pick a random part. from array to move
		var c_participant_id = pickRandomFromArray(turn_order);
		var c_participant = null;
		for(var key in battle.participants){
			if(battle.participants[key].id == c_participant_id){
				c_participant = battle.participants[key]
			}
		};
		//set part. ac to zero
		battle.participant_variables[c_participant.id].ac = 0;
		return c_participant
	}else{
		//fail no one can move yet
		return false
	}
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
		for(var key in all_duels){
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
				//determine participants
				var order = determine_participants([tduel.TEAM_1, tduel.TEAM_2], users);
				//set participants
				tduel.participants = order[1];
				//generate participant variables
				for(var m in tduel.participants){
					tduel.participant_variables[tduel.participants[m].id] = new participant_variables_obj(m, tduel.participants[m].id, tduel.participants[m].type);
				};
				//return a message that the duel has begun
				var turn_msg = "```css\n#DUEL STARTED : {"+tduel.TEAM_1+"} VERSUS {"+tduel.TEAM_2+"}```";
				return turn_msg
			}
			else if((tduel.duel_accepted == true)&&(tduel.duel_started == true)){
				//check if a team has won the duel
				/*
					WIN CONDITIONS MET
				*/
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
				/*
					PROGRESS BATTLE
				*/
				//progress battle
				if(tduel.turn_order.length == 0){
					var p_battle = progress_battle(tduel, users);
					//while no one can move repeat
					while(p_battle == false){
						p_battle = progress_battle(tduel, users);
					};
					//we have a result
					tduel.turn_order = [p_battle];
					tduel.last_order = null;
				};
				//execute turn if possible
				if(tduel.turn >= 1){
					//need parties
					var order = determine_participants([tduel.TEAM_1, tduel.TEAM_2], users);
					//formatt a turn message
					var status_message = formatt_turn_message(order[0], tduel.turn, users);
					//execute the turn
					var new_turn_msg = do_turn(tduel, users);
					if(new_turn_msg != null){
						return status_message+new_turn_msg
					}
				}
			};
		};
	};
	//progress encounter battles
	var all_encounter_battles = battles.encounter_battles;
	if(Object.keys(all_encounter_battles).length > 0){
		for(var key in all_encounter_battles){
			var tencounter = all_encounter_battles[key];
			//First turn of encounter
			if((tencounter.combat_encounter_started == true)&&(tencounter.turn == 0)){
				//update stats off all on first round
				for(var i = 0; i < parties[tencounter.TEAM_1].members.length; i++){
					var this_user = parties[tencounter.TEAM_1].members[i].id;
					update_stats(users[this_user]['jrpg_data']['character'], false);
				};
				for(var i = 0; i < mob_parties[tencounter.TEAM_2].members.length; i++){
					var mob_id = mob_parties[tencounter.TEAM_2].members[i].id;
					update_stats_mob(active_mobs[mob_id], false);
				};
				//start combat
				tencounter.turn += 1;
				//determine turn order
				var order = determine_participants([tencounter.TEAM_1, tencounter.TEAM_2], users);
				//set participants
				tencounter.participants = order[1];
				//generate participant_variables
				for(var m in tencounter.participants){
					tencounter.participant_variables[tencounter.participants[m].id] = new participant_variables_obj(m, tencounter.participants[m].id, tencounter.participants[m].type);
				};
				//return a message that the duel has begun
				var turn_msg = "```css\n#ENCOUNTER BATTLE STARTED : {"+tencounter.TEAM_1+"} VERSUS {"+tencounter.TEAM_2+"}```";
				return turn_msg
			}
			//next turns of duel and win conditions
			else if((tencounter.combat_encounter_started == true)&&(tencounter.turn > 0)){
				//check if there is a winner
				/*
					WIN CONDITIONS MET
				*/
				var check_win = win_condition(users, tencounter, "HP_ZERO");
				if(check_win != null){
					var winning_team = check_win;
					var losing_team = null;
					if(winning_team == tencounter.TEAM_1){
						losing_team = tencounter.TEAM_2
					}else{
						losing_team = tencounter.TEAM_1
					};
					//reset parties
					if(mob_parties[tencounter.TEAM_2] != undefined){
						mob_parties[tencounter.TEAM_2].in_combat = false;
						mob_parties[tencounter.TEAM_2].battle_type = null;
						mob_parties[tencounter.TEAM_2].battle_name = null;
					};
					if(parties[tencounter.TEAM_1] != undefined){
						parties[tencounter.TEAM_1].in_combat = false;
						parties[tencounter.TEAM_1].battle_type = null;
						parties[tencounter.TEAM_1].battle_name = null;
					};
					//since it is a mob battle we need to also delete the mobs
					for(var m = 0; m < mob_parties[tencounter.TEAM_2].members.length; m++){
						delete active_mobs[mob_parties[tencounter.TEAM_2].members[m].id];
					};
					//delete the party
					delete mob_parties[tencounter.TEAM_2];
					//delete battles form battles
					delete battles.encounter_battles[tencounter.combat_encounter_name];
					//end battle and reward players
					return "```css\nThe party ["+winning_team+"] has claimed victory over the party ["+losing_team+"] in their encounter```"
				};
				/*
					PROGRESS BATTLE
				*/
				//progress battle
				if(tencounter.turn_order.length == 0){
					var p_battle = progress_battle(tencounter, users);
					//while no one can move repeat
					while(p_battle == false){
						p_battle = progress_battle(tencounter, users);
					};
					//we have a result
					tencounter.turn_order = [p_battle];
					tencounter.last_order = null;
				};
				//execute turn if possible
				if(tencounter.turn >= 1){
					//formatt a info message for battle
					var order = determine_participants([tencounter.TEAM_1, tencounter.TEAM_2], users);
					var status_message = formatt_turn_message(order[0], tencounter.turn, users);
					//try to execute turn
					var new_turn_msg = do_turn(tencounter, users);
					if(new_turn_msg != null){
						return status_message+new_turn_msg
					}
				}
			};
		}
	};
	return "NILL"
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//STATUS_EFFECTS/////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



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
			RESOURCE PASSIVES
		*/
		
		/*
			MP REFRESH
		*/
		if(this_skill.effect == "MP_REFRESH"){
			//return skill power
			var power = Math.floor(chr.combat_stats.max_mp*(this_skill.skill_power/100));
			if(this_skill.bonus_effects.hasOwnProperty('effect_type')){
				if(this_skill.bonus_effects.effect_type == "FLAT"){
					skill_power = Math.floor(this_skill.skill_power);
				}else if(this_skill.bonus_effects.effect_type == "PERCENT"){
					skill_power = Math.floor(chr.combat_stats.max_mp*(this_skill.skill_power/100));
				};
			};
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
				return_text += "```css\n"+chr.primary_stats.name+" recovered "+power+" MP from ["+this_skill.skill_name+"] MP("+(chr.primary_stats.mp-power)+"/"+chr.combat_stats.max_mp+") ➧ MP("+chr.primary_stats.mp+"/"+chr.combat_stats.max_mp+")\n```";
				}
			}
		}
		/*
			HP REFRESH
		*/
		else if(this_skill.effect == "HP_REFRESH"){
			var power = Math.floor(chr.combat_stats.max_hp*(this_skill.skill_power/100));
			if(this_skill.bonus_effects.hasOwnProperty('effect_type')){
				if(this_skill.bonus_effects.effect_type == "FLAT"){
					skill_power = Math.floor(this_skill.skill_power);
				}else if(this_skill.bonus_effects.effect_type == "PERCENT"){
					skill_power = Math.floor(chr.combat_stats.max_hp*(this_skill.skill_power/100));
				};
			};
			for(var i = 0; i < this_skill.hits; i++){
				if(chr.primary_stats.hp != chr.combat_stats.max_hp){
					if(power + chr.primary_stats.hp > chr.combat_stats.max_hp){
						power = chr.combat_stats.max_hp - chr.primary_stats.hp;
					};
					//recover hp
					chr.primary_stats.hp += power;
					//set return text
					return_text += "```css\n"+chr.primary_stats.name+" recovered "+power+" HP from ["+this_skill.skill_name+"] HP("+(chr.primary_stats.hp-power)+"/"+chr.combat_stats.max_hp+") ➧ HP("+chr.primary_stats.hp+"/"+chr.combat_stats.max_hp+")\n```";
				}
			}
		}
		
		/*
			STAT PASSIVES
		*/
		
		/*
			BOOST
		*/
		else if(this_skill.effect == "BOOST"){
			var skill_power = 0;
			//for each of the target stats
			for(var i = 0; i < this_skill.target_stats.length; i++){
				//if the stat exists
				if(this_skill.target_stats[i] in chr.base_stats.combat_stats){
					//base
					skill_power = Math.floor(this_skill.skill_power)
					//check type
					if(this_skill.bonus_effects.hasOwnProperty('effect_type')){
						if(this_skill.bonus_effects.effect_type == "FLAT"){
							skill_power = Math.floor(this_skill.skill_power)
						}else if(this_skill.bonus_effects.effect_type == "PERCENT"){
							skill_power = Math.floor(chr.base_stats.combat_stats[this_skill.target_stats[i]]*(this_skill.skill_power/100))
						};
					};
				};
				//floor
				//increase stat
				chr.combat_stats[this_skill.target_stats[i]] += skill_power
				//add text
				return_text += "```css\n"+chr.primary_stats.name+" had their ("+this_skill.target_stats[i]+") increased for "+skill_power+" by ["+this_skill.skill_name+"]\n```";
			}
		};
	};
	return return_text
};



//cast debuffs
//percent damage needs a cap
function cast_status_debuff(duel, users, user, debuff){
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
			1.BURN
			2.POISON
			3.PARALYSIS
			4.BLIND
			5.SLEEP
			6.CONFUSION
			7.STUN
		*/
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
			return_text += "```css\n"+chr.primary_stats.name+" was burned for "+burn_power+" by ["+debuff.name+"] HP("+(chr.primary_stats.hp+burn_power)+"/"+chr.combat_stats.max_hp+") ➧ HP("+chr.primary_stats.hp+"/"+chr.combat_stats.max_hp+")\n```";
		}
		/*
			POISON
		*/
		else if(debuff.effect_name == "poison"){
			var poison_power = 0;
			if(debuff.potency_type == "FLAT"){
				var burn_effect = {
					effect : debuff.effect,
					elemental_type : null,
				};
				poison_power = Math.floor(calc_damage(burn_effect, Math.floor(debuff.power), user));
			}else if(debuff.potency_type == "PERCENT"){
				poison_power = chr.combat_stats.max_hp*(debuff.potency/100)
			};
			poison_power = Math.floor(poison_power);
			if(chr.primary_stats.hp-poison_power < 0){
				chr.primary_stats.hp = 0;
			}else{
				chr.primary_stats.hp -= poison_power;
			}
			//set return text
			return_text += "```css\n"+chr.primary_stats.name+" was poisoned for "+poison_power+" by ["+debuff.name+"] HP("+(chr.primary_stats.hp+poison_power)+"/"+chr.combat_stats.max_hp+") ➧ HP("+chr.primary_stats.hp+"/"+chr.combat_stats.max_hp+")\n```";
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
			//currently full paralysis is 1/2 of the potency
			if(debuff.potency_type == "PERCENT"){
				if(Math.floor(Math.random()*100)<(debuff.potency/2)){
					//full paralyze
					if(duel != null){
						if(duel.turn_order[0].id == user.id){
							return_text += "```css\n"+chr.primary_stats.name+" is incapacitated by paralysis and cannot move\n```";
							remove_from_array(duel.turn_order, duel.turn_order[0]);
						}
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
			//hit values can go into the negatives +20 removes 1/4 of the base hit chance
			blind_power = Math.floor(blind_power)+20;
			chr.combat_stats.hit -= blind_power;
			//set return text
			return_text += "```css\n"+chr.primary_stats.name+" had their accuracy lowered for "+blind_power+" by ["+debuff.name+"]\n```";
		}
		/*
			SLEEP
		*/
		else if(debuff.effect_name == "sleep"){
			//sleep is a guaranteed turn skip and is disrupted by taking damage equal to the threshold determined by the skill
			if(duel != null){
				if(duel.turn_order[0].id == user.id){
					//set return text
					return_text += "```css\n"+chr.primary_stats.name+" was incapacitated by ["+debuff.name+"]\n```";
					remove_from_array(duel.turn_order, duel.turn_order[0]);
				}
			}
		}
		/*
			CONFUSION
		*/
		else if(debuff.effect_name == "confusion"){
			//confusion status randomly target someone in combat and cast a random skill
			//confusion text
			return_text += "```css\n"+chr.primary_stats.name+" is confused by ["+debuff.name+"]\n```";
			if(duel != null){
				//execute confusion on turn only
				if(duel.turn_order[0].id == user.id){
					//define targets ids
					target_ids = [];
					var all_parties = [duel.TEAM_1, duel.TEAM_2];
					for(var i=0; i < all_parties.length; i++){
						//find the party
						var t_party = null;
						if(mob_parties[all_parties[i]] != undefined){
							t_party = mob_parties[all_parties[i]]
						}else if(parties[all_parties[i]] != undefined){
							t_party = parties[all_parties[i]]
						};
						//confusion - add all ids including own and allies
						if(t_party != null){
							for(var m=0; m<t_party.members.length; m++){
								var p_id = t_party.members[m].id;
								//check if they are alive and add targets to all target ids
								var target_chr = undefined;
								if(p_id in duel.participant_variables){
									if(duel.participant_variables[p_id].type == "player"){
										target_chr = users[p_id].jrpg_data.character;
									}else if(duel.participant_variables[p_id].type == "mob"){
										target_chr = active_mobs[p_id];
									};
								};
								if(target_chr != undefined){
									if(target_chr.primary_stats.hp > 0){
										target_ids.push(p_id);
									};
								};
							};
						};
					};
					//if there is more than one target id execute confusion
					if(target_ids.length > 0){
						//return a list of all the abilties the user can use
						var a_skills = ["basic_attack"];
						//find which skills are not passives
						for(var key in chr.learned_skills){
							if(key in skills_list){
								if(skills_list[key].type != "PASSIVE"){
									a_skills.push(key);
								};
							};
						};
						//execute a random skill at random target
						var r_id = pickRandomFromArray(target_ids);
						var n_skill = skills_list[pickRandomFromArray(a_skills)];
						if(duel.participant_variables[r_id].type == "player"){
							return_text += use_skill(chr, users[r_id].jrpg_data.character, n_skill, users)
						}else if(duel.participant_variables[r_id].type == "mob"){
							return_text += use_skill(chr, active_mobs[r_id], n_skill, users)
						};
					};
					//skip turn
					remove_from_array(duel.turn_order, duel.turn_order[0]);
				};
			};
		};
		//combat stat down debuffs
		/*
			STAT_DOWN
		*/
		if(debuff.effect_name == "stat_down"){
			var power = 0;
			//find target stat
			if(debuff.effect in chr.base_stats.combat_stats){
				var target_stat = chr.base_stats.combat_stats[debuff.effect];
				if(debuff.potency_type == "FLAT"){
					power = debuff.power;
				}else if(debuff.potency_type == "PERCENT"){
					power = target_stat*(debuff.potency/100)
				};
				//apply stat down
				power = Math.floor(power);
				chr.combat_stats[debuff.effect] -= power;
				//set return text
				return_text += "```css\n"+chr.primary_stats.name+" had their ["+debuff.effect+"] lowered by "+power+" from ["+debuff.name+"] ("+(chr.combat_stats[debuff.effect]+power)+") ➧ ("+chr.combat_stats[debuff.effect]+")\n```";
			}else{
				return_text += "Error! "+debuff.effect+" Please report this bug!";
			};
		};
	};
	return return_text
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//DAMAGE_CALC////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//generate base power
function calc_base_power(user_stats, target_stats, power){
	var total_power = 0;
	for(var i = 0; i < target_stats.length; i++){
		total_power += user_stats[target_stats[i]]*(power/100)
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
	var target_defense_stat = 0;
	if(effect == "PHYSICAL"){
		target_defense_stat = skill_target.defence;
	}else if(effect == "MAGIC"){
		target_defense_stat = skill_target.faith;
	}
	
	var base_damage = total_power;
	var target_defense = base_damage*((100-(Math.pow(150,2)/(target_defense_stat+225)))/100)+target_defense_stat/3;
	//below zero defence
	if(target_defense_stat < 0){
		target_defense = base_damage*-((100-(Math.pow(150,2)/(-target_defense_stat+225)))/100)+target_defense_stat/3
	};
	
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
//HIT_HANDLE/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//single apply status effect
function single_apply_status(skill, user, target, weaken){
	var return_text = "";
	//buff guarnteed to apply onto targets
	for(var key in skill.bonus_effects){
		/*
			BUFF A TARGET
		*/
		if(skill.bonus_effects[key].name == "buff_target"){
			//check if skill exists
			if(skill.bonus_effects[key].skill_name in skills_list){
				//skill exists thus cast and copy to allow editting
				var this_skill = Object.assign({},skills_list[skill.bonus_effects[key].skill_name]);
				//set skill duration
				this_skill.secondary_skill_power = skill.bonus_effects[key].duration;
				//cast
				return_text = apply_passive(this_skill, user, target, weaken)
			}
		}
	};
	return return_text
}



//single_heal_handle
function single_heal_handle(skill, user, target, weaken){
	var user_character = user;
	var target_character = target;
	var target_eva = target.combat_stats.evasion;
	var return_text = "";
	//no miss or fail chance but crit chance
	//calculate heal amount
	var this_heal = Math.floor(calc_heal(skill, user_character, target)*(weaken/100));
	//can't heal dead things
	if(target_character.primary_stats.hp > 0){
		//calculate critical hits
		var user_crit = user.combat_stats.critical;
		var bonus_crit = user_crit-target_eva;
		if(bonus_crit < 0){
			bonus_crit = 0
		};
		//5% base crit
		var crit_chance = 5+bonus_crit;
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
function single_hit_handle(skill, users, user, target, weaken){
	//character stats
	var user_character = user;
	var target_character = target;
	var return_text = "";
	var user_hit = user.combat_stats.hit;
	var target_eva = target.combat_stats.evasion;
	/*
		bonus effects of skills that influence hit chance damage etc.
		first we create a copy of all the c_stats
	*/
	var skill_cstat = Object.assign({}, user.combat_stats);
	//look through all skill bonus effects
	if(skill.bonus_effects != undefined){
		if(Object.keys(skill.bonus_effects).length > 0){
			for(var key in skill.bonus_effects){
				/*
					boost skills
				*/
				if(key == "boost"){
					//find boost target in player combat_stats and temp increase the stat
					if(skill.bonus_effects[key].stat in skill_cstat){
						skill_cstat[skill.bonus_effects[key].stat] += skill.bonus_effects[key].amount;
					}
				}
			}
		}
	};
	//calculate hit or miss
	//hit chance 90% base hit
	var hit_chance = 90+user_hit-target_eva;
	if(Math.floor(Math.random() * 100)<hit_chance){
		//hit
		//calculate attack damage
		var stock_power = calc_base_power(skill_cstat, skill.target_stats, skill.skill_power);
		var this_attack = Math.floor(calc_damage(skill, stock_power, target)*(weaken/100));
		//bonus critical from skill effects
		var bonus_crit = skill_cstat.critical-target_eva;
		if(bonus_crit < 0){
			bonus_crit = 0
		};
		//5% base crit
		var crit_chance = 5+bonus_crit;
		if(Math.floor(Math.random() * 100)<crit_chance){
			//critical strength
			var critical_damage = 125+skill_cstat.critical_damage-target_eva;
				if(critical_damage < 125){
					critical_damage = 125;
			};
			//critical strike
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
		var attack_redirected = false;
		//cast battle passives of the target
		if(Object.keys(target_character.passive_tags).length > 0){
			for(var key in target_character.passive_tags){
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
					/*
						Protection Abilties/Ability Redirection Abilities
						[NEEDS REWORK]-THE SYSTEM IN PLACE IS REALLY JANK
					*/
					else if(passive.effect == "PROTECTED"){
						//check if protected can proc, that is if the one who redirected the attack is not the source of the buff, this stops the buff from bouncing damage back and forth between targets.
						if(target_character.passive_tags[key].source != user_character.id && target_character.passive_tags[key].source != target_character.id){
							//next we need to find the user in the battles
							var new_target = null;
							if(target_character.passive_tags[key].source in users){
								if(users[target_character.passive_tags[key].source].jrpg_data != null){
									new_target = users[target_character.passive_tags[key].source].jrpg_data.character
								}
							}
							else if(target_character.passive_tags[key].source in all_mobs){
								new_target = all_mobs[target_character.passive_tags[key].source]
							};
							//found a new target?
							if(new_target != null){
								//check if new_target is in this battle
								//check if the new_target is not dead
								if(new_target.primary_stats.hp > 0){
									//new text
									return_text = "```css\n{⚔}"+user_character.primary_stats.name+" attacked "+target_character.primary_stats.name+" but {🛡}"+new_target.primary_stats.name+" protected "+target_character.primary_stats.name+"!\n```";
									//hit new target
									var redirect_attack = single_hit_handle(skill, users, user, new_target, weaken);
									return_text += redirect_attack;
									//nullify damage
									attack_redirected = true;
								};
							};
						}
					}
				}
			}
		};
		/*
			Deal with the effects that trigger if the target is hit
		*/
		//only applies to the target that gets hit therefore we check if attack was redirected first
		if(attack_redirected == false){
			if(Object.keys(target_character.passive_tags).length > 0){
				for(var key in target_character.passive_tags){
					//check if it is a debuff
					if(target_character.passive_tags[key].hasOwnProperty("debuff")){
						var c_debuff = target_character.passive_tags[key].debuff;
						/*
							Damage Taken Debuffs
							1.sleep
						*/
						if (c_debuff.effect_name == "sleep"){
							//sleep is removed if damage taken is greater than the debuff's threshold
							var sleep_threshold = 0
							if(c_debuff.potency_type == "PERCENT"){
								sleep_threshold = Math.floor(target_character.combat_stats.max_hp*c_debuff.potency/100)
							}else if(c_debuff.potency_type == "FLAT"){
								sleep_threshold = c_debuff.potency
							};
							//check sleep break
							if(this_attack >= sleep_threshold){
								//break sleep
								return_text += "```css\n"+target_character.primary_stats.name+" is no longer incapacitated by ["+c_debuff.name+"]!\n```";
								//delete tag
								delete target_character.passive_tags[key]
							};
						};
					}
					//check if it is a buff or passive
					else if(target_character.passive_tags[key].hasOwnProperty("skill")){
						var c_skill = target_character.passive_tags[key].skill;
						//check if skill is in skills list
						if(c_skill.skill_name in skills_list){
							c_skill = skills_list[c_skill.skill_name];
							//check is passive
							/*
								Damage Taken Passives
								1.counter
							*/
							if(c_skill.type == "PASSIVE" && c_skill.effect == "COUNTER_ALL"){
								//counter all types of attacks, first check counter chance
								var counter_chance = c_skill.skill_power;
								if(Math.floor(Math.random()*100)<=counter_chance){
									//go through bonus effects of skill
									if(Object.keys(c_skill.bonus_effects).length > 0){
										//trigger number of times the skill has hits
										for(var h=0; h<c_skill.hits; h++){
											/*
												COUNTER EFFECTS
												1.use_skill
											*/
											for(b_effect in c_skill.bonus_effects){
												if(b_effect == "use_skill"){
													//if skill is in skills list
													if(c_skill.bonus_effects[b_effect].skill_name in skills_list){
														var u_skill = skills_list[c_skill.bonus_effects[b_effect].skill_name];
														/*
															Targeting for counter skills
															1.enemy - directly back at the one who attacked first(cannot counter self)
														*/
														if(c_skill.bonus_effects[b_effect].target == "enemy" && target_character.id != user_character.id){
															return_text += "```css\n"+target_character.primary_stats.name+" countered with ["+c_skill.skill_name+"]!\n```";
															return_text += execute_single_cast(target_character, user_character, u_skill, users);
														};
													};
												};
											};
										};
									};
								};
							};
							//next passive
						};
					};
				};
			};
		};
		/*
			bonus effects of skill such as applying debuffs and others etc
		*/
		if(skill.bonus_effects != undefined){
			if(Object.keys(skill.bonus_effects).length > 0){
				for(var key in skill.bonus_effects){
					var Beffect = skill.bonus_effects[key];
					/*
						Targeted status
						status is redirected if attack is redirected
					*/
					if(key == "target_status" && attack_redirected == false){
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
								Beffect.duration,
								user_character.id
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
							return_text += "```css\n"+target_character.primary_stats.name+" was affected by ["+Beffect.name+"]!\n```";
							//cast the status debuff one time
							return_text += cast_status_debuff(null, users, target_character, target_character.passive_tags[Beffect.name].debuff);
						};
					};
				};
			};
		};
		/*
			Damage the target
		*/
		//damage only if target is redirected
		if(attack_redirected == false){
			//calculate final damage
			this_attack -= target_damage_mitigation;
			//damage target
			if(target_character.primary_stats.hp - this_attack < 0){
				target_character.primary_stats.hp = 0;
			}else{
				target_character.primary_stats.hp -= this_attack;
			};
		};
		/*
			Increase threat level
			1.if the attacker is in a battle then increase their threat level for attacking
		*/
		for(type in battles){
			for(var key in battles[type]){
				for(p in battles[type][key].participants){
					if(battles[type][key].participants[p].id == user.id){
						battles[type][key].participant_variables[user.id].threat += Math.ceil(this_attack/100);
					
					}
				}
			}
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
	var passive = new passive_tag(copy_skill, duration, user_character.id);
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
			var attack = single_hit_handle(skill, users, user, target, weak);
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
			for(var key in parties){
				for(var i = 0; i < parties[key].members.length; i++){
					if(users[parties[key].members[i].id].jrpg_data.character == target){
						target_party = parties[key]
					}
				}
			}
			//mob parties
			for(var key in mob_parties){
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
					var target_member = users[target_party.members[m].id].jrpg_data.character;
					var attack = single_hit_handle(skill, users, user, target_member, weak);
					return_text = return_text+attack;
				}else
					//mobs
					if(target_party.members[m].type == 'mob'){
					var target_member = active_mobs[target_party.members[m].id];
					var attack = single_hit_handle(skill, users, user, target_member, weak);
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
		}
		/*
			Single target buff abilties
		*/
		else if(skill.type == "BUFF"){
			var buff = single_apply_status(skill, user, target, weak);
			return_text = return_text+buff;
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
	if(user_character.hasOwnProperty("equipment")){
		if((user_character.equipment.left_hand != null)&&(user_character.equipment.right_hand != null)){
			//if a single handed object in both hands
			if(user_character.equipment.left_hand.wield_type == 'one_hand'&&user_character.equipment.right_hand.wield_type == 'one_hand'){
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
	}else{
		//execute single attack because the user does not have equipment
		return_text = execute_single_cast(user, target, skill, users);
	}
	//if the skill costs ac we need to reduce the player's ac count
	for(type in battles){
		for(var key in battles[type]){
			for(p in battles[type][key].participants){
				if(battles[type][key].participants[p].id == user.id){
					battles[type][key].participant_variables[user.id].ac -= skill.ac_cost;
				}
			}
		}
	};
	//return output
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
				if(item.hasOwnProperty("tier")){
					return_text += "#"+item.id+" : {"+item.tier+"} "+item.name+"\n";
				}else if(item.hasOwnProperty("quality")){
					return_text += "#"+item.id+" : {"+item.quality+"%} "+item.name+"\n";
				}else{
					return_text += "#"+item.id+" : "+item.name+"\n";
				}
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
						//don't remove off hand weapons, but remove them when equippping two handed weapons
						if(users[user].jrpg_data.character.equipment['left_hand'] != null){
							if(users[user].jrpg_data.character.equipment['left_hand'].wield_type != 'offhand' || item_slot == "two_hand"){
								users[user].jrpg_data.character.equipment['left_hand'] = null;
							}
						}
						if(users[user].jrpg_data.character.equipment['right_hand'] != null){
							if(users[user].jrpg_data.character.equipment['right_hand'].wield_type != 'offhand' || item_slot == "two_hand"){
								users[user].jrpg_data.character.equipment['right_hand'] = null;
							}
						}
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
			//offhand items are different from weapon items but are similar as you can equip two without dual wield
			}else if(item_slot == 'offhand'){
				//offhand items go into the same slots as weapons
				if(slot == 'left_hand' || slot == 'right_hand'){
					//if user already has the item equipped unequip it or if there is a two handed weapon
					if(users[user].jrpg_data.character.equipment['left_hand'] != null){
						if(users[user].jrpg_data.character.equipment['left_hand'].id == item.id || users[user].jrpg_data.character.equipment['left_hand'].wield_type == "two_hand"){
							users[user].jrpg_data.character.equipment['left_hand'] = null
						}
					};
					if(users[user].jrpg_data.character.equipment['right_hand'] != null){
						if(users[user].jrpg_data.character.equipment['right_hand'].id == item.id || users[user].jrpg_data.character.equipment['right_hand'].wield_type == "two_hand"){
							users[user].jrpg_data.character.equipment['right_hand'] = null
						}
					};
					//equip item and return text
					users[user].jrpg_data.character.equipment[slot] = item;
					return_text = "```css\n["+users[user].name+"] #Inventory : Equipped item {"+item.name+"} to {"+slot+"}```";
				}else{
					return_text = "```css\n["+users[user].name+"] #Inventory : Item does not belong in that slot```"
				};
			//item equipping for armor pretty straight forwards
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



//use items that can be used, mainly consumable items
function use_items(item, users, user, target){
	var return_text = null;
	//Find the characters
	var user_chr = null;
	var target_chr = null;
	if(user.id in users){
		user_chr = users[user.id].jrpg_data.character;
	}else if(user.id in active_mobs){
		user_chr = active_mobs[user.id];
	};
	if(target.id in users){
		target_chr = users[target.id].jrpg_data.character;
	}else if(target.id in active_mobs){
		target_chr = active_mobs[target.id];
	};
	if(user_chr == null || target_chr == null){
		return "<cannot find characters>"
	};
	/*
		use items
		ITEM TYPES:
		1.CONSUMABLES
	*/
	if(item.type == "item"){
		//consumables
		if(item.use_type == "consumable"){
			//change the text output
			if(user.id == target.id){
				return_text = "```css\n"+user_chr.primary_stats.name+" used an item["+item.name+"]!```";
			}else{
				return_text = "```css\n"+user_chr.primary_stats.name+" used an item["+item.name+"] on "+target_chr.primary_stats.name+"!```";
			};
			//use the item
			//Do quality modifiers
			for(var i=0; i < item.effect_settings.quality_modifier.length; i++){
				if(item.effect_settings.quality_modifier[i] in item.effect_settings){
					item.effect_settings[item.effect_settings.quality_modifier[i]] = Math.round(item.effect_settings[item.effect_settings.quality_modifier[i]]*item.quality/100);
				};
			};
			/*
				HP RECOVERY ITEMS
			*/
			if(item.effect == "RESTORE_HP"){
				//calc heal power
				var heal_power = item.effect_settings.potency;
				if(target_chr.primary_stats.hp + heal_power > target_chr.combat_stats.max_hp){
					heal_power = Math.floor(target_chr.combat_stats.max_hp - target_chr.primary_stats.hp)
				};
				//give text feedback
				return_text += "```css\n"+target_chr.primary_stats.name+" recovered "+heal_power+" hp! ("+target_chr.primary_stats.hp+"/"+target_chr.combat_stats.max_hp+")+["+heal_power+"]```";
				//heal target
				target_chr.primary_stats.hp += heal_power;
			}
			/*
				MP RECOVERY ITEMS
			*/
			else if(item.effect == "RESTORE_MP"){
				var mana = item.effect_settings.potency;
				if(target_chr.primary_stats.mp + mana > target_chr.combat_stats.max_mp){
					mana = Math.floor(target_chr.combat_stats.max_mp - target_chr.primary_stats.mp)
				};
				return_text += "```css\n"+target_chr.primary_stats.name+" recovered "+mana+" mp! ("+target_chr.primary_stats.mp+"/"+target_chr.combat_stats.max_mp+")+["+mana+"]```";
				target_chr.primary_stats.mp += mana;
			}
			/*
				BUFF ITEMS
			*/
			else if(item.effect == "CAST_BUFF"){
				//find skill
				if(item.effect_settings.skill_name in skills_list){
					//set duration if skill is found
					var skill_copy = Object.assign({}, skills_list[item.effect_settings.skill_name]);
					skill_copy.secondary_skill_power = item.effect_settings.turns;
					//execute the passive
					apply_passive(skill_copy, user_chr, target_chr, 100);
					//apply text
					return_text += "```css\n"+target_chr.primary_stats.name+" was affected by ["+skill_copy.skill_name+"]!```";
				};
			};
			//delete consumables after use
			if(user.id in users){
				if(item.id in users[user.id].jrpg_data.inventory){
					delete users[user.id].jrpg_data.inventory[item.id];
				};
			};
		};
	}else{
		//not an item/no effect
		return_text = "```css\n"+user_chr.primary_stats.name+" used ["+item.name+"] on "+target_chr.primary_stats.name+", but it had no effect!```"
	};
	//return results
	return return_text
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//TOWNS//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


//MISC FUNCTIONS FOR ALL SHOPS
//save store data
function save_towns(){
	//grab required data
	var json = JSON.stringify(towns_list);
	
	//write file
	//sync save for now because we don't want towns.json to not finish writing if bot crashes
	file_system.writeFileSync('towns.json', json);
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
	for(var key in store.stock){
		new_stock[key] = store.stock[key]
	};
	//determine missing stock
	var missing_stock = store.max_stock-Object.keys(store.stock).length;
	for(var i = 0; i < missing_stock; i++){
		var keys = Object.keys(stock_equipment);
		var random_key = Math.floor(Math.random()*keys.length);
		var id = create_item_identifier(new_stock);
		var item = create_equipement(keys[random_key], store.tier, id, 1);
		if(item != null){
			new_stock[id] = item
		}
	};
	return new_stock
};




//MAIN FOR CITIES
//update cities
function update_cities(){
	/*
		1. Check if stores need to be restocked
		2. Check if quests need to be updated
	*/
	for(var key in towns_list){
		//this town
		var town = towns_list[key];
		//check if town has a general TRADER
		if(town != undefined){
			if(town.hasOwnProperty("TRADER")){
				var d = new Date();
				var n = d.getTime();
				//check if trader needs to be restocked
				var keys = Object.keys(town.TRADER.stock);
				//time frame
				var restocks = Math.floor((n-town.TRADER.last_stock)/store_restock_time);
				var restock_time = town.TRADER.last_stock+(store_restock_time*restocks);
				if(keys.length < town.TRADER.max_stock || restocks >= 1){
					//check when the store was last stocked
					if(town.TRADER.last_stock == null){
						//never stocked, restock
						var restock = restock_store(town.TRADER);
						town.TRADER.stock = restock;
						//restock time
						town.TRADER.last_stock = n;
					}else{
						if(restocks >= 1){
							//restock time
							town.TRADER.last_stock = restock_time;
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
					var refreshes = Math.floor((n-town.TRADER.last_refresh)/store_refresh_time);
					var refresh_time = town.TRADER.last_refresh+(store_refresh_time*refreshes);
					if(refreshes >= 1){
						//refresh time
						town.TRADER.last_refresh = refresh_time;
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



//BUY SELL STUFF
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



//buy item
//buy unique items can only buy one at a time
function buy_unique_item(users, user, l, purchase_id, currency){
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


//buy bulk item
function buy_bulk_item(users, user, l, purchase_id, quantity, currency){
	var return_text = null;
	//return a list of things
	var bulk_shop = towns_list[l[0]][l[1]].items_list;
	//check if bulk shop exists
	if(bulk_shop != undefined){
		//return a list of names of items of the the things in the bulk shop
		var purchase_names = {};[0]
		for(var key in bulk_shop){
			var item = bulk_shop[key];
			//find item in stock items
			if(item.type in stock_items){
				if(key in stock_items[item.type]){
					purchase_names[String(stock_items[item.type][key].name)] = String(key);
				}
			}
		};
		//now we check what the player wants to buy
		if(purchase_id in purchase_names){
			//check if quantity is an interger
			const buy_qt = Number(quantity);
			if(Number.isInteger(buy_qt)){
				//we can now buy the item so we check the price
				var item = bulk_shop[purchase_names[purchase_id]];
				var item_price = Math.round(item.worth*buy_qt);
				//set currency
				var user_money = users[user].jrpg_data.currencies[currency];
				if(user_money == undefined){
					user_money = users[user].currency;
				};
				//check price
				if(user_money >= item_price){
					//subtract money
					if(users[user].jrpg_data.currencies[currency] == undefined){
						users[user].currency -= item_price;
					}else{
						users[user].jrpg_data.currencies[currency] -= item_price;
					};
					//buy items in bulk
					for(var i = 0; i < buy_qt; i++){
						//create item
						var item_clone = create_item(item.type, purchase_names[purchase_id], 0);
						//set quality based on stock
						item_clone.quality = Math.round(item.quality[0]+Math.random()*(item.quality[1]-item.quality[0]));
						//set item worth
						item_clone.worth = item.worth;
						//give item
						give_item(users, user, item_clone);
					};
					//give return text
					return_text = "```css\n"+
					users[user].name+", thank you for purchasing ["+purchase_id+"] X("+buy_qt+")```"+
					"```css\n"+users[user].name+" your new balance is "+user_money+"```";
				}else{
					//can't afford
					return_text = "```css\n"+users[user].name+" you cannot afford ["+item.name+"]```";
				}
			}
		}
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
			var item_price = Math.round(item.worth/2);
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



//FORMATT SHOPS
//formatt trader page
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
				if(item.hasOwnProperty("tier")){
					return_text += "#"+item.id+" : {"+item.tier+"} "+item.name+" ["+item.worth+"]\n";
				}else if(item.hasOwnProperty("quality")){
					return_text += "#"+item.id+" : {"+item.quality+"%} "+item.name+" ["+item.worth+"]\n";
				}else{
					return_text += "#"+item.id+" : "+item.name+" ["+item.worth+"]\n";
				}
			}
		};
		return_text += "```";
	};
	return return_text
};


//formatt bulk item shop
function formatt_bulk_shop(town, shop, page, shop_name){
	var return_text = "";
	//get page
	var tpage = Math.floor(Number(page));
	if(tpage === Infinity || String(tpage) !== page){
		return "<invalid page number>"
	};
	//beging formatting display
	return_text = "```css\n"+
	"Inventory of the "+shop_name+" of ["+town.town_name+"]\n```"
	var keys = Object.keys(shop.items_list);
	if(keys.length > 0){
		return_text += "```css\n"+
		"Showing Page #"+tpage+"\n\n";
		//results per page
		var target_keys = 5*tpage-1;
		var start_key = 5*(tpage-1);
		//display results
		for(var i = start_key; i < target_keys; i++){
			if(keys[i] != undefined){
					var item = shop.items_list[keys[i]];
					//check if in stock items
					if(stock_items[item.type] != undefined){
						if(keys[i] in stock_items[item.type]){
							//display one result
							return_text += "{"+stock_items[item.type][keys[i]].name+"}\n"+
							"Quality Range : ["+item.quality[0]+"-"+item.quality[1]+"]%\n"+
							"Unit Price : "+item.worth+"\n\n"
						}
					}
			}
		};
		return_text += "```"
	}
	return return_text
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//FORMATT_INFO///////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//return item stats
function fomatt_item_stats(item){
	var return_text = null;
	//return different formats for each type of equipment
	if(item.type == "weapon" || item.type == "armor"){
		return_text = "```css\n"+
		item.name+" +"+item.rank+" | Tier {"+item.tier+"} | "+"#"+item.id+"\n"+
		"["+item.type+"]."+item.wield_type+" | AC."+item.ac+"\n"+
		"Equippable To: ";
		for(var i = 0; i < item.class_lock.length; i++){
			return_text += "("+item.class_lock[i]+")";
		};
		return_text += "\nElement : ["+item.elemental+"]\n\n"+
		"#Stats\n";
		for(var key in item.stats){
			return_text += key+" : "+item.stats[key]+"\n"
		};
		if(Object.keys(item.attributes).length > 0){
			return_text += "\n"+
			"#Attributes\n";
			for(var key in item.attributes){
				return_text += key+" : "+item.attributes[key]+"\n"
			};
		};
		if(Object.keys(item.elemental_values).length > 0){
			return_text += "\n"+
			"#Elemental_Resistances\n";
			for(var key in item.elemental_values){
				return_text += key+" : "+item.elemental_values[key]+"%\n"
			};
		};
		if(Object.keys(item.status_values).length > 0){
			return_text += "\n"+
			"#Status_Resistances\n";
			for(var key in item.status_values){
				return_text += key+" : "+item.status_values[key]+"%\n"
			};
		};
		if(Object.keys(item.spell_enable).length > 0){
			return_text += "\n"+
			"#Abilities\n";
			for(var key in item.spell_enable){
				return_text += key+"\n"
			};
		};
		return_text += "\n\nWorth ["+item.worth+"]```"
	}else if(item.type == "item"){
		return_text = "```css\n"+
		item.name+" | ["+item.use_type+"] | "+"#"+item.id+"\n";
		//display stats
		if(item.hasOwnProperty("quality")){
			return_text += "Quality : "+item.quality+"%";
		};
		//CONSUMABLES
		if(item.hasOwnProperty("effect")){
			if(item.effect_settings.hasOwnProperty("quality_modifier")){
				return_text += " {"+item.effect_settings.quality_modifier+"}";
			};
			return_text += "\n\nEffect : "+item.effect;
			if(item.effect_settings.hasOwnProperty("potency")){
				return_text += "."+item.effect_settings.potency+"_POTENCY."+item.effect_settings.potency_type+"";
			};
		};
		//finish
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
	for(var key in chr.learned_skills){
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
		"Ac Cost : "+skill.ac_cost+"\n"+
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
				for(var key in skill.bonus_effects){
					if(skill.bonus_effects[key].name != null){
						return_text += "{"+key+":'"+skill.bonus_effects[key].name+"'}: \n";
					}else{
						return_text += "{"+key+":'"+skill.bonus_effects[key]+"'} \n";
					}
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
//WORLD_MAP//////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
					for(var key in obj_location.encounters.mob_groups){
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
												//mob copy to prevent werid stuff
												var mob_copy = Object.assign({}, all_mobs[sizes][n_mob]);
												active_mobs[new_mob_id] = new mob(new_mob_id, mob_copy, mob_group.mobs[n_mob].tier);
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
							return_text = "```css\n#"+local_party.name+" : {»TRAVEL EVENT«}\n\n"+mob_group.description+"\nGet ready for a combat encounter!\n\nCurrent position : ("+move_to_position.x+","+move_to_position.y+")```"
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
					return_text = "```css\n#"+local_party.name+" : {»TRAVEL EVENT«}\n\nThe party has reach their destination and arrived at ("+obj_location.zone_name+") at ("+move_to_position.x+","+move_to_position.y+")```"
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
									return_text = "```css\n#"+local_party.name+" : {»TRAVEL EVENT«}\n\nThe party has reach their destination and arrived at ("+obj_location.zone_name+") at ("+move_to_position.x+","+move_to_position.y+")```"
									break
								}else{
									//we ran into a problem where we can't move to this location any more
									return_text = "```css\n#"+local_party.name+" : {»TRAVEL EVENT«}\n\nThe party has reached an impasse in their travels upon reaching ("+obj_location.zone_name+") at ("+move_to_position.x+","+move_to_position.y+")```"
									//break out of the travel loop
									break
								}
							}
						}
					}
				};
			}else{
				//we ran into a problem where we can't move to this location any more
				return_text = "```css\n#"+local_party.name+" : {»TRAVEL EVENT«}\n\nThe party has reached an impasse in their travels upon reaching ("+obj_location.zone_name+") at ("+move_to_position.x+","+move_to_position.y+")```"
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
//UI/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//ui during battles, uses reactions to input commands
async function get_ui(ui_name, options){
	//return canvas
	var canvas = null
	/*
		UI LIST
		1.turn_order_ui
	*/
	if(ui_name == "turn_order_ui"){
		/*
			options inputs
			0 : users
			1 : battle
			2 : discord client
		*/
		//create new canvas
		canvas = Canvas.createCanvas(1280, 400);
		const ctx = canvas.getContext('2d');
		//load images
		const background = await Canvas.loadImage('./ui/turn_bar_bottom.jpg');
		const card_background = await Canvas.loadImage('./ui/turn_card_back.jpg');
		const card_outline_passive = await Canvas.loadImage('./ui/turn_card_border_passive.png');
		const card_outline_active = await Canvas.loadImage('./ui/turn_card_border_active.png');
		const card_bottom = await Canvas.loadImage('./ui/turn_card_bottom.png');
		//draw the background
		ctx.drawImage(background, 0, Math.floor(canvas.height*0.675), canvas.width, Math.floor(canvas.height*0.2));



		//draw the main card
		var main_card_id = options[1].turn_order[0].id;
		//get avatar
		var avatar = null;
		var t_chr = null;
		if(options[1].participant_variables[main_card_id].type == 'player'){
			t_chr = options[0][main_card_id].jrpg_data.character;
			//player avatar
			const this_player = await options[2].users.fetch(main_card_id);
			if(this_player != undefined){
				avatar = await Canvas.loadImage(this_player.displayAvatarURL({format:'png'}));
			};
		}else if(options[1].participant_variables[main_card_id].type == 'mob'){
			t_chr = active_mobs[main_card_id];
			//get mob avatar
		};
		//draw the card
		/*
			1.sizes
			2.save ctx map
			3.make clipping mask
			4.draw images
			5.restore clipping mask
			6.draw health bar
		*/
		const c_x_size = Math.floor(canvas.width*0.15);
		const c_y_size = Math.floor(canvas.height*0.675);
		const c_x_pos = Math.floor(canvas.width*0.05);
		const c_y_pos = Math.floor(canvas.height*0.05);
		const x_displace = Math.floor(c_x_pos-(c_y_size-c_x_size)/2);
		ctx.drawImage(card_bottom, x_displace, c_y_pos, c_y_size, c_y_size);
		ctx.save();
		ctx.beginPath();
		ctx.rect(c_x_pos, c_y_pos, c_x_size, c_y_size);
		ctx.closePath();
		ctx.clip();
		ctx.drawImage(card_background, c_x_pos, c_y_pos, c_x_size, c_y_size);
		if(avatar != null){
			ctx.drawImage(avatar, x_displace, c_y_pos, c_y_size, c_y_size);
		};
		ctx.drawImage(card_outline_active, c_x_pos, c_y_pos, c_x_size, c_y_size);
		ctx.restore();
		if(t_chr != null){
			const hp_canvas = Canvas.createCanvas(canvas.width, Math.floor(canvas.height*0.2));
			const hp_canvas_ctx = hp_canvas.getContext('2d');
			const hp_bar_fill = Math.floor(hp_canvas.width*t_chr.primary_stats.hp/t_chr.combat_stats.max_hp);
			hp_canvas_ctx.fillStyle = "#5A6156";
			hp_canvas_ctx.fillRect(0, 0, hp_canvas.width, hp_canvas.height);
			hp_canvas_ctx.fillStyle = "#A2DB82";
			hp_canvas_ctx.fillRect(0, 0, hp_bar_fill, hp_canvas.height);
			hp_canvas_ctx.fillStyle = "#FFFFFF";
			hp_canvas_ctx.font = "bold 82px Bahnschrift SemiLight Condensed";
			hp_canvas_ctx.textAlign = "left";
			hp_canvas_ctx.fillText("HP : "+t_chr.primary_stats.hp+"/"+t_chr.combat_stats.max_hp, Math.floor(hp_canvas.width*0.025),  Math.floor(hp_canvas.height*0.85));
			ctx.drawImage(hp_canvas, 0, Math.floor(canvas.height*0.8), canvas.width, Math.floor(canvas.height*0.2));
		};



		//get everyone else and each other their ac values and find how close they are to a turn and organize
		var other_card_ids = [];
		for(var key in options[1].participant_variables){
			if(key != main_card_id){
				if(other_card_ids.length > 0){
					var linked = false;
					//get the chr of this card
					var n_chr = null;
					if(options[1].participant_variables[key].type == 'player'){
						n_chr = options[0][options[1].participant_variables[key].id].jrpg_data.character;
					}else if(options[1].participant_variables[key].type == 'mob'){
						n_chr = active_mobs[options[1].participant_variables[key].id];
					};
					//check the other cards
					for(var i = 0; i < other_card_ids.length; i++){
						//compare ac values
						var o_chr = null;
						if(options[1].participant_variables[other_card_ids[i]].type == 'player'){
							o_chr = options[0][options[1].participant_variables[other_card_ids[i]].id].jrpg_data.character;
						}else if(options[1].participant_variables[other_card_ids[i]].type == 'mob'){
							o_chr = active_mobs[options[1].participant_variables[other_card_ids[i]].id];
						};
						
						if(n_chr != null && o_chr != null){
							const n_ac = n_chr.primary_stats.ac-options[1].participant_variables[key].ac;
							const o_ac = o_chr.primary_stats.ac-options[1].participant_variables[other_card_ids[i]].ac;
							if(n_ac <= o_ac && n_chr.primary_stats.hp > 0){
								other_card_ids.splice(i, 0, key);
								linked = true;
								break
							};
						};
					};
					if(linked == false && n_chr.primary_stats.hp > 0){
						other_card_ids.push(key)
					};
				}else{
					other_card_ids.push(key)
				};
			};
		};
		//draw the smaller cards showing the turn order
		/*
			1.set the background area
			2.draw each individual card
		*/
		const o_x_area = Math.floor(canvas.width*0.7);
		const o_y_area = Math.floor(canvas.height*0.375);
		const o_x_pos = Math.floor(canvas.width*0.25);
		const o_y_pos = Math.floor(canvas.height*0.2625);
		for(var i = 0; i < other_card_ids.length; i++){
			//limit 8 cards shown at once
			if(i < 8){
				var this_id  = other_card_ids[i];
				//get avatar
				var o_avatar = null;
				if(options[1].participant_variables[this_id].type == 'player'){
					const this_player = await options[2].users.fetch(this_id);
					if(this_player != undefined){
						o_avatar = await Canvas.loadImage(this_player.displayAvatarURL({format:'png'}));
					};
				}else if(options[1].participant_variables[this_id].type == 'mob'){
					//mob avatar
				};
				//draw card
				const oc_x_size = Math.floor(o_x_area/8);
				const oc_y_size = o_y_area;
				const oc_x_pos = Math.floor(o_x_pos+oc_x_size*i+10*i);
				const oc_y_pos = o_y_pos;
				const ox_displace = Math.floor(oc_x_pos-(oc_y_size-oc_x_size)/2);
				ctx.save();
				ctx.beginPath();
				ctx.rect(oc_x_pos, oc_y_pos, oc_x_size, oc_y_size);
				ctx.closePath();
				ctx.clip();
				ctx.drawImage(card_background, oc_x_pos, oc_y_pos, oc_x_size, oc_y_size);
				if(o_avatar != null){
					ctx.drawImage(o_avatar, ox_displace, oc_y_pos, oc_y_size, oc_y_size);
				};
				ctx.drawImage(card_outline_passive, oc_x_pos, oc_y_pos, oc_x_size, oc_y_size);
				ctx.restore();
			};
		};
		
		//return image
		return canvas
	};
	
	return canvas
};


	
/*
	return a keyed dictionary
	Example:
	1 : NAME
	2 : NAME
*/
function return_targets(input_battle){
	//return list and key value for new list
	var list = {};
	var key_value = 0;
	//generate list of names of targets with key values
	for(var key in input_battle.participants){
		list[key_value] = key;
		key_value += 1;
	};
	return list
};



//function ui logic
// 0 MAIN MENU
// 1 BASIC ATTACK
// 2 SKILL SELECT
// 3 SKILL ATTACK SELECT
async function uiLogic(reaction_message, ui_object, user_data){
	//based on the reaction and the ui_object, we make changes to the ui object
	const input_emoji = reaction_message.emoji.name;
	//combat ui
	if(ui_object.ui_type === "battle_ui"){
		//
		//0 MAIN MENU
		//
		if(ui_object.ui_page === 0){
			//attack menu
			if(input_emoji === '1️⃣'){
				//find the battle from the ui_owner property of ui_object
				var t_battle = findBattleById(ui_object.ui_owner);
				if(t_battle != null){
					//set page
					ui_object.ui_page = 1;
					//find targets
					const all_targets = return_targets(t_battle);
					ui_object.ui_options[ui_settings.t_key] = all_targets;
					//create a ui with all the targets
					var text = "```css\n[SELECT TARGET]"
					for(var key in all_targets){
						text += "\n"+key+" : "+all_targets[key]
					};
					text += "```"
					//edit the message object with the new ui
					ui_object.message.edit(text)
					ui_object.message.reactions.removeAll().catch(error => console.error(error));
					//react
					try{
						ui_object.message.react('❎');
						for(var key in all_targets){
							if(key in emoticon_list){
								ui_object.message.react(emoticon_list[key])
							}
						};
					}catch(error){
						throw err
					};
				};
			}
			//skills menu
			else if(input_emoji === '2️⃣'){
				//find if the user exists and has a character
				var n_chr = findChild('character', user_data[ui_object.ui_owner])
				if(n_chr != null){
					//set page
					ui_object.ui_page = 2;
					ui_object.ui_sub_page = 0;
					//fetch all the skills
					const all_skills = Object.keys(n_chr.learned_skills).map(x => x);
					ui_object.ui_options[ui_settings.s_key] = all_skills;
					//create ui with all skills
					var text = "```css\n[SELECT SKILL]";
					for(var i=0; i < 5; i++){
						if(all_skills[i] != undefined){
							if(all_skills[i] in skills_list){
							text += "\n"+i+" : {MP:"+skills_list[all_skills[i]].mp_cost+"} "+all_skills[i]
							}
						}
					};
					text += "```"
					//edit the message
					ui_object.message.edit(text)
					ui_object.message.reactions.removeAll().catch(error => console.error(error));
					//add reactions
					//react
					try{
						ui_object.message.react('❎');
						ui_object.message.react('◀️');
						ui_object.message.react('▶️');
						for(var i=0; i < 5; i++){
							if(i in emoticon_list){
								ui_object.message.react(emoticon_list[i])
							}
						};
					}catch(error){
						throw err
					};
				};
			}
			//defend
			else if(input_emoji === '3️⃣'){
				//find if the user exists and has a character
				var n_chr = findChild('character', user_data[ui_object.ui_owner])
				if(n_chr != null){
					var cmd_message = jrpg_commands["combat_defend"]+".self";
					//console.log("executing command : "+cmd_message);
					const execute_command_message = module.exports.jrpg_main(cmd_message,ui_object.ui_owner,user_data);
					if (execute_command_message != "NILL"){
						ui_object.channel.send(execute_command_message);
					};
				};
			}
			//item
			else if(input_emoji === '4️⃣'){
				console.log("using item");
			};
		}
		//
		//1 ATTACK
		//
		else if(ui_object.ui_page === 1){
			//return to main menu
			if(input_emoji === '❎'){
				//set page
				ui_object.ui_page = 0;
				//return main menu ui
				const text =  "```css\n1 : ATTACK\n2 : SKILL\n3 : DEFEND\n4 : ITEM```";
				ui_object.message.edit(text);
				ui_object.message.reactions.removeAll().catch(error => console.error(error));
				//react
				try{
					await ui_object.message.react('1️⃣');
					await ui_object.message.react('2️⃣');
					await ui_object.message.react('3️⃣');
					await ui_object.message.react('4️⃣');
				}catch(err){
					throw err
				};
			}else{
				//check all reacted emotes
				if(input_emoji in t_emoticon_list){
					//find the target
					if(typeof ui_object.ui_options[ui_settings.t_key] === 'object'){
						if(t_emoticon_list[input_emoji] in ui_object.ui_options[ui_settings.t_key]){
							//create a command message
							var cmd_message = jrpg_commands["combat_attack"]+"."+ui_object.ui_options[ui_settings.t_key][t_emoticon_list[input_emoji]];
							//console.log("executing command : "+cmd_message);
							const execute_command_message = module.exports.jrpg_main(cmd_message,ui_object.ui_owner,user_data);
							if (execute_command_message != "NILL"){
								ui_object.channel.send(execute_command_message);
							};
						};
					};
				};
			};
		}
		//
		//2 SKILL
		//
		else if(ui_object.ui_page === 2){
			//return to main menu
			if(input_emoji === '❎'){
				//set page
				ui_object.ui_page = 0;
				//return main menu ui
				const text =  "```css\n1 : ATTACK\n2 : SKILL\n3 : DEFEND\n4 : ITEM```";
				ui_object.message.edit(text);
				ui_object.message.reactions.removeAll().catch(error => console.error(error));
				//react
				try{
					await ui_object.message.react('1️⃣');
					await ui_object.message.react('2️⃣');
					await ui_object.message.react('3️⃣');
					await ui_object.message.react('4️⃣');
				}catch(err){
					throw err
				};
			//page buttons
			}else if(input_emoji === "◀️" || input_emoji === "▶️" && ui_object.ui_options[ui_settings.s_key] != undefined){
				//calculation for sub pages
				const total_sub_pages = Math.ceil(ui_object.ui_options[ui_settings.s_key].length/(ui_settings.resPerPage))-1;
				//back and forward buttons
				if(input_emoji === "◀️"){
					if((ui_object.ui_sub_page-1) < 0){
						ui_object.ui_sub_page = total_sub_pages;
					}else{
						ui_object.ui_sub_page -= 1;
					};
				}else if(input_emoji === "▶️"){
					if((ui_object.ui_sub_page+1) > total_sub_pages){
						ui_object.ui_sub_page = 0
					}else{
						ui_object.ui_sub_page += 1;
					};
				};
				//get skills to display
				const start_index = ui_object.ui_sub_page*ui_settings.resPerPage;
				var skills_to_display = [];
				for(var i=start_index; i < start_index+ui_settings.resPerPage; i++){
					if(ui_object.ui_options[ui_settings.s_key][i] != undefined){
						skills_to_display.push(ui_object.ui_options[ui_settings.s_key][i]);
					};
				};
				//create the message
				var text = "```css\n[SELECT SKILL]";
				for(var i=0; i < skills_to_display.length; i++){
					if(skills_to_display[i] != undefined){
						if(skills_to_display[i] in skills_list){
							text += "\n"+i+" : {MP:"+skills_list[skills_to_display[i]].mp_cost+"} "+skills_to_display[i];
						};
					};
				};
				text += "```"
				//edit the message
				ui_object.message.edit(text)
				ui_object.message.reactions.removeAll().catch(error => console.error(error));
				//add reactions
				//react
				try{
					ui_object.message.react('❎');
					ui_object.message.react('◀️');
					ui_object.message.react('▶️');
					for(var i=0; i < skills_to_display.length ; i++){
						if(i in emoticon_list){
							ui_object.message.react(emoticon_list[i]);
						}
					};
				}catch(error){
					throw err
				};
			//select skill
			}else{
				//check reacts
				var t_battle = findBattleById(ui_object.ui_owner);
				if(input_emoji in t_emoticon_list && t_battle != null){
					if(typeof ui_object.ui_options[ui_settings.s_key] === 'object'){
						//find the first index of the page and add the index of the emoticon which gives the index of the skill
						const skill_index = ui_object.ui_sub_page*ui_settings.resPerPage+parseInt(t_emoticon_list[input_emoji]);
						if(ui_object.ui_options[ui_settings.s_key][skill_index] != undefined){
							if(ui_object.ui_options[ui_settings.s_key][skill_index] in skills_list){
								const input_skill = ui_object.ui_options[ui_settings.s_key][skill_index].slice();
								//set page & skill use
								ui_object.ui_page = 3;
								ui_object.ui_options[ui_settings.s_skill] = input_skill;
								//find targets
								const all_targets = return_targets(t_battle);
								ui_object.ui_options[ui_settings.t_key] = all_targets;
								//create a ui
								var text = '```css\nCASTING : ['+input_skill+'].'+skills_list[input_skill].type+'\n\n[SELECT TARGET]';
								for(var key in all_targets){
									text += "\n"+key+" : "+all_targets[key]
								};
								text += "```"
								//edit the message
								//edit the message object with the new ui
								ui_object.message.edit(text)
								ui_object.message.reactions.removeAll().catch(error => console.error(error));
								//react
								try{
									ui_object.message.react('❎');
									for(var key in all_targets){
										if(key in emoticon_list){
											ui_object.message.react(emoticon_list[key])
										}
									};
								}catch(error){
									throw err
								};
							};
						};
					};
				};
			};
		}
		//
		//3 SKILL ATTACK
		//
		else if(ui_object.ui_page === 3){
			//return to main menu
			if(input_emoji === '❎'){
				//set page
				ui_object.ui_page = 0;
				//return main menu ui
				const text =  "```css\n1 : ATTACK\n2 : SKILL\n3 : DEFEND\n4 : ITEM```";
				ui_object.message.edit(text);
				ui_object.message.reactions.removeAll().catch(error => console.error(error));
				//react
				try{
					await ui_object.message.react('1️⃣');
					await ui_object.message.react('2️⃣');
					await ui_object.message.react('3️⃣');
					await ui_object.message.react('4️⃣');
				}catch(err){
					throw err
				};
			}else{
				if(input_emoji in t_emoticon_list){
					if(typeof ui_object.ui_options[ui_settings.t_key] === 'object'){
						if(t_emoticon_list[input_emoji] in ui_object.ui_options[ui_settings.t_key]){
							//create a command message
							var cmd_message = jrpg_commands["combat_skill"]+"."+ui_object.ui_options[ui_settings.s_skill]+'.'+ui_object.ui_options[ui_settings.t_key][t_emoticon_list[input_emoji]];
							//console.log("executing command : "+cmd_message);
							const execute_command_message = module.exports.jrpg_main(cmd_message,ui_object.ui_owner,user_data);
							if (execute_command_message != "NILL"){
								ui_object.channel.send(execute_command_message);
							};
						};
					};
				};
			};
		};
	};
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//MODULE/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//jrpg module call
module.exports = {
	
	/*
	jrpg_combat
	
	battle_contents:
	1. run battles (returns array, 0.text, 1.ui)
	*/
	jrpg_combat : function(msg_content, msg_author, users){
		var combat_message = execute_battles(users);
		return combat_message
	},
	
	
	
	/*
	jrpg_ui_main
	*client is needed because of fetching discord ids
	
	1. battle ui
	*/
	jrpg_ui_main : function(msg_content, msg_author, client, users){
		var message = msg_content;
		var author = msg_author;
		//check if author exists
		if(author in users){
		}else{
			return "<NO USER PROFILE>"
		};
		/*
			BATTLE INTERFACE
			1.TURN ORDER BAR
			2.INTERACTABLE TURN PLATE
		*/
		if(message.toLowerCase() == jrpg_commands['battle_ui']){
			//ui_element
			var ui_element = null;
			//can only call this gui in battle
			var p = check_party(author);
			if(p == false){
				return "<you are not in a party>"
			}else{
				//check if party is in combat
				if(p.in_combat == true){
					//find battle
					var this_battle = undefined;
					try {
						this_battle = battles[p.battle_type]
					} catch (err){
						console.log(err)
					};
					//get the battle object
					if(this_battle != undefined){
						this_battle = this_battle[p.battle_name]
						if(this_battle != undefined){
							//check the turn order
							if(this_battle.turn_order.length > 0){
								if(this_battle.turn_order[0].id == author){
									//get active ui request
									var active_ui = new active_ui_object(author, author, "battle_ui");
									//get ui and send ui elements back to main scripts
									ui_element = [get_ui("turn_order_ui", [users, this_battle, client]), active_ui]
									return ui_element
								}else{
									return "<it is not your turn yet>"
								}
							}
						}
					};
				}else{
					return "<you are not in combat>"
				}
			};
			//return ui_element
			return ui_element
		};
	},
	
	
	
	/*
	jrpg_ui_logic
	*ui logic is for reacting to emoticons on ui elements
	1. battle ui
	*/
	jrpg_ui_logic : function(reaction_message,ui_object,user_data){
		//fire ui logic function
		uiLogic(reaction_message, ui_object, user_data)
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
	*/
	jrpg_main : function(msg_content, msg_author, users){
		/*
			jrpg_cities
		*/
		update_cities();
		/*
			Commands
		*/
		//users
		var message = msg_content;
		var author = msg_author;
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
				CASE SENSITIVE SETTINGS
			*/
			msg_parts[0] = msg_parts[0].toLowerCase();
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
					users[author]['jrpg_data']['character'] = new character(author, msg_parts[1], msg_parts[2], 0);
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
						update_stats(users[author]['jrpg_data']['character'], false);
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
									combatants = mob_parties[this_battle.TEAM_2].members.concat(parties[this_battle.TEAM_1].members);
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
									combatants = mob_parties[this_battle.TEAM_2].members.concat(parties[this_battle.TEAM_1].members);
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
														};
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
				5. USE ITEMS
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
					/*
						use items
					*/
					else if(inventory_c == jrpg_commands['use_item'] && msg_parts.length == 4){
						//check if item exists
						var item_id = msg_parts[2];
						if(item_id in users[author].jrpg_data.inventory){
							//set item
							var found_item = users[author].jrpg_data.inventory[item_id];
							//find out who the user is trying to use the item on
							//keep mention an target_id seperate because it might be in a battle where we use names
							var mention = msg_parts[3];
							var target_id = target_user_id(mention);
							//check if user in a party
							var p = check_party(author);
							if(p != false){
								//USE ITEM IN COMBAT
								if(p.in_combat == true){
									//find the battle
									var this_battle = undefined;
									//test to see if battle type exists
									try {
										this_battle = battles[p.battle_type]
									} catch (err) {
										console.log(err)
									};
									//then we test to see if we can find the battle
									if(this_battle != undefined){
										this_battle = this_battle[p.battle_name];
										if(this_battle != undefined){
											//use item on anyone in combat
											var target_type = null;
											//check if target_name is in duel_participants
											if(mention in this_battle.participants){
												//set id
												target_id = this_battle.participants[mention].id;
												target_type = this_battle.participants[mention].type
											};
											//create a list of combatants
											//since people can leave mid battle
											var combatants = [];
											if(p.battle_type == "encounter_battles"){
												combatants = mob_parties[this_battle.TEAM_2].members.concat(parties[this_battle.TEAM_1].members);
											}else if(p.battle_type == "duels"){
												combatants = parties[this_battle.TEAM_1].members.concat(parties[this_battle.TEAM_2].members);
											};
											//check for the users turn
											if(this_battle.turn_order.length > 0){
												if(this_battle.turn_order[0].id == author){
													//check if target in combat still
													for(var i = 0; i < combatants.length; i++){
														if(combatants[i].id == target_id){
															//use item in combat
															if(target_type == 'player'){
																var item_use = use_items(found_item, users, users[author].jrpg_data.character, users[target_id].jrpg_data.character);
																//move turn
																remove_from_array(this_battle.turn_order, this_battle.turn_order[0]);
																//msg to server
																return item_use
															}else if(target_type == 'mob'){
																var item_use = use_items(found_item, users, users[author].jrpg_data.character, active_mobs[target_id]);
																//move turn
																remove_from_array(this_battle.turn_order, this_battle.turn_order[0]);
																//msg to server
																return item_use
															}
														}
													}
													//not in combatants list
													return "<that target is not in the current battle>"
												}else{
													return "<it is not your turn yet>"
												}
											}
										}
									};
								}else{
									//USE ITEM IN PARTY
									//use item on anyone in the party if we can find them
									for(var i=0; i < p.members.length; i++){
										if(p.members[i].id == target_id){
											//use item on party member
											var item_use = use_items(found_item, users, users[author], users[target_id]);
											return item_use
										}
									};
									//not in party
									return "<that target is not in the current party>"
								}
							}else{
								//USE ITEM SOLO
								//use item on self
								if(target_id == author){
									//use item on self
									var item_use = use_items(found_item, users, users[author], users[author]);
									return item_use
								}else{
									return "<you are alone, who do you think you are using that item on?>"
								};
							};
						}else{
							return "<you do not own that item>"
						}
					}
				}
			}
			/*
				TOWN COMMANDS
				1. Traders
					a.Check Traders
					b.Buy from Traders
					c.Sell to Traders
				2. Apothecaries
					a.Check items
					b.Buy items
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
										var purchase = buy_unique_item(users, author, l, purchase_id, "Tokens")
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
			else if((msg_parts[0] == jrpg_commands['apothecary'])&&(msg_parts.length >= 2)){
				/*
					commands:
					1. buy
					2.list
				*/
				//conditions for accessing apothecary
				if(users[author].jrpg_data.character != null){
				    var l = check_location(users[author], "APOTHECARY");
					if(l != null){
						if(l[0] in towns_list){
							var p = check_party(author);
							if(p != false){
								if(p.in_combat == true){
									return "<you are in a battle>"
								}
							};
							if(l[1] != undefined){
								//can access apothecary
								//apothecary sub command
								var apothecary_c = msg_parts[1];
								//list items
								if(apothecary_c == jrpg_commands['apothecary_list'] && msg_parts.length == 3){
									var page = msg_parts[2];
									var display_shop = formatt_bulk_shop(towns_list[l[0]], towns_list[l[0]][l[1]], page, "APOTHECARY");
									return display_shop
								}
								//buy items
								else if(apothecary_c == jrpg_commands['apothecary_buy'] && msg_parts.length == 4){
									//name of thing trying to buy and quantity
									var purchase_id = msg_parts[2];
									var quantity = msg_parts[3];
									//buy item
									var purchase = buy_bulk_item(users, author, l, purchase_id, quantity, "Tokens");
									if(purchase != null){
										return purchase
									}else{
										return "<something went wrong>"
									}
								};
							}else{
								return "<this city does not have an apothecary>"
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
