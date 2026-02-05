const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Sauvegarder les rôles et canaux du serveur avec un nom donné')
    .addStringOption(option =>
      option.setName('nom')
        .setDescription('Nom de la sauvegarde')
        .setRequired(true)
    ),
  ownerOnly: true,
  async execute(interaction) {
    const backupName = interaction.options.getString('nom');

    const backupsDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir);
    }

    const roles = interaction.guild.roles.cache
      .filter(r => !r.managed) // exclude managed roles
      .sort((a, b) => a.position - b.position)
      .map(r => ({
        name: r.name,
        color: r.color,
        permissions: r.permissions.toArray(),
        position: r.position,
      }));

    const channels = interaction.guild.channels.cache
      .sort((a, b) => a.position - b.position)
      .map(c => ({
        name: c.name,
        type: c.type,
        position: c.position,
        parent: c.parent ? c.parent.name : null,
      }));

    const data = { roles, channels };
    const filePath = path.join(backupsDir, `${backupName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    await interaction.reply(`✅ Sauvegarde "${backupName}" enregistrée avec succès.`);
  },
};
