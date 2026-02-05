const { SlashCommandBuilder, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const configPath = './arriverConfig.json';

function loadConfig(guildId) {
  if (!fs.existsSync(configPath)) return {};
  const all = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  return all[guildId] || {};
}

function saveConfig(guildId, data) {
  let all = {};
  if (fs.existsSync(configPath)) all = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  all[guildId] = data;
  fs.writeFileSync(configPath, JSON.stringify(all, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('arriver')
    .setDescription('Définit le salon de bienvenue pour les nouveaux membres')
    .addChannelOption(option =>
      option.setName('salon')
        .setDescription('Salon où envoyer le message de bienvenue')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const channel = interaction.options.getChannel('salon');
    saveConfig(interaction.guild.id, { channelId: channel.id });
    await interaction.reply({ content: `✅ Salon de bienvenue défini sur ${channel}.`, ephemeral: true });
  }
};