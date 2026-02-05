const { EmbedBuilder, SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('closeticket')
    .setDescription('Ferme le ticket actuel')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels),
  async execute(interaction) {
    // Check if the channel is a ticket channel
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: '❌ Cette commande ne peut être utilisée que dans un canal de ticket.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('🔒 Ticket Fermé')
      .setDescription('Ce ticket sera fermé dans 5 secondes.')
      .setColor('#FF0000')
      .setFooter({ text: 'Fermé par ' + interaction.user.tag });

    try {
      await interaction.channel.send({ embeds: [embed] });

      setTimeout(async () => {
        await interaction.channel.delete();
      }, 5000); // Delete after 5 seconds

      await interaction.reply({ content: '✅ Ticket fermé avec succès !', ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Erreur lors de la fermeture du ticket.', ephemeral: true });
    }
  }
};
