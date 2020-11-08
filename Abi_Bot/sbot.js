/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//ABI BOT VERSION 0.1 RUNS OFF OF DISCORDIE BOT CODE WRITTEN MY ERIC///////////////////////////////////////////////////
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

/*Add Discordie*/

var Discordie = require('discordie'); //use the command 'npm install discordie' in your shell. Requires node.js


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//SETTINGS///////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*Bot's Token*/

var token = 'MzQxNDMyODk2NDM2OTYxMjgx.DGDZfw.riCkMA8eNeXYq8HIztx-YYVGGGU';

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BOT STATS///////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*Bot's Status*/

var playingGame = {name: "song bot mode"};//displays discord status

var startup = 0;//makes sure we only return one id for the bot

var botID = null;//we will find bot's id from the first chat message it sends

/*this object is the bot object*/
var bot = {
    name : 'Abi Bot',
    version : '0.1',
	personality : 1,
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//SONGS//////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var song_settings = {
	started : false,
	song : null,
	line : 0,
	word : 0,
};



function text_similiarity(input, original){
	var similiarity = 0;
	//first we split things by word order
	var aInput = input.toLowerCase().split(" ");
	var aOriginal = original.toLowerCase().split(" ");
	for(var i=0; i<aInput.length; i++){
		if(aOriginal[i] != undefined){
			//do letter by letter matching
			var l_sim = 0;
			for(var z=0; z<aInput[i].length; z++){
				input_char = aInput[i].charAt(z);
				org_char = aOriginal[i].charAt(z);
				if(input_char == org_char){
					l_sim += 1
				};
			};
			//if letters match more than 50% we say the word matches
			const threshold = Number(aOriginal[i].length/2);
			if(l_sim >= threshold){
				similiarity += 1
			};
		}
	};
	similiarity = Math.round(similiarity/aOriginal.length*100)
	return similiarity
}



function bot_response(msg_content, user) {
	//lower case what the user said
	var input = msg_content.toLowerCase();
	//primary msg that will be returned
	var response = '';
	//check if a song is already started
	if(song_settings.started == false){
		for(key in songs){
			//find the first line
			for(var i = 0; i < songs[key].length; i++){
				var song_line_text = songs[key][i].toLowerCase();
				if(text_similiarity(input, song_line_text) > 50){
					//found the starting position
					song_settings.line = i;
					song_settings.word = 0;
					song_settings.song = key;
					song_settings.started = true;
					//respond with line
					if(songs[key][i+1] != undefined){
						response = songs[key][i+1]
						//set previous line
						song_settings.line = i+1
					};
					return response
				}
			}
		}
	}else if(song_settings.started == true){
		//if there is a song selected
		if(song_settings.song in songs){
			//find line
			var previous_line = Number(song_settings.line);
			for(var i = Number(previous_line); i < songs[song_settings.song].length; i++){
				var song_line_text = songs[key][i].toLowerCase();
				if(text_similiarity(input, song_line_text) > 50){
					if((i-previous_line) > 1||(i-previous_line) < 0){
						//wrong line retard
						response = "Baka! That's the wrong line!"
					}else{
						if(songs[key][i+1] != undefined){
							//right line lets say it
							response = songs[key][i+1]
							//set previous line
							song_settings.line = i+1
							break
						}else{
							response = "Yay! We did it!"
							//reset bot
							song_settings.line = 0;
							song_settings.word = 0;
							song_settings.song = null;
							song_settings.started = false;
							break
						}
					}
				}else if(text_similiarity(input, song_line_text) > 25){
					response = "You really suck at this you know?"
				}else{
					if(songs[key][i+1] != undefined){
						response = "Baka! It's: "+songs[key][i+1]
					}else{
						response = "Baka!"
					}
				}
			};
		}
	};
	return response
};



var songs = {
	"NEVER_GONNA_GIVE_YOU_UP" : [
		"We're no strangers to love",
		"You know the rules and so do I",
		"A full commitment's what I'm thinking of",
		"You wouldn't get this from any other guy",
		"I just wanna tell you how I'm feeling",
		"Gotta make you understand",
		"Never gonna give you up",
		"Never gonna let you down",
		"Never gonna run around and desert you",
		"Never gonna make you cry",
		"Never gonna say goodbye",
		"Never gonna tell a lie and hurt you",
		"We've known each other for so long",
		"Your heart's been aching but you're too shy to say it",
		"Inside we both know what's been going on",
		"We know the game and we're gonna play it",
		"And if you ask me how I'm feeling",
		"Don't tell me you're too blind to see",
		"Never gonna give you up",
		"Never gonna let you down",
		"Never gonna run around and desert you",
		"Never gonna make you cry",
		"Never gonna say goodbye",
		"Never gonna tell a lie and hurt you",
		"Never gonna give you up",
		"Never gonna let you down",
		"Never gonna run around and desert you",
		"Never gonna make you cry",
		"Never gonna say goodbye",
		"Never gonna tell a lie and hurt you",
		"Never gonna give, never gonna give",
		"Give you up",
		"Never gonna give, never gonna give",
		"Give you up",
		"We've known each other for so long",
		"Your heart's been aching but you're too shy to say it",
		"Inside we both know what's been going on",
		"We know the game and we're gonna play it",
		"I just wanna tell you how I'm feeling",
		"Gotta make you understand",
		"Never gonna give you up",
		"Never gonna let you down",
		"Never gonna run around and desert you",
		"Never gonna make you cry",
		"Never gonna say goodbye",
		"Never gonna tell a lie and hurt you",
		"Never gonna give you up",
		"Never gonna let you down",
		"Never gonna run around and desert you",
		"Never gonna make you cry",
		"Never gonna say goodbye",
		"Never gonna tell a lie and hurt you",
		"Never gonna give you up",
		"Never gonna let you down",
		"Never gonna run around and desert you",
		"Never gonna make you cry"
	],
	"ALL_STAR" : [
		"Somebody once told me the world is gonna roll me",
		"I ain't the sharpest tool in the shed",
		"She was looking kind of dumb with her finger and her thumb",
		"In the shape of an L on her forehead",
		"Well the years start coming and they don't stop coming",
		"Fed to the rules and I hit the ground running",
		"Didn't make sense not to live for fun",
		"Your brain gets smart but your head gets dumb",
		"So much to do, so much to see",
		"So what's wrong with taking the back streets?",
		"You'll never know if you don't go",
		"You'll never shine if you don't glow",
		"Hey now, you're an all-star, get your game on, go play",
		"Hey now, you're a rock star, get the show on, get paid",
		"And all that glitters is gold",
		"Only shooting stars break the mold",
		"It's a cool place and they say it gets colder",
		"You're bundled up now, wait till you get older",
		"But the meteor men beg to differ",
		"Judging by the hole in the satellite picture",
		"The ice we skate is getting pretty thin",
		"The water's getting warm so you might as well swim",
		"My world's on fire, how about yours?",
		"That's the way I like it and I never get bored",
		"Hey now, you're an all-star, get your game on, go play",
		"Hey now, you're a rock star, get the show on, get paid",
		"All that glitters is gold",
		"Only shooting stars break the mold",
		"Hey now, you're an all-star, get your game on, go play",
		"Hey now, you're a rock star, get the show, on get paid",
		"And all that glitters is gold",
		"Only shooting stars",
		"Somebody once asked could I spare some change for gas?",
		"I need to get myself away from this place",
		"I said yep what a concept",
		"I could use a little fuel myself",
		"And we could all use a little change",
		"Well, the years start coming and they don't stop coming",
		"Fed to the rules and I hit the ground running",
		"Didn't make sense not to live for fun",
		"Your brain gets smart but your head gets dumb",
		"So much to do, so much to see",
		"So what's wrong with taking the back streets?",
		"You'll never know if you don't go (go!)",
		"You'll never shine if you don't glow",
		"Hey now, you're an all-star, get your game on, go play",
		"Hey now, you're a rock star, get the show on, get paid",
		"And all that glitters is gold",
		"Only shooting stars break the mold",
		"And all that glitters is gold",
		"Only shooting stars break the mold"
	],
	"REVENGE" : [
		"Creeper, oh man",
		"So we back in the mine, got our pick axe swinging from side to side",
		"Side, side to side",
		"This task a grueling one",
		"Hope to find some diamonds tonight, night, night",
		"Diamonds tonight",
		"Heads up, you hear a sound",
		"Turn around and look up, total shock fills your body",
		"Oh no it's you again",
		"I could never forget those eyes, eyes, eyes",
		"Eyes, eyes, eyes",
		"'Cause baby tonight",
		"The creeper's trying to steal all our stuff again",
		"'Cause baby tonight, you grab your pick, shovel and bolt again",
		"And run, run until it's done, done",
		"Until the sun comes up in the morn'",
		"'Cause baby tonight, the creeper's trying to steal all our stuff again",
		"Just when you think you're safe",
		"Overhear some hissing from right behind",
		"Right, right behind",
		"That's a nice life you have",
		"Shame it's gotta end at this time, time, time",
		"Time, time, time, time",
		"Blows up, then your health bar drops",
		"You could use a 1-up, get inside don't be tardy",
		"So now you're stuck in there",
		"Half a heart is left but don't die, die, die",
		"Die, die, die, die",
		"'Cause baby tonight",
		"The creeper's trying to steal all your stuff again",
		"'Cause baby tonight, you grab your pick, shovel and bolt again",
		"And run, run until it's done, done",
		"Until the sun comes up in the morn'",
		"'Cause baby tonight",
		"The creeper's trying to steal all your stuff again",
		"Creepers, you're mine",
		"Dig up diamonds, and craft those diamonds and make some armor",
		"Get it baby, go and forge that like you so, MLG pro",
		"The sword's made of diamonds, so come at me bro",
		"Training in your room under the torch light",
		"Hone that form to get you ready for the big fight",
		"Every single day and the whole night",
		"Creeper's out prowlin' - alright",
		"Look at me, look at you",
		"Take my revenge that's what I'm gonna do",
		"I'm a warrior baby, what else is new",
		"And my blade's gonna tear through you",
		"Bring it",
		"'Cause baby tonight",
		"The creeper's trying to steal all our stuff again",
		"Yeah baby tonight, grab your sword, armor and gold, take your revenge",
		"So fight, fight like it's the last",
		"Last night of your life, life, show them your bite",
		"'Cause baby tonight",
		"The creeper's trying to steal all our stuff again",
		"'Cause baby tonight, you grab your pick, shovel and bolt again",
		"And run, run until it's done, done",
		"Until the sun comes up in the morn'",
		"'Cause baby tonight, the creepers tried to steal all our stuff again",
	]
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//LOGIN BOT//////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//all functions for bot are under client, documentation http://qeled.github.io/discordie/#/docs/Events?_k=mxeklq
const Events = Discordie.Events;//events such as when a user enters a chat message.
const client = new Discordie();//new bot

//connect the bot
client.connect({
    token: token
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//SETTING UP THE BOT/////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//set bot's status after connection-hopefully a connection
client.User.setStatus("online", playingGame);

//make sure the bots connected
client.Dispatcher.on(Events.GATEWAY_READY, e => {
    console.log('Connected as: ' + client.User.Username);
    console.log(bot.name + ' version ' + bot.version + ' launch sequence initiated. Awaiting chat.');
});

//debug command to see if the bot is connected
client.Dispatcher.on(Events.MESSAGE_CREATE, e => {
    if (e.message.content == 'PING') {
        e.message.channel.sendMessage(e.message.author.mention + ' PONG');
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//GENERAL FUNCTIONS//////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function pickRandomFromArray(array){
	var pick = array[Math.floor(Math.random() * array.length)];
	return pick
};

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BOT FUNCTIONS//////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//EVENT LISTNER
client.Dispatcher.on(Events.MESSAGE_CREATE, e=> {
    //log chat
    console.log(e.message.author.username + ": " + e.message.content);
    //set up mention string
    //start up message
    var startupmsg = bot.name + ' version ' + bot.version + ' first start sequence.';
    //check if started up
    if (startup == 0) {
        startup++;
        //send startup message
        e.message.channel.sendMessage(startupmsg);
    }
    //reply to messages
    if (startup != 0) {
        var authorOfMessage = e.message.author.username;
        var user = client.Users.find(u => u.username == authorOfMessage);
		//sends message from bot response function
		if(user.id != botID){
			var botr = bot_response(e.message.content, user);
			if(botr.length > 0){
				e.message.channel.sendMessage(botr);
			}
		};
    }
    //set up the bot's id
    if ((e.message.content == startupmsg)&&(startup != 0)) {
        botID = e.message.author;
        console.log('Bot ID set! ' + botID);
        //e.message.channel.sendMessage("Bot ID set to " + botID.mention);
    }
} )

