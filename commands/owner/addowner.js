const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addowner')
    .setDescription('Ajouter un utilisateur en tant que propriétaire')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('ID de l\'utilisateur à ajouter')
        .setRequired(true)
    ),
  ownerOnly: true,
  async execute(interaction) {
    const userId = interaction.options.getString('userid');
    const config = JSON.parse(fs.readFileSync('./config.json'));

    if (config.owners.includes(userId)) {
      return interaction.reply({ content: 'Cet utilisateur est déjà propriétaire.', ephemeral: true });
    }

    config.owners.push(userId);
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

    await interaction.reply(`✅ <@${userId}> ajouté.`);

    // Reload config in memory immediately
    interaction.client.config = config;
  },
};
