const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removerole')
    .setDescription('Retirer un rôle à un utilisateur')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles)
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur à qui retirer le rôle')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('role')
        .setDescription('Le rôle à retirer')
        .setRequired(true)),
  async execute(interaction) {
    const user = interaction.options.getUser('utilisateur');
    const role = interaction.options.getRole('role');

    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Erreur')
        .setDescription('Utilisateur introuvable sur ce serveur.')
        .setColor(0xff0000);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (!role) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Erreur')
        .setDescription('Rôle introuvable.')
        .setColor(0xff0000);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (!member.roles.cache.has(role.id)) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Erreur')
        .setDescription('L\'utilisateur n\'a pas ce rôle.')
        .setColor(0xff0000);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Erreur')
        .setDescription('Je n\'ai pas la permission de gérer les rôles.')
        .setColor(0xff0000);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      const embed = new EmbedBuilder()
        .setTitle('❌ Erreur')
        .setDescription('Je ne peux pas gérer ce rôle car il est supérieur ou égal à mon rôle le plus élevé.')
        .setColor(0xff0000);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      await member.roles.remove(role);
      const embed = new EmbedBuilder()
        .setTitle('✅ Rôle retiré')
        .setDescription(`Le rôle ${role} a été retiré à ${user.tag}.`)
        .setColor(0x00ff00);
      await interaction.reply({ embeds: [embed] });

      // Logging
      const guildConfigPath = path.join(__dirname, '../../logs', `${interaction.guild.id}.json`);
      if (fs.existsSync(guildConfigPath)) {
        const guildConfig = JSON.parse(fs.readFileSync(guildConfigPath, 'utf8'));
        if (guildConfig.enabledLogs.includes(1)) {
          const logChannel = interaction.guild.channels.cache.get(guildConfig.logChannel);
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setTitle('➖ Rôle retiré')
              .setDescription(`**Utilisateur:** ${user.tag} (${user.id})\n**Rôle:** ${role.name} (${role.id})\n**Modérateur:** ${interaction.user.tag} (${interaction.user.id})`)
              .setColor(0xff0000)
              .setFooter({ text: 'ExoBot #Z © 2025' });
            logChannel.send({ embeds: [logEmbed] }).catch(() => {});
          }
        }
      }
    } catch (error) {
      console.error(error);
      const embed = new EmbedBuilder()
        .setTitle('❌ Erreur')
        .setDescription('Une erreur est survenue lors du retrait du rôle.')
        .setColor(0xff0000);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
};
