const fs = require('fs');
const path = require('path');
const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delbackup')
    .setDescription('Supprimer une backup par nom')
    .addStringOption(option =>
      option.setName('nom')
        .setDescription('Nom de la backup à supprimer')
        .setRequired(true)
    ),
  ownerOnly: true,
  async execute(interaction) {
    const backupName = interaction.options.getString('nom');
    const backupsDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupsDir)) {
      return interaction.reply({ content: '❌ Aucun dossier de backup trouvé.', ephemeral: true });
    }

    const filePath = path.join(backupsDir, `${backupName}.json`);
    if (!fs.existsSync(filePath)) {
      return interaction.reply({ content: `❌ Backup "${backupName}" introuvable.`, ephemeral: true });
    }

    try {
      fs.unlinkSync(filePath);
      await interaction.reply(`✅ Backup "${backupName}" supprimée avec succès.`);
    } catch (error) {
      console.error('Erreur lors de la suppression de la backup:', error);
      await interaction.reply({ content: '❌ Une erreur est survenue lors de la suppression de la backup.', ephemeral: true });
    }
  },
};
