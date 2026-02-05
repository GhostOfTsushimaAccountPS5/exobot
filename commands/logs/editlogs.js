const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, PermissionsBitField, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('editlogs')
    .setDescription('Modifier ou supprimer des types de logs activés')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Action à effectuer')
        .setRequired(true)
        .addChoices(
          { name: 'Ajouter des logs', value: 'add' },
          { name: 'Supprimer des logs', value: 'remove' }
        )
    ),
  async execute(interaction) {
    const action = interaction.options.getString('action');
    const guildConfigPath = path.join(__dirname, '../../logs', `${interaction.guild.id}.json`);

    if (!fs.existsSync(guildConfigPath)) {
      return interaction.reply({ content: '❌ Aucun système de logs n\'est activé sur ce serveur.', ephemeral: true });
    }

    const guildConfig = JSON.parse(fs.readFileSync(guildConfigPath, 'utf8'));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_edit_logs')
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
      .setTitle('Modifier les logs')
      .setDescription(`Sélectionnez les types de logs à ${action === 'add' ? 'ajouter' : 'supprimer'}`)
      .setColor(0x800080)
      .setFooter({ text: 'ExoBot #Z © 2025' });

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    const filter = i => i.user.id === interaction.user.id && i.customId === 'select_edit_logs';

    try {
      const collected = await interaction.channel.awaitMessageComponent({
        filter,
        componentType: 3, // StringSelectMenu
        time: 120000 // 2 minutes
      });

      const selectedNumbers = collected.values.map(v => parseInt(v));

      if (action === 'add') {
        // Add selected logs
        const newEnabled = Array.from(new Set([...guildConfig.enabledLogs, ...selectedNumbers]));
        guildConfig.enabledLogs = newEnabled;
        fs.writeFileSync(guildConfigPath, JSON.stringify(guildConfig, null, 2));
        await collected.update({ content: `✅ Logs modifiés. Logs activés : ${guildConfig.enabledLogs.join(', ')}`, embeds: [], components: [] });
      } else if (action === 'remove') {
        // Remove selected logs
        guildConfig.enabledLogs = guildConfig.enabledLogs.filter(n => !selectedNumbers.includes(n));
        fs.writeFileSync(guildConfigPath, JSON.stringify(guildConfig, null, 2));
        await collected.update({ content: `✅ Logs modifiés. Logs activés : ${guildConfig.enabledLogs.join(', ')}`, embeds: [], components: [] });
      }
    } catch (error) {
      await interaction.editReply({ content: '❌ Temps écoulé. Action annulée. Veuillez réessayer.', embeds: [], components: [] });
    }
  }
};
