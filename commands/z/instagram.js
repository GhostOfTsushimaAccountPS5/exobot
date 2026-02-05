const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('instagram')
    .setDescription('Affiche des informations publiques sur un compte Instagram')
    .addStringOption(option =>
      option.setName('pseudo')
        .setDescription('Le pseudo Instagram')
        .setRequired(true)
    ),
  ownerOnly: true,
  async execute(interaction) {
    const username = interaction.options.getString('pseudo');
    await interaction.deferReply();

    try {
      // Utilisation d'un endpoint public non-officiel (peut cesser de fonctionner à tout moment)
      const url = `https://www.instagram.com/${encodeURIComponent(username)}/?__a=1&__d=dis`;
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });

      const user = response.data?.graphql?.user;
      if (!user) {
        return interaction.editReply({ content: '❌ Utilisateur introuvable ou profil privé.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(`Profil Instagram de ${user.full_name || username}`)
        .setURL(`https://instagram.com/${username}`)
        .setThumbnail(user.profile_pic_url_hd || user.profile_pic_url)
        .setColor(0x800080)
        .addFields(
          { name: 'Pseudo', value: user.username, inline: true },
          { name: 'Nom', value: user.full_name || 'Non renseigné', inline: true },
          { name: 'Bio', value: user.biography || 'Aucune', inline: false },
          { name: 'Abonnés', value: user.edge_followed_by.count.toLocaleString(), inline: true },
          { name: 'Abonnements', value: user.edge_follow.count.toLocaleString(), inline: true },
          { name: 'Posts', value: user.edge_owner_to_timeline_media.count.toLocaleString(), inline: true },
          { name: 'Compte privé', value: user.is_private ? 'Oui' : 'Non', inline: true },
          { name: 'Vérifié', value: user.is_verified ? 'Oui' : 'Non', inline: true }
        )
        .setFooter({ text: 'ExoBot #Z © 2025' });

      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      await interaction.editReply({ content: '❌ Impossible de récupérer les informations (profil privé, inexistant ou limite API).', ephemeral: true });
    }
  }
};