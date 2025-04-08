import { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } from "discord.js";
import OpenAI from "openai";
import sqlite3 from "sqlite3";
import dotenv from "dotenv";
import { REST, Routes } from "discord.js";

dotenv.config();
sqlite3.verbose();

const db = new sqlite3.Database("dishoftheweek.db");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
export { db };

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Create table for chatbot memory
db.run(`CREATE TABLE IF NOT EXISTS chatbot_memory (
  message_id TEXT PRIMARY KEY,
  user_id TEXT,
  bot_response TEXT
)`);

// Attempt to add the image_url column to dishes table
db.run(`ALTER TABLE dishes ADD COLUMN image_url TEXT`, (err) => {
  if (err) {
    console.log("Column may already exist or table cannot be altered.");
  } else {
    console.log("Column added successfully.");
  }
});

const commands = [
  {
    name: "help",
    description: "Shows the available commands",
  },
  {
    name: "setdish",
    description: "Set the dish of the week (Admin only)",
    options: [
      {
        name: "name",
        type: 3, // STRING
        description: "Name of the dish",
        required: true,
      },
      {
        name: "recipe",
        type: 3, // STRING
        description: "Recipe idea",
        required: true,
      },
      {
        name: "image",
        type: 11, // ATTACHMENT
        description: "Attach an image of the dish (optional)",
        required: false,
      },
    ],
  },
  {
    name: "currentdish",
    description: "View the current dish of the week",
  },
  {
    name: "participate",
    description: "Participate in the current Dish of the Week",
    options: [
      {
        name: "image",
        type: 11, // ATTACHMENT
        description: "Attach an image of your dish",
        required: false,
      },
    ],
  },
  {
    name: "deleteparticipation",
    description: "Delete a user's participation (Admin only)",
    options: [
      {
        name: "username",
        type: 3, // STRING
        description: "Username of the participant",
        required: true,
      },
      {
        name: "dish",
        type: 3, // STRING
        description: "Dish name",
        required: true,
      },
    ],
  },
  {
    name: "leaderboard",
    description: "View the top participants",
  },
];

const normalCommands = {
  hydrate: [
    "Time to hydrate, {target}! 💧 Stay refreshed! UwU",
    "Don't forget to drink some water, {target}! 💦 (＾▽＾)",
    "Grab that water bottle and take a sip, {target}! 💧 OwO",
  ],
  posture_check: [
    "Straighten that back, {target}! 💺 No more shrimping! UwU",
    "Tatowo reminds you to fix your posture, {target}! 🦐✨",
    "Posture check! Sit up straight, {target}! 💺 (・`ω´・)",
  ],
  stretch: [
    "Stretch it out, {target}! ✨ Time to wiggle those arms! (ﾉ◕ヮ◕)ﾉ*:･ﾟ✧",
    "Don't sit still too long, {target}! Time for a stretch! 💪 UwU",
    "Reach up high and stretch, {target}! 🧘‍♂️ (≧◡≦)",
  ],
  hug: [
    "*gives {target} a warm hug* 🤗 You deserve it! UwU",
    "*wraps arms around {target}* 💖 Sending cozy vibes. (っ＾▿＾)っ",
    "*gentle hug for {target}* 💗 Hope that made your day better. OwO",
  ],
  bonk: [
    "*BONK* 🔨 {target}, behave yourself! (≧ω≦)",
    "*taps {target}'s head* Bonk! No more chaos, okay? UwU",
    "*smacks {target} with a soft hammer* 🔨 OwO",
  ],
  pat: [
    "*pats {target}'s head* ✨ Good job today! UwU (＾▽＾)",
    "*soft pats on {target}'s head* 💖 You're doing great! (・ω・)",
    "*pat pat* There, there {target}. Keep going! OwO",
  ],
  snacc: [
    "*hands {target} a snack* 🍪 Take a break and enjoy! UwU",
    "*slides a cookie to {target}* 🍩 Don't forget to eat something sweet! (＾▽＾)",
    "*offers {target} a snack* 🍙 Fuel up and keep going! OwO",
  ],
  cuddle: [
    "*snuggles with {target}* 🐹💖 Cuddle time! UwU",
    "*wraps up in a blanket with {target}* 🛌 Cozy vibes only! (っ◕‿◕)っ",
    "*gentle cuddles for {target}* 💗 Hope you're feeling better now. OwO",
  ],
  lurk: [
    "{user} is going into lurk mode! 👀 Stay safe and see you soon! UwU",
    "{user} has gone stealth mode. 👻 Enjoy your lurk time! (＾▽＾)",
    "{user} is now lurking. 👀 I'll be here when you're back! OwO",
  ],
};

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}!`);
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

  try {
    console.log("📢 Registering slash commands...");
    const guilds = await client.guilds.fetch();
    for (const [guildId] of guilds) {
      try {
        await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commands });
        console.log(`✅ Commands registered in guild: ${guildId}`);
      } catch (error) {
        console.error(`❌ Error registering commands in guild ${guildId}:`, error);
      }
    }
    console.log("✅ All commands registered successfully!");
  } catch (error) {
    console.error("❌ Error registering slash commands:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName, options } = interaction;
  const displayName = interaction.user.globalName || interaction.user.username;

  try {
    if (commandName === "help") {
      const embed = new EmbedBuilder()
        .setTitle("📜 Help - Dish of the Week Bot")
        .setDescription("Here are the available commands for managing and participating in the Dish of the Week event:")
        .setColor("#2ECC71")
        .addFields(
          {
            name: "<a:chefSuperSpin:1339169749107474442> **What is the dish of the week challenge?**",
            value: "Each week, a new dish will be chosen for The Dish of the Week challenge. You have one week to cook it and share a photo to participate. Each valid submission earns you points, and at the end of the year, the top participant will receive a special care package from Tato!"
          },
          { name: "🍽️ **Menu Management**", value: "`/currentdish` - View the current dish and time remaining." },
          { name: "👨‍🍳 **Participation**", value: "`/participate` - Upload an image in the current challenge" },
          { name: "🏆 **Leaderboard**", value: "`/leaderboard` - View the top participants." },
          { name: "🤖 **Chatbot**", value: "Mention the bot (@Tatowo) to get a sad hamster chef's opinion" }
        )
        .setFooter({ text: "Happy Cooking! 🍳", iconURL: client.user.displayAvatarURL() });

      try {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error("Failed to reply to help command:", error);
      }
    }

		if (commandName === "setdish") {
		  if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
			return interaction.reply({ content: "❌ You do not have the necessary permissions to use this command.", ephemeral: true });
		  }
		  await interaction.deferReply();

		  const dish = options.getString("name");
		  const recipeIdea = options.getString("recipe");
		  const imageAttachment = options.getAttachment("image");
		  const imageUrl = imageAttachment ? imageAttachment.url : null;
		  const dateSet = new Date().toISOString();

		  db.run(
			`INSERT INTO dishes (name, date_set, recipe_idea, image_url) VALUES (?, ?, ?, ?)`,
			[dish, dateSet, recipeIdea, imageUrl || null],
			(err) => {
			  if (err) {
				console.error(err.message);
				return interaction.followUp({ content: "❌ Error setting the dish.", ephemeral: true });
			  } else {
				const embed = new EmbedBuilder()
				  .setTitle("🍽️ Dish of the Week!")
				  .setDescription(`**${dish}**\n📝 Recipe Idea: ${recipeIdea}`)
				  .setColor("#FFA500");

				if (imageUrl) {
				  embed.setImage(imageUrl);
				}
				return interaction.followUp({
				  embeds: [embed],
				  content: "`/participate` : Use this command to participate in the current challenge, requires an image to participate"
				});
			  }
			}
		  );
		}

		if (commandName === "currentdish") {
		  await interaction.deferReply();

		  db.get(`SELECT * FROM dishes ORDER BY date_set DESC LIMIT 1`, (err, row) => {
			if (err || !row) {
			  return interaction.followUp("❌ No dish of the week has been set yet.");
			}

			const timeSet = new Date(row.date_set);
			const timeLeft = 7 * 24 * 60 * 60 * 1000 - (Date.now() - timeSet.getTime());
			const daysLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)));

			const embed = new EmbedBuilder()
			  .setTitle(`🍽️ Dish of the Week: ${row.name}`)
			  .setDescription(
				`📝 Recipe Idea: ${row.recipe_idea}\n` +
				`⏳ Time Remaining: ${daysLeft} days\n\n` +
				"`/participate` : Use this command to participate in the current challenge, requires an image to participate"
			  )
			  .setColor("#FFA500");

			if (row.image_url) {
			  embed.setImage(row.image_url);
			}

			return interaction.followUp({ embeds: [embed] });
		  });
		}


    if (commandName === "participate") {
      await interaction.deferReply();

      db.get(`SELECT * FROM dishes ORDER BY date_set DESC LIMIT 1`, (err, row) => {
        if (err || !row) {
          return interaction.followUp("❌ No dish of the week has been set yet.");
        }

        const dishName = row.name;
        const userId = interaction.user.id;
        const userName = displayName;

        const attachment = options.getAttachment("image");
        if (!attachment) {
          return interaction.followUp("❌ You must provide an image attachment to participate.");
        }
        const finalImageUrl = attachment.url;

        db.get(`SELECT * FROM participations WHERE user_id = ? AND dish_name = ?`, [userId, dishName], (err, existingRow) => {
          if (existingRow) {
            const responses = [
              "⚠️ ff 20 (｡>﹏<) try again next week",
              "⚠️ you sweaty tryhard (•̀⤙•́) give other people a chance",
              "⚠️ you little cheater what do you think you are doing ( ｡ •`ᴖ´• ｡)",
              "⚠️ did you think we wouldn't catch you farming points??(ꐦ¬_¬) comeback next week noob",
              "⚠️ HEY IT'S DISH OF THE WEEK NOT 2 DISH PER WEEK ლ(ಠ益ಠლ)!!! Try again next week smh"
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            return interaction.followUp(randomResponse);
          }

          db.run(
            `INSERT INTO participations (user_id, user_name, dish_name, date, image_url) VALUES (?, ?, ?, ?, ?)`,
            [userId, userName, dishName, new Date().toISOString(), finalImageUrl],
            (err) => {
              if (err) {
                console.error(err.message);
                return interaction.followUp("❌ Error saving participation.");
              } else {
                const embed = new EmbedBuilder()
                  .setTitle(`✅ ${userName} has participated in **${dishName}**!`)
                  .setDescription(`<a:chefspin:1339169865616982101> Check out the dish!`)
                  .setImage(finalImageUrl)
                  .setColor("#2ECC71");
                return interaction.followUp({ embeds: [embed] });
              }
            }
          );
        });
      });
    }

    if (commandName === "deleteparticipation") {
      if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply({ content: "❌ You do not have the necessary permissions to use this command.", ephemeral: true });
      }
      await interaction.deferReply();

      const username = options.getString("username");
      const dish = options.getString("dish");

      if (!username || typeof username !== "string") {
        return interaction.followUp("❌ Please provide a valid username.");
      }
      if (!dish || typeof dish !== "string") {
        return interaction.followUp("❌ Please provide a valid dish name.");
      }

      db.run(
        `DELETE FROM participations WHERE LOWER(user_name) = ? AND dish_name = ?`,
        [username.toLowerCase(), dish],
        (err) => {
          if (err) {
            console.error(err.message);
            return interaction.followUp("❌ Error deleting participation.");
          } else {
            return interaction.followUp(`🗑️ Participation of **${username}** in **${dish}** has been yeeted.`);
          }
        }
      );
    }

    if (commandName === "leaderboard") {
      await interaction.deferReply();

      db.all(`SELECT user_name, COUNT(*) AS count FROM participations GROUP BY user_name ORDER BY count DESC LIMIT 10`, (err, rows) => {
        if (err || rows.length === 0) {
          return interaction.followUp("❌ No participations found.");
        }

        const leaderboard = rows.map((row, index) => `${index + 1}. **${row.user_name}** - ${row.count} nom`).join("\n");
        const embed = new EmbedBuilder()
          .setTitle("🏆 Leaderboard")
          .setDescription(leaderboard)
          .setColor("#FFD700");

        return interaction.followUp({ embeds: [embed] });
      });
    }
  } catch (error) {
    console.error("Interaction Error:", error);
    try {
      await interaction.reply("I ran into an issue, please try again later.");
    } catch (replyError) {
      console.error("Failed to send error message:", replyError);
    }
  }
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase();
  
  // Check if the bot was mentioned or if this is a reply to the bot
  const botMentioned = message.mentions.has(client.user.id);
  const isReplyToBot = message.reference && message.reference.messageId;
  
  // Handle bot mentions or replies
  if (botMentioned || isReplyToBot) {
    let context = null;
    
    // If replying to bot's message, get previous context
    if (isReplyToBot) {
      try {
        const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
        if (repliedMessage.author.id === client.user.id) {
          // Get context from database
          db.get(
            "SELECT bot_response FROM chatbot_memory WHERE message_id = ?", 
            [message.reference.messageId], 
            (err, row) => {
              if (!err && row) {
                context = row.bot_response;
              }
              generateResponse(message, context);
            }
          );
          return; // Return early as we're handling the response in the callback
        }
      } catch (error) {
        console.error("Error fetching replied message:", error);
      }
    }
    
    // Direct mention or failed to get context from reply
    if (botMentioned) {
      generateResponse(message, context);
      return;
    }
  }

  // Check for normal commands starting with "!"
  if (content.startsWith("!")) {
    const args = message.content.slice(1).trim().split(" ");
    let command = args.shift();

    if (args.length && !normalCommands[command]) {
      command = `${command}_${args.shift()}`;
    }

    const commandKey = command.replace(/\s+/g, "_");

    if (normalCommands[commandKey]) {
      const responses = normalCommands[commandKey];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const senderDisplayName = message.member ? message.member.displayName : message.author.username;
      let targetDisplayName = "someone";

      // Special handling for lurk command (self-only)
      if (commandKey === "lurk") {
        const finalResponse = randomResponse.replace(/{user}/g, senderDisplayName);
        const reply = `**${senderDisplayName}** is going into lurk mode! 👀\n${finalResponse}`;
        try {
          await message.channel.send(reply);
        } catch (error) {
          console.error("Send Message Error:", error);
        }
        return;
      }

      const mentionedUser = message.mentions.members?.first();
      if (mentionedUser) {
        targetDisplayName = mentionedUser.displayName;
      } else if (args.length) {
        targetDisplayName = args.join(" ");
      }

      const finalResponse = randomResponse.replace(/{target}/g, targetDisplayName);
      let reply;

      const selfOnlyCommands = ["lurk"];
      const actionCommands = ["hug", "bonk", "pat", "cuddle", "snacc"];
      const redemptionCommands = ["posture_check", "hydrate", "stretch"];

      if (selfOnlyCommands.includes(commandKey)) {
        const finalResponse = randomResponse.replace(/{user}/g, senderDisplayName);
        reply = `**${senderDisplayName}** is using **${commandKey.replace("_", " ")}**! 👀\n${finalResponse}`;
      } else if (actionCommands.includes(commandKey)) {
        reply = targetDisplayName !== "someone"
          ? `**${senderDisplayName}** ${commandKey.replace("_", " ")}ed **${targetDisplayName}**! ✨\n${finalResponse}`
          : `**${senderDisplayName}** ${commandKey.replace("_", " ")}ed someone! ✨\n${finalResponse}`;
      } else if (redemptionCommands.includes(commandKey)) {
        reply = targetDisplayName !== "someone"
          ? `**${senderDisplayName}** redeemed **${commandKey.replace("_", " ")}** for **${targetDisplayName}**! ✨\n${finalResponse}`
          : `**${senderDisplayName}** redeemed **${commandKey.replace("_", " ")}**! ✨\n${finalResponse}`;
      } else {
        reply = `**${senderDisplayName}** used **${commandKey.replace("_", " ")}**! ✨\n${finalResponse}`;
      }

      try {
        await message.channel.send(reply);
      } catch (error) {
        console.error("Send Message Error:", error);
      }
    }
  }
});

async function generateResponse(message, context) {
  const displayName = message.guild
    ? message.guild.members.cache.get(message.author.id)?.displayName || message.author.username
    : message.author.username;

  try {
    const userInput = message.content.replace(/<@!?\d+>/g, "").trim();

    const systemMessage = {
      role: "system",
      content:
        "You are a funny cute and a bit depressed hamster named tatowo that talks with uwu owo and uses emojis like <a:chefspin:1339169865616982101> <a:chefSuperSpin:1339169749107474442> <:catchef:1339169485071978526> <:rumiLove2:1339169438687039540> <a:nowoted:1339169345250791436> <a:owotalk:1339169304637079572>, this are discord emotes, you will be helpful but funny too and a bit dumb, but you are very good at cooking, and keep your answers short, avoid more than 2 paragraphs. The person talking to you is " + displayName + " : ",
    };

    let prompt = context
      ? `Previous context: ${context}\nUser: ${userInput}`
      : userInput;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [systemMessage, { role: "user", content: prompt }],
      max_tokens: 500,
    });

    const botResponse = response.choices[0].message.content;
    try {
      const reply = await message.reply(botResponse);
      db.run(
        "INSERT INTO chatbot_memory (message_id, user_id, bot_response) VALUES (?, ?, ?)",
        [reply.id, message.author.id, botResponse],
        (err) => {
          if (err) console.error("DB Insert Error:", err);
        }
      );
    } catch (error) {
      console.error("Send Reply Error:", error);
    }
  } catch (error) {
    console.error("Chatbot Error:", error);
    try {
      await message.reply("I ran into an issue, please try again later.");
    } catch (replyError) {
      console.error("Failed to send error message:", replyError);
    }
  }
}

client.login(process.env.DISCORD_TOKEN);