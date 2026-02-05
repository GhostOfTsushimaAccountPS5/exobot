const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('popticket')
    .setDescription('Crée un panel de ticket dans un salon spécifique avec une catégorie définie')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
    .addChannelOption(option =>
      option.setName('salon')
        .setDescription('Le salon où envoyer le panel de ticket')
        .setRequired(true)
        .addChannelTypes(0) // 0 = GUILD_TEXT
    )
    .addChannelOption(option =>
      option.setName('categorie')
        .setDescription('La catégorie où les tickets seront créés')
        .setRequired(true)
        .addChannelTypes(4) // 4 = GUILD_CATEGORY
    ),
  async execute(interaction) {
    const salon = interaction.options.getChannel('salon');
    const categorie = interaction.options.getChannel('categorie');

    const embed = new EmbedBuilder()
      .setTitle('🎫 Support Ticket')
      .setDescription('Cliquez sur le bouton ci-dessous pour ouvrir un ticket de support.')
      .setColor(0x800080)
      .setFooter({ text: 'ExoBot #Z © 2025' });

    const button = new ButtonBuilder()
      .setCustomId(`open_ticket_${categorie.id}`)
      .setLabel('Ouvrir un Ticket')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎫');

    const row = new ActionRowBuilder()
      .addComponents(button);

    try {
      await salon.send({ embeds: [embed], components: [row] });
      await interaction.reply({ content: `✅ Panel de ticket créé avec succès dans ${salon}.`, ephemeral: true });
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Erreur lors de la création du panel de ticket.', ephemeral: true });
    }
  }
};
