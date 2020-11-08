/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ABI BOT JRPG MODULE VERSION 0.1 RUNS OFF OF DISCORDIE BOT CODE WRITTEN MY ERIC/////////////////////////////////////////
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
	8.BATTLE PROGRESSION
	9.DAMAGE CALC
	10.INVENTORY
	11.TOWNS
	12.FORMATT INFO
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
	//inventory commands
	check_inventory : "inventory",
	/*
		check_inventory.inspect.id
		check_inventory.list.page
		check_inventory.user.page
	*/
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
	}
};



//ongoing battles
var battles = {
	duels : {
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
		this.turn_order = [],
		this.last_order = null,
		
		//duel request accepted
		this.duel_accepted = false;
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



//passive_tag
class passive_tag {
	constructor(skill, duration){
		this.skill = skill;
		this.duration = duration;
	}
};



//towns list
var towns_list = load_JSON(function(data){
	towns_list = data
	},
	'towns.json'
);



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



//all equipable data
var equipable_data = load_JSON(function(data){
	equipable_data = data
	},
	'./bot_modules/jrpg_data/equipment.json'
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
		
		
		//Set Stats NOTE: FIND A BETTER WAY TO DO THIS
		for (var key in chr_stats){
			if(key == "max_hp"){
				chr.combat_stats[key] = chr.attributes['stamina']*10 + chr.attributes['wisdom']*5
			}else if(key == "max_mp"){
				chr.combat_stats[key] = chr.attributes['intelligence']*3 + chr.attributes['wisdom']*3
			}else if(key == "attack_power"){
				chr.combat_stats[key] = chr.attributes['strength']*3 + chr.attributes['stamina']*2
			}else if(key == "magic_power"){
				chr.combat_stats[key] = chr.attributes['intelligence']*3 + chr.attributes['wisdom']*2
			}else if(key == "defence"){
				chr.combat_stats[key] = chr.attributes['stamina']*3 + chr.attributes['wisdom']*1
			}else if(key == "faith"){
				chr.combat_stats[key] = chr.attributes['wisdom']*3 + chr.attributes['stamina']*1
			}else if(key == "critical"){
				chr.combat_stats[key] = chr.attributes['luck']*2 + chr.attributes['dexterity']*2
			}else if(key == "critical_damage"){
				chr.combat_stats[key] = chr.attributes['strength']*2 + chr.attributes['intelligence']*2
			}else if(key == "evasion"){
				chr.combat_stats[key] = chr.attributes['luck']*2 + chr.attributes['dexterity']*2
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
		
		//update passive skills list
		for(key in chr.learned_skills){
			//find the skill and check if it is a passive
			if(skills_list[key] != undefined){
				//this skill
				var this_skill = skills_list[key];
				//check passive
				if(this_skill.type == "PASSIVE"){
					//create new passive tag
					var passive = new passive_tag(key, 1);
					chr.passive_tags[key] = passive;
				}
			}
		};
		
		
		//restore
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
		fText = fText+ 
		key+" : "+chr.equipment[key]+"\n"
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
		fText = fText+ 
		key+"\n"
	};
	
	//end text
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



//create equipable
function generate_equipable(item_type, tier, id){
	//item
	var this_item = null;
	//check for the existance of the equipable type
	//if equipable data exists
	if(equipable_data != undefined){
		if(item_type in equipable_data){
			var stock_item = equipable_data[item_type];
			//procede with generation
			/*
				PROCEDURE:
				1. Wield Type, Classes, Tier
				2. Stats & Attributes
				3. Elemental Modifiers and Status Modifiers
				4. Negative Modifiers
				5. Abilities
				6. Misc Elements
				7. Name
			*/
			var new_item = new equipable(item_type);
			
			//Primary 1. Wield Type, Classes, Tier
			new_item.type = stock_item.type;
			new_item.wield_type = stock_item.wield_type;
			new_item.class_lock = stock_item.class_lock;
			new_item.tier = tier;
			new_item.id = id;
			
			//Secondary 2. Stats & Attributes 3. Elements and Status
			var base_power = stock_item.stat_base*tier;
			//stats
			var primary_stat = stock_item.primary_stat;
			//secondary stats
			var possible_stats = generate_stats(stock_item.secondary_stats.slice(), 50, 4);
			var possible_attributes = generate_stats(stock_item.attributes.slice(), 50, 4);
			var possible_elements = generate_stats(stock_item.elemental.slice(), 40, 3);
			var possible_status = generate_stats(stock_item.status_type.slice(), 20, 3);
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
				new_item.attributes[possible_attributes[i]] = generate_variation(tier*2, 50);
			};
			//add elemental
			for(var i = 0; i < possible_elements.length; i++){
				new_item.elemental_values[possible_elements[i]] = generate_variation(tier*5, 25);
			};
			//add status
			for(var i = 0; i < possible_status.length; i++){
				new_item.status_values[possible_status[i]] = generate_variation(tier*5, 25);
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
			for(var i = 0; i < possible_abilities.length; i++){
				if(Math.floor(Math.random()*100)<50){
					new_item.spell_enable[possible_abilities[i]] = possible_abilities[i];
				}
			};
			
			//6. Misc Elements
			new_item.rank = 0;
			//calculate worth
			var base_worth = Math.floor(Math.random()*5)+5;
			var total_value = dictlength(new_item.stats)+dictlength(new_item.attributes)+dictlength(new_item.elemental_values)+dictlength(new_item.status_values)+dictlength(new_item.spell_enable);
			var total_worth = (tier*total_value*base_worth)+(3*tier*new_item.rank);
			new_item.worth = total_worth;
			
			//7. Generate Name
			new_item.name = pickRandomFromArray(stock_item.names);
			//return item
			this_item = new_item;
		};
	};
	return this_item
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//PARTY//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//formmat party text
function formatt_party_list(p, users){
	var plist_text = "```css\n#"+p.name+"\n\nPARTY MEMBERS ["+p.members.length+"/"+p.max_size+"]\n\n";
	//for each party member
	for(var i = 0; i < p.members.length; i ++){
		var pmember = null;
		try {
			pmember = users[p.members[i]]
		} catch (err) {
			console.log(err)
		}
		//if we find a party member
		if(pmember != null){
			pcharacter = pmember['jrpg_data']['character']
			plist_text = plist_text+pmember.name+" | CHARACTER : "+pcharacter.primary_stats.name+"\n"+
			"JOB : "+pcharacter.primary_stats.job+" | HP : ("+pcharacter.primary_stats.hp+"/"+pcharacter.combat_stats.max_hp+") MP : ("+pcharacter.primary_stats.mp+"/"+pcharacter.combat_stats.max_mp+")\n\n"
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
			var pmembers = parties[key].members
			for(var i = 0; i < pmembers.length; i++){
				if(pmembers[i] == user){
					in_party = parties[key]
				}
			}
		}
	}
	//if the user does not belong to a party or no parties are created return false
	return in_party
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



//determine turn order
function determine_turn_order(participating_parties, users){
	//find out which party is going first
	var party_order = [];
	var new_turn_order = [];
	//need to clone participating_parties first
	//short hand function copies x => x
	var all_parties = participating_parties.map((x) => x);
	//now while all_parties > 0 meaning that there are still party entries we are going to pick random participating_parties and add to order
	while(all_parties.length > 0){
		var selected_party = pickRandomFromArray(all_parties);
		//push party to party_order
		party_order.push(selected_party);
		//remove old party from all_parties
		remove_from_array(all_parties, selected_party);
	};
	//for each party in party_order
	for(var i = 0; i < party_order.length; i++){
		var members = parties[party_order[i]].members;
		//for each member in the party push them to turn order
		for(var m = 0; m < members.length; m++){
			//if member is dead skip turn
			if(users[members[m]].jrpg_data.character.primary_stats.hp != 0){
				new_turn_order.push(members[m])
			}
		}
	}
	//now that turn order has been established return it
	return [party_order, new_turn_order]
}



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BATTLE PROGRESSION/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//message at the start of each turn
function formatt_turn_message(parties_order, users_order, turn, users){
	var message = "```css\n"+
	"TURN ["+turn+"] of the duel between the parties : \n\n```"
	//for each party
	for(var i = 0; i < parties_order.length; i++){
		var this_party = parties[parties_order[i]];
		message = ""+message+formatt_party_list(this_party, users)+"\n";
	};
	//cleanup and return
	message = message+"\n\n\n";
	return message
};



//your turn message and checking status of character
function turn_message(duel, users){
	if(duel.turn_order.length > 0){
		//check if user is still in party
		var p = check_party(duel.turn_order[0]);
		if(p == false){
			msg = "```css\n["+users[duel.turn_order[0]].name+"] has fled from the battle\n```";
			remove_from_array(duel.turn_order, duel.turn_order[0]);
			return msg
		};
		if(duel.last_order != duel.turn_order[0]){
			var msg = "";
			//set last order
			duel.last_order = duel.turn_order[0];
			//update user stats
			update_stats(users[duel.turn_order[0]].jrpg_data.character, false);
			//check if user is dead
			if(users[duel.turn_order[0]].jrpg_data.character.primary_stats.hp == 0){
				msg = "```css\n You are dead, ["+users[duel.turn_order[0]].name+"]\n```";
				remove_from_array(duel.turn_order, duel.turn_order[0]);
			}else{
				msg = "```css\n It is your turn, ["+users[duel.turn_order[0]].name+"]\n```";
				//cast status
				msg += cast_status(users[duel.turn_order[0]]);
			}
			return msg
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
	//elmination condition
	if(condition == "HP_ZERO"){
		var parties_alive = [];
		for(var t = 0; t < teams.length; t++){
			var this_party = null;
			try {
				this_party = parties[teams[t]]
			} catch (err) {
				console.log(err)
			};
			//check if party still exists
			if(this_party != null){
				var party_hp = 0;
				for(var u = 0; u < this_party.members.length; u++){
					party_hp += users[this_party.members[u]].jrpg_data.character.primary_stats.hp;
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



//function cast all status skills
function cast_status(user){
	//return text
	var return_text = "";
	//first we need to find the passive skills of the user
	var chr = user.jrpg_data.character;
	//for every passive tag the user has
	if(Object.keys(chr.passive_tags).length > 0){
		for(key in chr.passive_tags){
			//first we need to check if the skill in the passive tag exists
			var this_skill = skills_list[chr.passive_tags[key].skill];
			if(this_skill != undefined){
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
								power = chr.combat_stats.max_mp - power;
							};
							//recover mp
							chr.primary_stats.mp += power;
							//set return text
							return_text += "```css\n"+chr.primary_stats.name+" recovered "+power+" MP from ["+this_skill.skill_name+"] ("+chr.primary_stats.mp+"/"+chr.combat_stats.max_mp+")\n```";
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
								power = chr.combat_stats.max_hp - power;
							};
							//recover mp
							chr.primary_stats.hp += power;
							//set return text
							return_text += "```css\n"+chr.primary_stats.name+" recovered "+power+" HP from ["+this_skill.skill_name+"] ("+chr.primary_stats.hp+"/"+chr.combat_stats.max_hp+")\n```";
						}
					}
				}
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
						var this_user = teams[t].members[i];
						update_stats(users[this_user]['jrpg_data']['character'], true);
					}
				};
				//start duel
				tduel.duel_started = true;
				tduel.turn += 1;
				//determine turn order
				var order = determine_turn_order([tduel.TEAM_1, tduel.TEAM_2], users);
				tduel.turn_order = order[1];
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
					var new_turn_msg = turn_message(tduel, users);
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



//attack functions
function calc_damage(skill, user, target){
	
	//determine stats of the skill
	var effect = skill.effect;
	var target_stats = skill.target_stats;
	var skill_power = skill.skill_power;
	var elemental_type = skill.elemental_type;
	
	//user stats
	var user_stats = user.jrpg_data.character.combat_stats;
	//target stats
	var skill_target = target.jrpg_data.character.combat_stats;
	
	//determine total stats into abiltity
	var total_power = 0;
	for(var i = 0; i < target_stats.length; i++){
		total_power += user_stats[target_stats[i]]*(skill_power/100)
	};
	
	//reduce damage based on defense type
	var target_defense_stat = null;
	if(effect == "PHYSICAL"){
		target_defense_stat = skill_target.defence;
	}else if(effect == "MAGIC"){
		target_defense_stat = skill_target.faith;
	}
	
	var base_damage = total_power;
	var target_defense = base_damage*((100-(Math.pow(150,2)/(target_defense_stat+225)))/100)+target_defense_stat/4;
	
	//first damage
	var first_damage = base_damage - target_defense;
	//damage after resistances
	var second_damage = first_damage
	if(elemental_type != null){
		second_damage = first_damage-(target.jrpg_data.character.elemental_resistances[elemental_type]*second_damage)
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
	var user_stats = user.jrpg_data.character.combat_stats;
	//target stats
	var skill_target = target.jrpg_data.character.combat_stats;
	//determine total stats into abiltity
	var total_power = 0;
	for(var i = 0; i < target_stats.length; i++){
		total_power += user_stats[target_stats[i]]*(skill_power/100)
	};
	var base_heal = total_power;
	var second_heal = total_power;
	//if you are resistant to an element, you are healed for less by that element
	if(elemental_type != null){
		second_heal = total_power-(target.jrpg_data.character.elemental_resistances[elemental_type]*total_power)
	};
	var final_heal = second_heal;
	return final_heal
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//HIT HANDLE/////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//single_heal_handle
function single_heal_handle(skill, user, target, weaken){
	var user_character = user.jrpg_data.character;
	var target_character = target.jrpg_data.character;
	var target_eva = target.jrpg_data.character.combat_stats.evasion;
	var return_text = "";
	//no miss or fail chance but crit chance
	//calculate heal amount
	var this_heal = Math.floor(calc_heal(skill, user, target)*(weaken/100));
	//can't heal dead things
	if(target_character.primary_stats.hp > 0){
		//calculate critical hits
		var user_crit = user.jrpg_data.character.combat_stats.critical;
		var bonus_crit = user_crit-target_eva;
		if(bonus_crit < 0){
			bonus_crit = 0
		};
		//1% base crit
		var crit_chance = 1+bonus_crit;
		if(Math.floor(Math.random() * Math.floor(100))<crit_chance){
			//critical heal
			//critical heal strength
			var critical_damage = 125+user.jrpg_data.character.combat_stats.critical_damage-target_eva;
			if(critical_damage < 125){
				critical_damage = 125;
			};
			this_heal *= (critical_damage/100);
			this_heal = Math.floor(this_heal);
			
			return_text += "```css\n"+user_character.primary_stats.name+" cast ["+skill.skill_name+"] at "+target_character.primary_stats.name+" and critically healed for "+this_heal+"!\n```"
		}
		else{
			return_text += "```css\n"+user_character.primary_stats.name+" cast ["+skill.skill_name+"] at "+target_character.primary_stats.name+" and healed for "+this_heal+"!\n```"
		}
		//heal target
		if(target_character.primary_stats.hp + this_heal > target_character.combat_stats.max_hp){
			target_character.primary_stats.hp = target_character.combat_stats.max_hp;
		}else{
			target_character.primary_stats.hp += this_heal;
		}
	}else{
		return_text += "```css\n"+user_character.primary_stats.name+" cast ["+skill.skill_name+"] at "+target_character.primary_stats.name+" but failed!\n```"
	};
	return return_text
};



//single_hit_handle
function single_hit_handle(skill, user, target, weaken){
	var user_character = user.jrpg_data.character;
	var target_character = target.jrpg_data.character;
	var return_text = "";
	var user_hit = user.jrpg_data.character.combat_stats.hit;
	var target_eva = target.jrpg_data.character.combat_stats.evasion;
	//calculate hit or miss
	//hit chance 90% base hit
	var hit_chance = 90+user_hit-target_eva;
	if(Math.floor(Math.random() * Math.floor(100))<hit_chance){
		//hit
		//calculate attack damage
		var this_attack = Math.floor(calc_damage(skill, user, target)*(weaken/100));
		//calculate critical hits
		var user_crit = user.jrpg_data.character.combat_stats.critical;
		var bonus_crit = user_crit-target_eva;
		if(bonus_crit < 0){
			bonus_crit = 0
		};
		//1% base crit
		var crit_chance = 1+bonus_crit;
		if(Math.floor(Math.random() * Math.floor(100))<crit_chance){
			//critical strike
			//critical strength
			var critical_damage = 125+user.jrpg_data.character.combat_stats.critical_damage-target_eva;
			if(critical_damage < 125){
				critical_damage = 125;
			};
			this_attack *= (critical_damage/100);
			this_attack = Math.floor(this_attack);
			if(skill.name == "attack"){
				return_text += "```css\n"+user_character.primary_stats.name+" attacked "+target_character.primary_stats.name+" and critically striked for "+this_attack+"!\n```"
			}else{
				return_text += "```css\n"+user_character.primary_stats.name+" cast ["+skill.skill_name+"] at "+target_character.primary_stats.name+" and critically striked for "+this_attack+"!\n```"
			}
		}
		else{
			//regular hit
			if(skill.name == "attack"){
				return_text += "```css\n"+user_character.primary_stats.name+" attacked "+target_character.primary_stats.name+" for "+this_attack+"!\n```"
			}else{
				return_text += "```css\n"+user_character.primary_stats.name+" cast ["+skill.skill_name+"] at "+target_character.primary_stats.name+" for "+this_attack+"!\n```"
			}
		}
		//damage target
		if(target_character.primary_stats.hp - this_attack < 0){
			target_character.primary_stats.hp = 0;
		}else{
			target_character.primary_stats.hp -= this_attack;
		}
	}
	else{
		//miss
		if(skill.name == "attack"){
			return_text += "```css\n"+user_character.primary_stats.name+" attacked "+target_character.primary_stats.name+", but "+user_character.primary_stats.name+" missed!\n```"
		}else{
			return_text += "```css\n"+user_character.primary_stats.name+" cast ["+skill.skill_name+"] at "+target_character.primary_stats.name+", but "+user_character.primary_stats.name+" missed!\n```"
		}
	
	}
	return return_text
};



//use_skill
function use_skill(user, target, skill, users){
	//find the users character
	var user_character = user.jrpg_data.character;
	var target_character = target.jrpg_data.character;
	//do two attacks if the user dual wields, otherwise execute one attack only
	var weak = 100;
	if((user_character.equipment.left_hand != null)&&(user_character.equipment.right_hand != null)){
		//if a weapon in both hands
		if((user_character.equipment.left_hand.type == 'weapon')&&(user_character.equipment.right_hand.type == 'weapon')){
			//execute double attack
		}else{
			//execute single attack
		}
	}else{
		//execute single attack
		var return_text = "";
		//check mana
		var user_mp = user_character.primary_stats.mp;
		var mp_cost = skill.mp_cost;
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
				for(key in parties){
					if(parties[key].members.includes(target.id)){
						target_party = parties[key]
					}
				}
				//for each member in the target party
				for(var m = 0; m < target_party.members.length; m++){
					var target_member = users[target_party.members[m]];
					var attack = single_hit_handle(skill, user, target_member, weak);
					return_text = return_text+attack;
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
		return return_text
	}
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
		var item = generate_equipable(keys[random_key], store.tier, id);
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



//check location
function check_location(user, premise){
	//target location
	var this_location = null;
	if(user.jrpg_data.user_location in towns_list){
		this_location = [user.jrpg_data.user_location];
		//check if the premise exists
		if(towns_list[user.jrpg_data.user_location][premise] != undefined){
			this_location.push(premise)
		}
	}
	return this_location
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
//FORMATT INFO//////////////////////////////////////////////////////////////////////////////////////////////////////////////
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
function fromatt_skills(object){
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
		return_text+="```";
	}
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
					var target_id = mention.substring(mention.lastIndexOf("<@") + 2, mention.lastIndexOf(">"));
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
					var target_id = mention.substring(mention.lastIndexOf("<@") + 2, mention.lastIndexOf(">"));
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
					return fromatt_skills(display_chr)
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
						parties[party_name] = new party(party_name, author);
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
					if(author == p.party_leader){
						//check if the party still has spaces
						if(p.members.length < p.max_size){
							//add invite to invites if target exists
							var mention = msg_parts[1];
							var target_id = mention.substring(mention.lastIndexOf("<@") + 2, mention.lastIndexOf(">"));
							console.log(target_id);
							//test if target is in user_data
							if(target_id in users){
								//test for character can't use try because user objects create with null character and we cant use instanceof because the data is loaded from a json
								if(users[target_id]['jrpg_data']['character'].hasOwnProperty('primary_stats')){
									p.invites.push(target_id);
									return "<**"+users[author].name+"** has invited **"+users[target_id].name+"** to the party **"+ p.name+"**>"
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
										ft_party.members.push(author);
										//remove from invites
										remove_from_array(ft_party.invites, author)
										return "<**"+users[author].name+"** has joined the party **"+ft_party.name+"**>"
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
						if(t_party.members.includes(author)){
							//remove from party
							remove_from_array(p.members, author);
							//if the member is a leader disband party
							if(author == p.party_leader){
								//remove party from list of parties
								var pName = String(p.name);
								delete parties[p.name];
								return "<**"+pName+"** was disbanded>"
							}else{
								return "<**"+users[author].name+"** left the party **"+p.name+"**>"
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
					if(author == p.party_leader){
						var mention = msg_parts[1];
						var target = mention.substring(mention.lastIndexOf("<@") + 2, mention.lastIndexOf(">"))
						//if the person you are kicking exists
						if(p.members.includes(target)){
							//if kicking self
							if(target != author){
								//kick target
								remove_from_array(p.members, target);
								return "<**"+users[target].name+"** was removed from **"+p.name+"**>"
							}else{
								return "<you cannot kick yourself>"
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
					if(author == p.party_leader){
						//check if the opposing party exists
						var duel_target = msg_parts[1];
						if(duel_target in parties){
							//check if the other party is already in a duel
							if(parties[duel_target].in_combat == true){
								return "<the party you requested a duel with is already in a battle>"
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
					if(author == p.party_leader){
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
					if(author == p.party_leader){
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
					if(author == p.party_leader){
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
								var target = mention.substring(mention.lastIndexOf("<@") + 2, mention.lastIndexOf(">"))
								//create a list of combatants
								var combatants = parties[this_battle.TEAM_1].members.concat(parties[this_battle.TEAM_2].members);
								//check if it is currently this users turn
								if(this_battle.turn_order.length > 0){
									if(this_battle.turn_order[0] == author){
										//if the target is in the list of targets
										if(combatants.includes(target)){
											//execute attack
											var basic_attack = skills_list.basic_attack;
											var this_attack = use_skill(users[author], users[target], basic_attack, users);
											//remove user from list of turn order
											remove_from_array(this_battle.turn_order, author);
											//msg to server
											return this_attack
										}else{
											return "<that target is not in the current battle>"
										}
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
								var target = mention.substring(mention.lastIndexOf("<@") + 2, mention.lastIndexOf(">"))
								//create a list of combatants
								var combatants = parties[this_battle.TEAM_1].members.concat(parties[this_battle.TEAM_2].members);
								//check if it is currently this users turn
								if(this_battle.turn_order.length > 0){
									if(this_battle.turn_order[0] == author){
										//if the target is in the list of targets
										if(combatants.includes(target)){
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
													var this_attack = use_skill(users[author], users[target], this_skill, users);
													//move turn
													remove_from_array(this_battle.turn_order, author);
													//msg to server
													return this_attack
												}else{
													return "<you do not know that skill>"
												}
											}else{
												return "<that skill does not exist>"
											}
										}else{
											return "<that target is not in the current battle>"
										}
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
				2. EQUIP ITEMS
				3. UNEQUIP ITEMS
				4. INSPECT ITEMS
			*/
			//check inventory of others
			else if((msg_parts[0] == jrpg_commands['check_inventory'])&&(msg_parts.length == 3)){
				//target
				var inventory_c = msg_parts[1];
				var target = inventory_c.substring(inventory_c.lastIndexOf("<@") + 2, inventory_c.lastIndexOf(">"));
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
					if(inventory_c == "list"){
						var page = msg_parts[2];
						//display inventory
						var inventory_display = formatt_inventory(users[author], page);
						return inventory_display
					}
					//inspect item in self inventory
					else if(inventory_c == "inspect"){
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
								if(trader_c == "list"){
									//list stock of the trader
									var page = msg_parts[2];
									var display_shop = formatt_shop(towns_list[l[0]], towns_list[l[0]][l[1]], page, "TRADER");
									return display_shop
								}
								else if(trader_c == "inspect"){
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
								else if(trader_c == "buy"){
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
								else if(trader_c == "sell"){
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
		};
		//if everything fails
		return "NILL"
	}
};
