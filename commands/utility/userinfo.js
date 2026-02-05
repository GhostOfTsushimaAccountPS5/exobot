const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Affiche des informations sur un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à afficher')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ViewChannel),
  async execute(interaction) {
    let user = interaction.user;
    let member = interaction.member;

    const targetUser = interaction.options.getUser('utilisateur');
    if (targetUser) {
      user = targetUser;
      member = interaction.guild.members.cache.get(user.id);
    }

    const embed = new EmbedBuilder()
      .setTitle(`Informations sur ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512 }))
      .addFields(
        { name: '👤 Nom d\'utilisateur', value: `${user.username}#${user.discriminator}`, inline: true },
        { name: '🆔 ID', value: `${user.id}`, inline: true },
        { name: '📅 Créé le', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true },
        { name: '📅 Rejoint le', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'N/A', inline: true },
        { name: '🎭 Rôles', value: member ? member.roles.cache.map(role => role.name).join(', ') || 'Aucun' : 'N/A', inline: true },
        { name: '📊 Activité', value: member && member.presence ? member.presence.activities.map(activity => activity.name).join(', ') || 'Aucune' : 'N/A', inline: true }
      )
      .setColor(0x800080)
      .setFooter({ text: 'ExoBot #Z © 2025' });

    await interaction.reply({ embeds: [embed] });
  }
};
