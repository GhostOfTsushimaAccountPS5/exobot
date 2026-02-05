const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('renew')
    .setDescription('Recrée le salon identique à l\'emplacement actuel')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),
  async execute(interaction) {
    const channel = interaction.channel;
    try {
      const clonedChannel = await channel.clone();
      await channel.delete();
      await interaction.reply({ content: '✅ Salon recréé avec succès.', ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Impossible de recréer le salon.', ephemeral: true });
    }
  }
};
