/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ABI BOT VERSION 0.1////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//                                        ___   _      _  ______  _____  _   
//                                       / _ \ | |    (_) | ___ \|  _  || |  
//                                      / /_\ \| |__   _  | |_/ /| |/' || |_ 
//                                      |  _  || '_ \ | | | ___ \|  /| || __|
//                                      | | | || |_) || | | |_/ /\ |_/ /| |_ 
//                                      \_| |_/|_.__/ |_| \____/  \___/  \__|
//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//REQURIED LIBARIES//////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*Add discord.js*/
const Discord = require('discord.js');
const client = new Discord.Client();
const Canvas = require('canvas');
require('dotenv').config();



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//SETTINGS///////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*Command Prefix*/

const cmdPrefix = '/';

/*Commands*/

const bot_commands = {
	currency_check : 'balance',
}

/*Bot's Token*/

var token = process.env.TOKEN;

/*Settings*/

const enable_currency = true;
var currency_name = "Token";
var currency_name_plural = "Tokens";
const pluralize = true;
const experimental_features = true;

/*External Modules*/
const jrpg_module = require('./bot_modules/jrpg_module.js');  

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BOT STATS///////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*Bot's Status*/

var playingGame = {name: cmdPrefix};//displays discord status

var startup = 0;//makes sure we only return one id for the bot

var botID = null;//we will find bot's id from the first chat message it sends

/*this object is the bot object*/
var bot = {
    name : 'Abi Bot',
    version : '0.1',
	personality : 1,
};

var personalities = {
	1 : {
		general_responses : [
		"Yes USER?",
		"What is it USER?",
		"How can I help?",
		],
		currency_check_responses : [
		"USER, you have AMOUNT CURRENCY.",
		]
	},
	2 : {
		general_responses : [
		"Hey USER.",
		"Sup b.",
		"Sup.",
		"Sup USER.",
		"Why tho?."
		],
		currency_check_responses : [
		"USER, you have AMOUNT CURRENCY.",
		]
	},
	3 : {
		general_responses : [
		"UMU",
		"UWU",
		"oWo",
		"OWO",
		"OwO",
		"umu",
		"uMu",
		">W<",
		"Owo",
		"owO",
		],
		currency_check_responses : [
		"UMU USER, you have AMOUNT CURRENCY.",
		]
	},
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//USER DATA//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var user_data = {}

const file_system = require('fs');
const path = require('path');

const save_dir = "./user_data";

//add user adds new users to user_data to be saved
var addUser = function (userID, username) {
    user_data[userID] = {
		id : userID,
		name : username,
		currency : 1000,
		//jrpg data
		jrpg_data : {
			character : null,
			inventory : {},
			currencies : {},
			user_location : "New_Coevorden",
			user_position : {
				x : 25,
				y : 105,
			}
		},
	};
};



//save user data
function save_user_data(id){
	//writeable stream
	if(id in user_data){
		var new_save_dir = save_dir+"/"+id+".json";
		//create new writeable stream
		let writer = file_system.createWriteStream(new_save_dir).on('error', function (err) {
		console.log(err)
		});
		//grab json
		var json = JSON.stringify(user_data[id]);
		//write json data
		writer.write(json);
	};
};



function load_json() {
	//gather output
	const files = file_system.readdirSync("./user_data");
	//load
	if(files.length > 0){
		for(var i = 0; i < files.length; i++){
			const dir = save_dir+"/"+files[i];
			//read file
			file_system.readFile(dir, 'utf8', function (err, data){
				if (err){
					console.log(err);
				} else {
					console.log("loading ("+dir+")");
					parsed_data = null
					try {
						parsed_data = JSON.parse(data);
					} catch(err) {
						console.log(err);
					};
					if (parsed_data != null){
						user_data[parsed_data.id] = parsed_data;
						//information for console
						console.log("loaded ("+dir+")");
					}else{
						console.log("FAIL : an error occured while attempting to load data. ("+dir+")");
					};
				}
			});
		};
	};
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//UI DATA////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



var ui_messages = {}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//SETTING UP THE BOT/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

//load data
load_json();


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//GENERAL FUNCTIONS//////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



function pickRandomFromArray(array){
	var pick = array[Math.floor(Math.random() * array.length)];
	return pick
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//REACTION FUNCTIONS/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const reactions_list = ['❎','◀️','▶️','0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
const time_limit = 75000;

//collector for reactions
function create_Collector(message, key) {
	//create reaction collector
	//filter includes the id of the only person who can interact with the ui
	const filter = (reaction, user) => (!user.bot) && (user.id === ui_messages[key].ui_owner) && (reactions_list.includes(reaction.emoji.name));
	const collector = message.createReactionCollector(filter,{time:time_limit});
	//collector functions
	collector.on('collect', r_msg => {
		//logic goes here r_msg.emoji
		if(r_msg,ui_messages[key] != undefined){
			//logic function
			jrpg_module.jrpg_ui_logic(r_msg,ui_messages[key],user_data);
		}else{
			collector.stop()
		};
	});
	collector.on('end', collected => {
		//message.reactions.removeAll().catch(error => console.error(error));
		delete ui_messages[key];
	});
};

//reaciton menus
//no callback needed
async function reaction_uis(){
	for(var key in ui_messages){
		const this_key = key.slice();
		if(ui_messages[this_key].is_linked == false){
			ui_messages[this_key].is_linked = true
			//first time emojis before logic and base template for each ui
			if(ui_messages[this_key].ui_type == "battle_ui"){
				const new_msg =  await ui_messages[this_key].channel.send("```css\n1 : ATTACK\n2 : SKILL\n3 : DEFEND\n4 : ITEM```")
				try{
					await new_msg.react('1️⃣');
					await new_msg.react('2️⃣');
					await new_msg.react('3️⃣');
					await new_msg.react('4️⃣');
					create_Collector(new_msg, this_key);
					ui_messages[this_key].message = new_msg;
					new_msg.delete({ timeout: time_limit })
				}catch(err){
					throw err
				};
				//initial reactions
				/*
					msg.react returns a msgreaction
					msg reaciton has property msg is no longer the original message
				*/
				//.then(msg => msg.react('1️⃣'))
				//.then(msgReaction => msgReaction.message.react('2️⃣'))
				//.then(msgReaction => msgReaction.message.react('3️⃣'))
				//.then(msgReaction => msgReaction.message.react('4️⃣'))
				//links the collector and message
				/*
					no more returns past this point thus no more chaining reactions
				*/
				//.then(msgReaction => {create_Collector(msgReaction.message, key); ui_messages[key].message = msgReaction.message})
				//.catch(console.error)
			};
		};
	};
};



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BOT FUNCTIONS//////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



//BOT COMMANDS
function command_response(command, user){
	var cmd_rsp = '';
	//grab bot personality responses
	var possible_responses = personalities[bot['personality']];
	//find user
	var found_user = null;
	try {
		found_user = user_data[user.id]
	} catch (err) {
		console.log(err)
	return
	};
	console.log(user);
	if (found_user == null) {
		return "An error has occured."
	};
	//deal with responses
	if (command == 'balance') {
		responses = possible_responses['currency_check_responses'];
		//great and efficient random from array https://stackoverflow.com/questions/4550505/getting-a-random-value-from-a-javascript-array
		var picked_response = pickRandomFromArray(responses);
		picked_response = picked_response.replace("USER", "**"+user.username+"**");
		picked_response = picked_response.replace("AMOUNT", "**"+found_user['currency']+"**");
		//console.log(picked_response);
		//pluralize currency if yes
		if (pluralize == true){
			if (found_user['currency'] > 1){
				picked_response = picked_response.replace("CURRENCY", "**"+currency_name_plural+"**");
			} else {
				picked_response = picked_response.replace("CURRENCY", "**"+currency_name+"**");
			}
		}else{
			picked_response = picked_response.replace("CURRENCY", "**"+currency_name+"**");
		};
		cmd_rsp = picked_response;
	};
	return cmd_rsp
};



//PRIMARY BOT RESPONSE
function bot_response(msg_content, user) {
	console.log(user);
	//primary msg that will be returned
	var response = '';
	//check if there was a command issued
	var cmd_issued = false;
	for (var key in bot_commands) {
		if (bot_commands.hasOwnProperty(key)) {
			var botcmd = bot_commands[key];
			var cmd_string = cmdPrefix + " " + botcmd;
			var mention_string = "<@" + botID + ">" + " " + botcmd;
			//if the msg is a bot cmd
			if ((msg_content == cmd_string)||(msg_content == mention_string)) {
				cmd_issued = true;
				response = command_response(botcmd, user)
			};
		};
	};
	//return response no cmd
	if (cmd_issued == false) {
		var possible_responses = personalities[bot['personality']];
		responses = possible_responses['general_responses'];
		response = pickRandomFromArray(responses);
		response = response.replace("USER", "**"+user.username+"**");
	};
	//return response and error
	if (response == ''){
		response = "An error has occured."
	};
	return response
};



//EVENT LISTENER FOR TEXT
client.on('message', message=> {
    //log chat
    console.log(message.author.username + ": " + message.content);
    //set up mention string
    //start up message
    var startupmsg = bot.name + ' version ' + bot.version + ' first start sequence.';
    //check if started up
    if (startup == 0) {
        startup++;
        //send startup message
        message.channel.send(startupmsg);
    }
    //reply to messages
    if ((message.content.indexOf(cmdPrefix) >= 0 || message.content.indexOf("<@" + botID + ">") >= 0)&&(startup != 0)) {
        var authorOfMessage = message.author.username;
        var user = message.author;
		//sends message from bot response function
		if(user.id != botID){
			message.channel.send(bot_response(message.content, user));
		};
    }
    //set up the bot's id
    if ((message.content == startupmsg)&&(startup != 0)) {
        botID = message.author;
        console.log('Bot ID set! ' + botID);
        //message.channel.send("Bot ID set to " + botID.mention);
    }
	//add new users to list
	if ((message.content != startupmsg)&&(startup != 0)) {
		//user id
		var u_id = message.author.id;
		//add new userdata if it is a new user
		if (user_data.hasOwnProperty(u_id)) {
			//jprg module functions
			var msg_content = message.content
			var jrpg_bot_message = jrpg_module.jrpg_main(msg_content,message.author.id,user_data)
			var jrpg_bot_combat_message = jrpg_module.jrpg_combat(msg_content,message.author.id,user_data)
			//send bot message
			if (jrpg_bot_message != "NILL"){
				message.channel.send(jrpg_bot_message);
			};
			if (jrpg_bot_combat_message != "NILL"){
				message.channel.send(jrpg_bot_combat_message);
			};
		}else{
			addUser(message.author.id, message.author.username)
		};
		//save user data
		save_user_data(u_id)
	}
})

//EVENT LISTENER FOR UI
client.on('message', async message=> {
	if(startup != 0){
		//user id
		var u_id = message.author.id;
		if(experimental_features == true){
			//run ui commands
			var msg_content = message.content
			var jrpg_bot_ui_run = await jrpg_module.jrpg_ui_main(msg_content,message.author.id,client,user_data)
			//experimental combat features
			if(jrpg_bot_ui_run != null){
				if(typeof jrpg_bot_ui_run === 'string'){
					//text return
					message.channel.send(jrpg_bot_ui_run);
				}else{
					//image return
					try {
						//visual ui component
						const canvas_obj = await jrpg_bot_ui_run[0];
						const visual = new Discord.MessageAttachment(canvas_obj.toBuffer(), 'jrpg_ui_element.png');
						const sent_visual = await message.channel.send(visual);
						//timeout for visual component
						sent_visual.delete({ timeout: 80000 })
						message.delete({ timeout: 10000 })
						//active ui request
						jrpg_bot_ui_run[1].channel = message.channel;
						ui_messages[jrpg_bot_ui_run[1].ui_id] = jrpg_bot_ui_run[1];
					} catch (err) {
						console.log(err)
					}
				};
			};
		};
	};
})

//refresh rate for ui management
setInterval(reaction_uis, 3000);

//connect the bot
client.login(token);

