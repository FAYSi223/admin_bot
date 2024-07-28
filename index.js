require('dotenv').config(); // Lädt .env-Datei
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const ticketHandler = require('./ticketHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.commands = new Collection();
client.teamRoleId = null;

// Load global channels and bans configuration
const globalChannelsPath = path.join(__dirname, 'globalChannels.json');
const globalBansPath = path.join(__dirname, 'globalBans.json');
let globalChannels = require(globalChannelsPath);
let globalBans = require(globalBansPath);

// Lade die Slash-Befehle
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[WARN] The command at ${file} is missing a required "data" or "execute" property.`);
  }
}

client.once('ready', async () => {
  console.log('Ready!');
  client.user.setPresence({
    activities: [{ name: process.env.STATUS, type: process.env.STATUS_TYPE }],
    status: 'online',
  });

  const guild = client.guilds.cache.get(process.env.GUILD_ID);
  if (!guild) {
    console.error('Guild not found');
    return;
  }

  await guild.commands.set(client.commands.map(command => command.data.toJSON()));
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

client.on('messageCreate', async (message) => {
  if (!message.guild) return;
  if (message.author.bot) return;

  if (globalChannels.channels.includes(message.channel.id)) {
    if (globalBans.bannedUsers.includes(message.author.id)) {
      return message.reply('You are banned from the global chat.');
    }

    const embed = new EmbedBuilder()
      .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setDescription(message.content)
      .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ dynamic: true }) })
      .setTimestamp();

    if (message.attachments.size > 0) {
      embed.setImage(message.attachments.first().url);
    }

    globalChannels.channels.forEach(channelId => {
      if (channelId !== message.channel.id) {
        const channel = client.channels.cache.get(channelId);
        if (channel) {
          channel.send({ embeds: [embed] }).catch(console.error);
        }
      }
    });
  }

  if (message.mentions.has(client.user)) {
    try {
      let res = await axios.get(`http://api.brainshop.ai/get?bid=182840&key=5tL14F5OxY2N06qm&uid=[uid]&msg=[msg]${encodeURIComponent(message.content)}`);
      message.reply(res.data.cnt);
    } catch (error) {
      errorEmbed(`Bot error, please try again!`, message);
    }
  }
});

client.login(process.env.TOKEN);
