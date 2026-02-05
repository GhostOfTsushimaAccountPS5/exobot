const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Supprime un nombre de messages spécifié (1-100)')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
    .addIntegerOption(option =>
      option.setName('nombre')
        .setDescription('Nombre de messages à supprimer')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)),
  async execute(interaction) {
    if (interaction.channel.type !== ChannelType.GuildText) {
      return interaction.reply({ content: '❌ Cette commande ne peut être utilisée que dans un salon textuel.', ephemeral: true });
    }

    const amount = interaction.options.getInteger('nombre');

    try {
      await interaction.channel.bulkDelete(amount, true);
      const reply = await interaction.reply({ content: `✅ ${amount} messages supprimés.`, fetchReply: true });
      setTimeout(() => {
        reply.delete().catch(() => {});
      }, 5000);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Impossible de supprimer les messages.', ephemeral: true });
    }
  }
};
