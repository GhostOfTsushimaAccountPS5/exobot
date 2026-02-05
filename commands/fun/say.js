const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Faire envoyer un message par le bot')
    .addStringOption(option =>
      option
        .setName('texte')
        .setDescription('Texte à envoyer (Shift + Entrée autorisé)')
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option
        .setName('image')
        .setDescription('Image à envoyer avec le message')
        .setRequired(false)
    ),

  async execute(interaction) {
    const texte = interaction.options.getString('texte');
    const image = interaction.options.getAttachment('image');

    // Empêche un /say vide
    if (!texte && !image) {
      return interaction.reply({
        content: '❌ Tu dois fournir au moins un texte ou une image.',
        ephemeral: true,
      });
    }

    // Accusé de réception
    await interaction.deferReply({ ephemeral: true });

    const payload = {};

    // Texte multi-ligne (tel quel)
    if (texte) {
      payload.content = texte;
    }

    // Image uploadée
    if (image) {
      payload.files = [image.url];
    }

    // Envoi du message
    await interaction.channel.send(payload);

    // Confirmation
    await interaction.editReply({
      content: '✅ Message envoyé avec succès.',
    });
  },
};