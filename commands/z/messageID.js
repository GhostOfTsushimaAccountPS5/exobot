// commands/#Z/messageinfo.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('messageinfo')
    .setDescription('🔍 Affiche les informations d’un message via son ID.')
    .addStringOption(option =>
      option
        .setName('messageid')
        .setDescription('ID du message à examiner')
        .setRequired(true)
    ),
  ownerOnly: true,
  async execute(interaction) {
    const messageId = interaction.options.getString('messageid');
    const channel = interaction.channel;

    try {
      const message = await channel.messages.fetch(messageId);

      const embed = new EmbedBuilder()
        .setColor(0x8e44ad)
        .setTitle('🕵️ Informations du Message')
        .addFields(
          { name: '👤 Auteur', value: `${message.author.tag} (${message.author.id})`, inline: false },
          { name: '💬 Contenu', value: message.content ? message.content : '*Aucun texte (embed/image/etc.)*', inline: false },
          { name: '🕓 Envoyé le', value: `<t:${Math.floor(message.createdTimestamp / 1000)}:F>`, inline: false },
          { name: '📍 Salon', value: `${message.channel}`, inline: false }
        )
        .setFooter({ text: 'ExoBot #Z © 2025' });

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(error);
      return interaction.reply({ content: '❌ Impossible de trouver le message. Vérifie l’ID et le salon.', ephemeral: true });
    }
  },
};
