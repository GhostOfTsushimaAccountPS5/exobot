const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('listbackup')
    .setDescription('Lister tous les backups disponibles'),
  ownerOnly: true,
  async execute(interaction) {
    const backupsDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupsDir)) {
      return interaction.reply({ content: '❌ Aucun dossier de backup trouvé.', ephemeral: true });
    }
    const files = fs.readdirSync(backupsDir).filter(file => file.endsWith('.json'));
    if (files.length === 0) {
      return interaction.reply({ content: '❌ Aucun backup trouvé.', ephemeral: true });
    }
    const backupNames = files.map(file => file.replace('.json', ''));
    await interaction.reply(`📁 Backups disponibles :\n${backupNames.join('\n')}`);
  },
};
