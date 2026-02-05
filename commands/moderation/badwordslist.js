const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('badwordslist')
    .setDescription('Afficher la liste des mots interdits')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages),
  async execute(interaction) {
    const badwordsPath = path.join(__dirname, '../../badwords', `${interaction.guild.id}.json`);

    if (!fs.existsSync(badwordsPath)) {
      return interaction.reply({ content: '❌ Aucun mot interdit n\'est défini pour ce serveur.', ephemeral: true });
    }

    const badwords = JSON.parse(fs.readFileSync(badwordsPath, 'utf8'));

    if (badwords.length === 0) {
      return interaction.reply({ content: '❌ Aucun mot interdit n\'est défini pour ce serveur.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('Liste des mots interdits')
      .setDescription(badwords.map((word, index) => `${index + 1}. ${word}`).join('\n'))
      .setColor(0x800080)
      .setFooter({ text: 'ExoBot #Z © 2025' });

    await interaction.reply({ embeds: [embed] });
  }
};
