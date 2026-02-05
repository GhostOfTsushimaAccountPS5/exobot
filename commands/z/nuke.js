const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Supprimer tous les salons et catégories du serveur'),
  ownerOnly: true,
  async execute(interaction) {
    // Check if the bot has necessary permissions
    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      return interaction.reply({ content: '❌ Je n\'ai pas la permission de gérer les salons.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setDescription('⚠️ Êtes-vous sûr de vouloir supprimer tous les salons et catégories ?')
      .setFooter({ text: 'ExoBot #Z © 2025' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_yes')
        .setLabel('Oui')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('confirm_no')
        .setLabel('Non')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    const filter = i => i.user.id === interaction.user.id;

    try {
      const collected = await interaction.channel.awaitMessageComponent({
        filter,
        componentType: 2, // Button
        time: 60000 // 1 minute
      });

      if (collected.customId === 'confirm_no') {
        const embedNo = new EmbedBuilder()
          .setDescription('❌ Suppression annulée.')
          .setFooter({ text: 'ExoBot #Z © 2025' });
        await collected.update({ embeds: [embedNo], components: [] });
        return;
      }

      if (collected.customId === 'confirm_yes') {
        const embedYes = new EmbedBuilder()
          .setDescription('Suppression en cours...')
          .setFooter({ text: 'ExoBot #Z © 2025' });
        await collected.update({ embeds: [embedYes], components: [] });

        // Delete all channels
        const channels = interaction.guild.channels.cache;
        for (const channel of channels.values()) {
          try {
            await channel.delete();
          } catch (error) {
            console.error(`Failed to delete channel ${channel.name}:`, error);
          }
        }

        // Since channels are deleted, we can't send a confirmation message
        // The embed update above serves as confirmation
      }
    } catch (error) {
      const embedEnd = new EmbedBuilder()
        .setDescription('❌ Confirmation expirée.')
        .setFooter({ text: 'ExoBot #Z © 2025' });
      await interaction.editReply({ embeds: [embedEnd], components: [] });
    }
  },
};
