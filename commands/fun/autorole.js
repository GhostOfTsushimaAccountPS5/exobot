const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

const configPath = './autoroleConfig.json';

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
    .setName('autorole')
    .setDescription('Définit le rôle à donner automatiquement aux nouveaux membres')
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Le rôle à donner')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const role = interaction.options.getRole('role');
    saveConfig(interaction.guild.id, { roleId: role.id });
    await interaction.reply({ content: `✅ Le rôle automatique est maintenant <@&${role.id}>.`, ephemeral: true });
  }
};