const { EmbedBuilder, SlashCommandBuilder, PermissionsBitField, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('activelogs')
    .setDescription('Activer les logs dans un salon spécifié')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
    .addChannelOption(option =>
      option.setName('salon')
        .setDescription('Salon où activer les logs')
        .setRequired(true)
    ),
  async execute(interaction) {
    const channel = interaction.options.getChannel('salon');

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_logs')
      .setPlaceholder('Sélectionnez les types de logs')
      .setMinValues(1)
      .setMaxValues(5)
      .addOptions(
        {
          label: 'Logs de rôles',
          description: 'Suppression et ajout de rôles',
          value: '1'
        },
        {
          label: 'Logs de salons',
          description: 'Suppression et ajout de salons',
          value: '2'
        },
        {
          label: 'Logs d\'utilisateurs',
          description: 'Arrivée et départ des membres',
          value: '3'
        },
        {
          label: 'Logs de messages modifiés',
          description: 'Modifications de messages avec ancien contenu',
          value: '4'
        },
        {
          label: 'Logs de messages supprimés',
          description: 'Suppressions de messages',
          value: '5'
        }
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    const embed = new EmbedBuilder()
      .setTitle('🔧 Configuration des Logs')
      .setDescription(`Sélectionnez les types de logs à activer dans ${channel}`)
      .setColor(0x800080)
      .setFooter({ text: 'ExoBot #Z © 2025' });

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    const filter = i => i.user.id === interaction.user.id && i.customId === 'select_logs';

    try {
      const collected = await interaction.channel.awaitMessageComponent({
        filter,
        componentType: 3, // StringSelectMenu
        time: 120000 // 2 minutes
      });

      const selectedNumbers = collected.values.map(v => parseInt(v));

      // Save configuration per guild
      const guildConfigPath = path.join(__dirname, '../../logs', `${interaction.guild.id}.json`);
      let guildConfig = { logChannel: channel.id, enabledLogs: selectedNumbers };

      if (fs.existsSync(guildConfigPath)) {
        const existingConfig = JSON.parse(fs.readFileSync(guildConfigPath, 'utf8'));
        guildConfig = { ...existingConfig, logChannel: channel.id, enabledLogs: selectedNumbers };
      }

      fs.writeFileSync(guildConfigPath, JSON.stringify(guildConfig, null, 2));

      const enabledTypes = selectedNumbers.map(n => {
        switch (n) {
          case 1: return 'Rôles';
          case 2: return 'Salons';
          case 3: return 'Utilisateurs';
          case 4: return 'Messages modifiés';
          case 5: return 'Messages supprimés';
        }
      }).join(', ');

      await collected.update({ content: `✅ Logs activés dans <#${channel.id}> (ID: ${channel.id}) pour : ${enabledTypes}`, embeds: [], components: [] });

    } catch (error) {
      await interaction.editReply({ content: '❌ Temps écoulé. Configuration annulée. Veuillez réessayer.', embeds: [], components: [] });
    }
  }
};
