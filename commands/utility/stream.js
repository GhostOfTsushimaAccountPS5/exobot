const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stream')
    .setDescription('Change le statut du bot en streaming avec un message personnalisé')
    .setDefaultMemberPermissions(0) // owner only
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Le message de streaming')
        .setRequired(true)),
  async execute(interaction) {
    const streamMessage = interaction.options.getString('message');

    try {
      await interaction.deferReply({ ephemeral: true });

      await interaction.client.user.setActivity(streamMessage);

      // Save the status to config.json
      const configPath = './config.json';
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      config.status = streamMessage;
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      await interaction.editReply(`✅ Statut changé: ${streamMessage}`);
    } catch (error) {
      console.error(error);
      await interaction.editReply('❌ Erreur lors du changement de statut.');
    }
  }
};
