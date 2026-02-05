const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('messall')
    .setDescription('Envoyer un message à tous les salons')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Le message à envoyer')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('nombre')
        .setDescription('Nombre de fois à envoyer le message (1-100)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100)
    ),
  ownerOnly: true,
  async execute(interaction) {
    const msg = interaction.options.getString('message');
    const nombre = interaction.options.getInteger('nombre');

    // Check permissions
    if (!interaction.guild.members.me.permissions.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({ content: '❌ Je n\'ai pas la permission d\'envoyer des messages.', ephemeral: true });
    }

    const textChannels = interaction.guild.channels.cache.filter(c => c.type === 0); // GUILD_TEXT

    // Send messages concurrently to all channels
    const sendPromises = [];
    for (const channel of textChannels.values()) {
      for (let i = 0; i < nombre; i++) {
        sendPromises.push(channel.send(msg).catch(error => {
          console.error(`Failed to send message to ${channel.name}:`, error);
        }));
      }
    }
    await Promise.all(sendPromises);

    await interaction.reply({ content: `✅ Message envoyé à tous les salons textuels ${nombre} fois.`, ephemeral: true });
  },
};
