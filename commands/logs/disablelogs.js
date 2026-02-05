const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('disablelogs')
    .setDescription('Désactiver tous les logs')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild),
  async execute(interaction) {
    const guildConfigPath = path.join(__dirname, '../../logs', `${interaction.guild.id}.json`);

    if (!fs.existsSync(guildConfigPath)) {
      return interaction.reply({ content: '❌ Aucun système de logs n\'est activé sur ce serveur.', ephemeral: true });
    }

    fs.unlinkSync(guildConfigPath);
    await interaction.reply('✅ Système de logs désactivé.');
  }
};
