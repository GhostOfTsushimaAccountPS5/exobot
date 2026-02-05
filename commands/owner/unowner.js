const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unowner')
    .setDescription('Supprimer un utilisateur des propriétaires')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('ID de l\'utilisateur à supprimer')
        .setRequired(true)
    ),
  ownerOnly: true,
  async execute(interaction) {
    const userId = interaction.options.getString('userid');
    const config = JSON.parse(fs.readFileSync('./config.json'));

    if (!config.owners.includes(userId)) {
      return interaction.reply({ content: 'Cet utilisateur n\'est pas propriétaire.', ephemeral: true });
    }

    config.owners = config.owners.filter(id => id !== userId);
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

    await interaction.reply(`✅ <@${userId}> retiré.`);

    // Reload config in memory immediately
    interaction.client.config = config;
  },
};
