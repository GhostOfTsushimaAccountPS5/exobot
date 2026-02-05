const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Montre l\'avatar d\'un utilisateur')
    .addUserOption(option =>
      option.setName('utilisateur')
        .setDescription('L\'utilisateur dont afficher l\'avatar')
        .setRequired(false)
    ),
  async execute(interaction) {
    let user = interaction.options.getUser('utilisateur') || interaction.user;

    const embed = new EmbedBuilder()
      .setTitle(`Avatar de ${user.username}`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .setColor(0x800080)
      .setFooter({ text: 'ExoBot #Z © 2025' });

    await interaction.reply({ embeds: [embed] });
  }
};
