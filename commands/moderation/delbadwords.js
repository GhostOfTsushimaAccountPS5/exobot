const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delbadwords')
    .setDescription('Supprimer des mots de la liste des mots interdits')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
    .addStringOption(option =>
      option.setName('numeros')
        .setDescription('Numéros des mots à supprimer, séparés par des virgules (ex: 1,3,5)')
        .setRequired(true)),
  async execute(interaction) {
    const badwordsPath = path.join(__dirname, '../../badwords', `${interaction.guild.id}.json`);

    if (!fs.existsSync(badwordsPath)) {
      return interaction.reply({ content: '❌ Aucun mot interdit n\'est défini pour ce serveur.', ephemeral: true });
    }

    let badwords = JSON.parse(fs.readFileSync(badwordsPath, 'utf8'));

    if (badwords.length === 0) {
      return interaction.reply({ content: '❌ Aucun mot interdit n\'est défini pour ce serveur.', ephemeral: true });
    }

    const numerosStr = interaction.options.getString('numeros');
    const selectedNumbers = numerosStr.split(',').map(n => parseInt(n.trim())).filter(n => n >= 1 && n <= badwords.length);

    if (selectedNumbers.length === 0) {
      return interaction.reply({ content: '❌ Aucun numéro valide sélectionné.', ephemeral: true });
    }

    const wordsToRemove = selectedNumbers.map(n => badwords[n - 1]);
    badwords = badwords.filter((word, index) => !selectedNumbers.includes(index + 1));

    fs.writeFileSync(badwordsPath, JSON.stringify(badwords, null, 2));

    await interaction.reply({ content: `✅ Mots supprimés : ${wordsToRemove.join(', ')}`, ephemeral: true });
  }
};
