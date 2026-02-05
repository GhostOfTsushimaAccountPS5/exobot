const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const QRCode = require('qrcode');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('qrcode')
    .setDescription('Génère un QR code à partir d\'un texte, d\'une URL ou d\'une image')
    .addStringOption(option =>
      option.setName('texte')
        .setDescription('Texte ou URL à transformer en QR code')
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option.setName('image')
        .setDescription('Image à transformer en QR code (lien de l\'image sera encodé)')
        .setRequired(false)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    let dataToEncode = null;

    // Si une image est fournie, on encode son URL
    const image = interaction.options.getAttachment('image');
    if (image && image.url) {
      dataToEncode = image.url;
    } else {
      // Sinon, on encode le texte ou l'URL fourni
      const texte = interaction.options.getString('texte');
      if (texte && texte.trim().length > 0) {
        dataToEncode = texte.trim();
      }
    }

    if (!dataToEncode) {
      return interaction.editReply({ content: 'Veuillez fournir un texte, une URL ou une image à transformer en QR code.' });
    }

    try {
      // Génère le QR code en buffer PNG
      const qrBuffer = await QRCode.toBuffer(dataToEncode, { type: 'png', width: 512 });

      const embed = new EmbedBuilder()
        .setTitle('QR Code généré')
        .setDescription('Voici le QR code correspondant à votre demande.')
        .setColor(0x800080)
        .setImage('attachment://qrcode.png')
        .setFooter({ text: 'ExoBot #Z © 2025' });

      await interaction.editReply({
        embeds: [embed],
        files: [{ attachment: qrBuffer, name: 'qrcode.png' }]
      });
    } catch (error) {
      console.error('Erreur lors de la génération du QR code:', error);
      await interaction.editReply({ content: 'Une erreur est survenue lors de la génération du QR code.' });
    }
  }
};