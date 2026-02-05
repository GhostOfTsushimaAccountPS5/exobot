const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('badwords')
    .setDescription('Ajouter un mot interdit. Les messages contenant ce mot seront supprimés.')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
    .addStringOption(option =>
      option.setName('mot')
        .setDescription('Le mot à ajouter à la liste des mots interdits')
        .setRequired(true)),
  async execute(interaction) {
    const word = interaction.options.getString('mot').toLowerCase();
    const badwordsPath = path.join(__dirname, '../../badwords', `${interaction.guild.id}.json`);

    let badwords = [];
    if (fs.existsSync(badwordsPath)) {
      badwords = JSON.parse(fs.readFileSync(badwordsPath, 'utf8'));
    }

    if (badwords.includes(word)) {
      return interaction.reply({ content: '❌ Ce mot est déjà dans la liste des mots interdits.', ephemeral: true });
    }

    badwords.push(word);
    fs.writeFileSync(badwordsPath, JSON.stringify(badwords, null, 2));

    await interaction.reply({ content: `✅ Le mot "${word}" a été ajouté à la liste des mots interdits.`, ephemeral: true });
  }
};
