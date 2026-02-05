const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, Partials, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const activeBugReports = new Set();
require('dotenv').config();
require('dotenv').config();
const config = {
  prefix: process.env.PREFIX || "+",
  owners: process.env.OWNERS ? process.env.OWNERS.split(",") : [],
  status: process.env.STATUS || "https://guns.lol/0zsw",
  logChannel: null,
  enabledLogs: []
};
const antiraidHandler = require('./antiraidHandler');
const settingsManager = require('./settingsManager');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessageReactions,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction,
    ]
});

client.config = JSON.parse(fs.readFileSync('./config.json'));
client.commands = new Map();

const commandFolders = fs.readdirSync('./commands');

for (const folder of commandFolders) {
  const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const command = require(`./commands/${folder}/${file}`);
    if (command.data && command.data.name) {
      client.commands.set(command.data.name, command);
    }
  }
}

client.once('ready', async () => {
  console.log(`ExoBot est en ligne en tant que ${client.user.tag}!`);

  // Appliquer le statut depuis les paramètres API ou config par défaut
  let activity = client.config.status;
  try {
    // Essayer de récupérer les paramètres généraux depuis l'API pour tous les serveurs
    // Pour le statut global, on peut utiliser le premier serveur ou une valeur par défaut
    const guilds = client.guilds.cache;
    if (guilds.size > 0) {
      const firstGuild = guilds.first();
      const settings = await settingsManager.getSettings(firstGuild.id);
      if (settings.general && settings.general.botActivity) {
        activity = settings.general.botActivity;
      }
    }
  } catch (error) {
    console.warn('[Ready] Erreur récupération paramètres API:', error.message);
  }

  if (activity) {
    client.user.setActivity(activity);
  }

  // Nettoyer le cache des paramètres périodiquement
  setInterval(() => {
    settingsManager.cleanCache();
  }, 10 * 60 * 1000); // Toutes les 10 minutes
});

// 2FA CONFIG UTILS
const twoFAConfigPath = './2faConfig.json';
function get2FAConfig(guildId) {
  if (!fs.existsSync(twoFAConfigPath)) return {};
  const all = JSON.parse(fs.readFileSync(twoFAConfigPath, 'utf8'));
  return all[guildId] || {};
}

// ARRIVER CONFIG UTILS
const arriverConfigPath = './arriverConfig.json';
function getArriverConfig(guildId) {
  if (!fs.existsSync(arriverConfigPath)) return {};
  const all = JSON.parse(fs.readFileSync(arriverConfigPath, 'utf8'));
  return all[guildId] || {};
}

// AUTOROLE CONFIG UTILS
const autoroleConfigPath = './autoroleConfig.json';
function getAutoroleConfig(guildId) {
  if (!fs.existsSync(autoroleConfigPath)) return {};
  const all = JSON.parse(fs.readFileSync(autoroleConfigPath, 'utf8'));
  return all[guildId] || {};
}

// 2FA, AUTOROLE & ARRIVER: GESTION NOUVEAU MEMBRE
client.on('guildMemberAdd', async member => {
  try {
    // Récupérer les paramètres depuis l'API
    const settings = await settingsManager.getSettings(member.guild.id);

    // Anti-raid depuis API
    if (settings.support && settings.support.antiRaid) {
      await antiraidHandler.execute(member);
    }

    // Vérification depuis API
    if (settings.support && settings.support.verification) {
      if (typeof verificationHandler !== "undefined" && verificationHandler.execute) {
        await verificationHandler.execute(member);
      }
    }

    // 2FA: cacher tous les salons sauf si vérifié (utilise toujours les fichiers locaux pour compatibilité)
    const config = get2FAConfig(member.guild.id);
    if (config.enabled && config.roleId) {
      try {
        await member.roles.set([]);
      } catch (e) {}

      try {
        const embed = new EmbedBuilder()
          .setTitle('Vérification ExoBot')
          .setDescription('Clique sur le bouton ci-dessous pour confirmer que tu es humain et accéder au serveur.')
          .setColor(0x00ff00)
          .setFooter({ text: 'ExoBot #Z © 2025' });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`2fa_confirm_${member.id}_${member.guild.id}`)
            .setLabel('Confirmer')
            .setStyle(ButtonStyle.Success)
        );

        await member.send({ embeds: [embed], components: [row] });
      } catch (e) {
        // DM impossible
      }
    } else {
      // AUTOROLE: donne le rôle automatiquement (seulement si 2FA désactivé)
      const autoroleConfig = getAutoroleConfig(member.guild.id);
      if (autoroleConfig.roleId) {
        try {
          await member.roles.add(autoroleConfig.roleId);
        } catch (e) {
          // Impossible d'ajouter le rôle (permissions ?)
        }
      }
    }

    // ARRIVER: message de bienvenue personnalisé (utilise toujours les fichiers locaux)
    const arriverConfig = getArriverConfig(member.guild.id);
    if (arriverConfig.channelId) {
      const channel = member.guild.channels.cache.get(arriverConfig.channelId);
      if (channel) {
        const embed = new EmbedBuilder()
          .setTitle('Bienvenue sur le serveur !')
          .setDescription(`Bienvenue à <@${member.id}> sur **${member.guild.name}** ! 🎉\nN’hésite pas à te présenter ou à participer !`)
          .setColor(0x800080)
          .setFooter({ text: 'ExoBot #Z © 2025' });
        channel.send({ embeds: [embed] }).catch(() => {});
      }
    }

    // Logging depuis API
    if (settings.support && settings.support.logs) {
      const logChannel = member.guild.channels.cache.get(settings.support.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('👋 Membre arrivé')
          .setDescription(`**Utilisateur:** ${member.user.tag} (${member.user.id})\n**Date d'arrivée:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F>`)
          .setColor(0x800080)
          .setFooter({ text: 'ExoBot #Z © 2025' });
        logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  } catch (error) {
    console.warn(`[guildMemberAdd] Erreur pour ${member.guild.id}:`, error.message);
    // Fallback aux anciens comportements si API indisponible
  }
});

client.on('guildMemberRemove', async member => {
  try {
    // Récupérer les paramètres depuis l'API
    const settings = await settingsManager.getSettings(member.guild.id);

    // Logging depuis API
    if (settings.support && settings.support.logs) {
      const logChannel = member.guild.channels.cache.get(settings.support.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('👋 Membre parti')
          .setDescription(`**Utilisateur:** ${member.user.tag} (${member.user.id})\n**Rôles:** ${member.roles.cache.map(r => r.name).join(', ')}`)
          .setColor(0x800080)
          .setFooter({ text: 'ExoBot #Z © 2025' });
        logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  } catch (error) {
    console.warn(`[guildMemberRemove] Erreur pour ${member.guild.id}:`, error.message);
    // Fallback aux anciens comportements si API indisponible
  }
});

client.on('messageDelete', async message => {
  if (!message.guild || message.author.bot) return;

  try {
    // Récupérer les paramètres depuis l'API
    const settings = await settingsManager.getSettings(message.guild.id);

    // Logging depuis API
    if (settings.support && settings.support.logs) {
      const logChannel = message.guild.channels.cache.get(settings.support.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('🗑️ Message supprimé')
          .setDescription(`**Auteur:** ${message.author.tag} (${message.author.id})\n**Salon:** ${message.channel}\n**Contenu:** ${message.content || '*Message vide*'}\n**Date:** <t:${Math.floor(message.createdTimestamp / 1000)}:F>`)
          .setColor(0x800080)
          .setFooter({ text: 'ExoBot #Z © 2025' });
        logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  } catch (error) {
    console.warn(`[messageDelete] Erreur pour ${message.guild.id}:`, error.message);
    // Fallback aux anciens comportements si API indisponible
  }
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
  if (!oldMessage.guild || oldMessage.author.bot || oldMessage.content === newMessage.content) return;

  try {
    // Récupérer les paramètres depuis l'API
    const settings = await settingsManager.getSettings(oldMessage.guild.id);

    // Logging depuis API
    if (settings.support && settings.support.logs) {
      const logChannel = oldMessage.guild.channels.cache.get(settings.support.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('✏️ Message modifié')
          .setDescription(`**Auteur:** ${oldMessage.author.tag} (${oldMessage.author.id})\n**Salon:** ${oldMessage.channel}\n**Ancien contenu:** ${oldMessage.content || '*Message vide*'}\n**Nouveau contenu:** ${newMessage.content || '*Message vide*'}\n**Date:** <t:${Math.floor(oldMessage.createdTimestamp / 1000)}:F>`)
          .setColor(0x800080)
          .setFooter({ text: 'ExoBot #Z © 2025' });
        logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  } catch (error) {
    console.warn(`[messageUpdate] Erreur pour ${oldMessage.guild.id}:`, error.message);
    // Fallback aux anciens comportements si API indisponible
  }
});

client.on('roleCreate', async role => {
  try {
    // Récupérer les paramètres depuis l'API
    const settings = await settingsManager.getSettings(role.guild.id);

    // Logging depuis API
    if (settings.support && settings.support.logs) {
      const logChannel = role.guild.channels.cache.get(settings.support.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('➕ Rôle créé')
          .setDescription(`**Nom:** ${role.name}\n**Couleur:** ${role.hexColor}\n**Permissions:** ${role.permissions.toArray().join(', ')}\n**Position:** ${role.position}`)
          .setColor(0x800080)
          .setFooter({ text: 'ExoBot #Z © 2025' });
        logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  } catch (error) {
    console.warn(`[roleCreate] Erreur pour ${role.guild.id}:`, error.message);
    // Fallback aux anciens comportements si API indisponible
  }
});

client.on('roleDelete', async role => {
  try {
    // Récupérer les paramètres depuis l'API
    const settings = await settingsManager.getSettings(role.guild.id);

    // Logging depuis API
    if (settings.support && settings.support.logs) {
      const logChannel = role.guild.channels.cache.get(settings.support.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('➖ Rôle supprimé')
          .setDescription(`**Nom:** ${role.name}\n**Couleur:** ${role.hexColor}\n**Permissions:** ${role.permissions.toArray().join(', ')}\n**Position:** ${role.position}`)
          .setColor(0x800080)
          .setFooter({ text: 'ExoBot #Z © 2025' });
        logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  } catch (error) {
    console.warn(`[roleDelete] Erreur pour ${role.guild.id}:`, error.message);
    // Fallback aux anciens comportements si API indisponible
  }
});

client.on('channelCreate', async channel => {
  try {
    // Récupérer les paramètres depuis l'API
    const settings = await settingsManager.getSettings(channel.guild.id);

    // Logging depuis API
    if (settings.support && settings.support.logs) {
      const logChannel = channel.guild.channels.cache.get(settings.support.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('➕ Salon créé')
          .setDescription(`**Nom:** ${channel.name}\n**Type:** ${channel.type}\n**ID:** ${channel.id}`)
          .setColor(0x800080)
          .setFooter({ text: 'ExoBot #Z © 2025' });
        logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  } catch (error) {
    console.warn(`[channelCreate] Erreur pour ${channel.guild.id}:`, error.message);
    // Fallback aux anciens comportements si API indisponible
  }
});

client.on('channelDelete', async channel => {
  try {
    // Récupérer les paramètres depuis l'API
    const settings = await settingsManager.getSettings(channel.guild.id);

    // Logging depuis API
    if (settings.support && settings.support.logs) {
      const logChannel = channel.guild.channels.cache.get(settings.support.logChannel);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('➖ Salon supprimé')
          .setDescription(`**Nom:** ${channel.name}\n**Type:** ${channel.type}\n**ID:** ${channel.id}`)
          .setColor(0x800080)
          .setFooter({ text: 'ExoBot #Z © 2025' });
        logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }
  } catch (error) {
    console.warn(`[channelDelete] Erreur pour ${channel.guild.id}:`, error.message);
    // Fallback aux anciens comportements si API indisponible
  }
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    // Check if owner only
    if (command.ownerOnly && !client.config.owners.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ Vous n\'êtes pas autorisé à utiliser cette commande propriétaire.', ephemeral: true });
    }

    // Check permissions
    if (command.permissions && interaction.member && !interaction.member.permissions.has(command.permissions)) {
      // Allow owners to bypass permission checks
      if (!client.config.owners.includes(interaction.user.id)) {
        return interaction.reply({ content: '❌ Vous n\'avez pas les permissions requises.', ephemeral: true });
      }
    }

    try {
      await command.execute(interaction, null, client);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: '❌ Il y a eu une erreur lors de l\'exécution de cette commande.', ephemeral: true });
    }
  } else if (interaction.isButton()) {
    // 2FA bouton
    if (interaction.customId.startsWith('2fa_confirm_')) {
      const [ , , userId, guildId ] = interaction.customId.split('_');
      if (interaction.user.id !== userId) return interaction.reply({ content: '❌ Ce bouton n’est pas pour toi.', ephemeral: true });

      const config = get2FAConfig(guildId);
      if (!config.enabled || !config.roleId) return interaction.reply({ content: '❌ 2FA non configuré.', ephemeral: true });

      const guild = client.guilds.cache.get(guildId);
      const member = guild ? guild.members.cache.get(userId) : null;
      if (!member) return interaction.reply({ content: '❌ Utilisateur introuvable.', ephemeral: true });

      await member.roles.add(config.roleId).catch(() => {});

      // Ajout du rôle autorole après validation 2FA
      const autoroleConfig = getAutoroleConfig(guildId);
      if (autoroleConfig.roleId) {
        try {
          await member.roles.add(autoroleConfig.roleId);
        } catch (e) {
          // Impossible d'ajouter le rôle (permissions ?)
        }
      }

      await interaction.reply({ content: '✅ Tu es vérifié et as accès au serveur !', ephemeral: true });
      return;
    }

    // ...autres boutons (tickets, etc)...
    if (interaction.customId.startsWith('open_ticket')) {
      // Check if user already has an open ticket
      const existingTicket = interaction.guild.channels.cache.find(channel =>
        channel.name.startsWith('ticket-') && channel.topic === interaction.user.id
      );

      if (existingTicket) {
        return interaction.reply({ content: '❌ Vous avez déjà un ticket ouvert.', ephemeral: true });
      }

      try {
        // Extract category ID from customId
        const categoryId = interaction.customId.split('_')[2];

        // Create the ticket channel in the specified category
        const ticketChannel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username}`,
          type: 0, // Text channel
          parent: categoryId,
          topic: interaction.user.id,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: ['ViewChannel'],
            },
            {
              id: interaction.user.id,
              allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
            },
            {
              id: client.config.owners[0], // Assuming first owner is staff
              allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'],
            },
          ],
        });

        const embed = new EmbedBuilder()
          .setTitle('🎫 Nouveau Ticket')
          .setDescription(`Bienvenue ${interaction.user}! Un membre du staff va vous aider bientôt.`)
          .setColor('#00FF00')
          .setFooter({ text: 'ExoBot Support © 2025' });

        await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [embed] });

        await interaction.reply({ content: `✅ Votre ticket a été créé : ${ticketChannel}`, ephemeral: true });
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ Erreur lors de la création du ticket.', ephemeral: true });
      }
    }
  }
});

client.on('messageCreate', async message => {
  // Check for bad words first (for all messages)
  if (!message.author.bot && message.guild) {
    try {
      // Récupérer les paramètres depuis l'API
      const settings = await settingsManager.getSettings(message.guild.id);

      // Skip bad words check for owners
      if (!client.config.owners.includes(message.author.id)) {
        // Vérifier le filtrage de mots depuis API
        if (settings.moderation && settings.moderation.wordFilter && settings.moderation.bannedWords) {
          const bannedWords = settings.moderation.bannedWords.split(',').map(word => word.trim().toLowerCase());
          const content = message.content.toLowerCase();
          const foundBadWord = bannedWords.find(word => content.includes(word));

          if (foundBadWord) {
            try {
              await message.delete();
              const warning = await message.channel.send(`${message.author}, votre message contenait un mot interdit et a été supprimé.`);
              setTimeout(() => warning.delete().catch(() => {}), 5000);
            } catch (error) {
              console.error('Erreur lors de la suppression du message:', error);
            }
            return;
          }
        }

        // Vérifier le filtrage de liens depuis API
        if (settings.moderation && settings.moderation.linkFilter) {
          const linkRegex = /https?:\/\/[^\s]+/g;
          const links = message.content.match(linkRegex);
          if (links) {
            const allowedDomains = settings.moderation.allowedDomains ? settings.moderation.allowedDomains.split(',').map(d => d.trim().toLowerCase()) : [];
            const hasUnauthorizedLink = links.some(link => {
              const domain = link.toLowerCase().match(/https?:\/\/([^\/]+)/)?.[1];
              return domain && !allowedDomains.some(allowed => domain.includes(allowed));
            });

            if (hasUnauthorizedLink) {
              try {
                await message.delete();
                const warning = await message.channel.send(`${message.author}, les liens externes ne sont pas autorisés ici.`);
                setTimeout(() => warning.delete().catch(() => {}), 5000);
              } catch (error) {
                console.error('Erreur lors de la suppression du message avec lien:', error);
              }
              return;
            }
          }
        }
      }
    } catch (error) {
      console.warn(`[messageCreate] Erreur récupération paramètres pour ${message.guild.id}:`, error.message);
      // Fallback aux anciens comportements si API indisponible
      if (!client.config.owners.includes(message.author.id)) {
        const badwordsPath = `./badwords/${message.guild.id}.json`;
        if (fs.existsSync(badwordsPath)) {
          const badwords = JSON.parse(fs.readFileSync(badwordsPath, 'utf8'));
          const content = message.content.toLowerCase();
          const foundBadWord = badwords.find(word => content.includes(word));

          if (foundBadWord) {
            try {
              await message.delete();
              const warning = await message.channel.send(`${message.author}, votre message contenait un mot interdit et a été supprimé.`);
              setTimeout(() => warning.delete().catch(() => {}), 5000);
            } catch (error) {
              console.error('Erreur lors de la suppression du message:', error);
            }
            return;
          }
        }
      }
    }
  }

  // Check if it's a command
  if (!message.content.startsWith(config.prefix) || message.author.bot || !message.guild) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  // Check if owner only
  if (command.ownerOnly && !client.config.owners.includes(message.author.id)) {
    return message.reply('❌ Vous n\'êtes pas autorisé à utiliser cette commande propriétaire.');
  }

  // Check permissions
  if (command.permissions && !message.member.permissions.has(command.permissions)) {
    // Allow owners to bypass permission checks
    if (!client.config.owners.includes(message.author.id)) {
      return message.reply('❌ Vous n\'avez pas les permissions requises.');
    }
  }

  try {
    await command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    message.reply('❌ Il y a eu une erreur lors de l\'exécution de cette commande.');
  }
});

client.on('messageCreate', async message => {
  // Vérifie que le message vient d’un DM (type === 1) et pas d’un bot
  if (message.channel.type !== 1 || message.author.bot) return;

  const content = message.content.toLowerCase().trim();
  const isHelp = content.includes('help') || content.includes('aide') || content.includes('comment t’utiliser');
  const isBug = content.includes('bug') || content.includes('erreur') || content.includes('problème') || content.includes('probleme');
  const isSuggestion = content.includes('suggest') || content.includes('idée') || content.includes('idee') || content.includes('amélioration') || content.includes('amelioration');
  const isFAQ = content.includes('faq') || content.includes('question') || content.includes('comment');

// 🟣 HELP
if (isHelp) {
  const embed = new EmbedBuilder()
    .setTitle('📬 Help ExoBot')
    .setColor(0x8a2be2)
    .setDescription(
      `Salut ! Je suis **ExoBot**, ton assistant Discord multifonction 💫\n\n` +
      `🧠 Mon but est de t’aider, même en message privé !\n\n` +
      `💡 **Commandes utiles :**\n` +
      `\`help\` - Affiche ce message\n` +
      `\`bug\` - Signale un bug\n` +
      `\`suggest\` - Envoie une suggestion\n` +
      `\`userinfo <ID>\` - Recherche un utilisateur Discord\n\n` +
      `🔗 **Lien du support :** [clique ici](https://discord.gg/kmguvp4knA)\n` +
      `🌐 **Site Web :** [juste ici](https://klioxt.github.io/exobot-website/)`
    )
    .setFooter({ text: 'ExoBot #Z © 2025' });

  return message.reply({ embeds: [embed] });
}

  // 🟣 FAQ
  if (isFAQ) {
    const embed = new EmbedBuilder()
      .setTitle('❓ FAQ ExoBot')
      .setColor(0x8a2be2)
      .setDescription(
        `**Comment t’utiliser ?**\n→ Envoie des commandes comme \`help\`, \`bug\`, ou \`suggest\` directement ici ou sur un serveur.\n\n` +
        `**Comment signaler un bug ?**\n→ Écris simplement “bug” ou “problème”, et je te guiderai.\n\n` +
        `**Tu as une question ?**\n→ Pose-la directement ici, je te redirigerai vers la bonne commande.`
      )
      .setFooter({ text: 'ExoBot #Z © 2025' });

    return message.reply({ embeds: [embed] });
  }

  // 🟣 BUG SYSTEM
  if (isBug) {
    const embed = new EmbedBuilder()
      .setTitle('🐞 Signalement de bug')
      .setColor(0x8a2be2)
      .setDescription(
        `Merci de décrire le **bug ou problème** que tu veux signaler.\n\n` +
        `> 🛑 Clique sur la réaction 🛑 ci-dessous pour **annuler le signalement**.\n\n` +
        `Exemple : “Le bot ne répond pas à /help sur mon serveur.”`
      )
      .setFooter({ text: 'ExoBot #Z © 2025' });

    const prompt = await message.reply({ embeds: [embed] });
    await prompt.react('🛑');

    let cancelled = false;

    const filterReaction = (reaction, user) => reaction.emoji.name === '🛑' && user.id === message.author.id;
    const reactionCollector = prompt.createReactionCollector({ filter: filterReaction, time: 60000 });

    const filterMessage = m => m.author.id === message.author.id;
    const msgCollector = message.channel.createMessageCollector({ filter: filterMessage, time: 60000, max: 1 });

    reactionCollector.on('collect', async () => {
      cancelled = true;
      await message.reply('🚫 Signalement annulé.');
      reactionCollector.stop();
      msgCollector.stop();
    });

    msgCollector.on('collect', async m => {
      if (cancelled) return;
      const bugDescription = m.content.trim();
      if (!bugDescription) return message.reply('❌ Aucun texte reçu, annulation du signalement.');

      const reportChannelId = '1425442993204101180'; // ton salon de bugs
      const reportChannel = client.channels.cache.get(reportChannelId);
      if (!reportChannel) return message.reply('⚠️ Impossible d’envoyer le rapport : salon introuvable.');

      const bugEmbed = new EmbedBuilder()
        .setTitle('🐞 Nouveau bug signalé')
        .setColor(0xff5555)
        .addFields(
          { name: '👤 Auteur', value: `${m.author.tag} (${m.author.id})` },
          { name: '📝 Description', value: bugDescription },
          { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:F>` },
        )
        .setFooter({ text: 'ExoBot #Z © 2025' });

      await reportChannel.send({ embeds: [bugEmbed] });
      await message.reply('✅ Ton rapport de bug a bien été envoyé à l’équipe, merci !');
      reactionCollector.stop();
    });

    msgCollector.on('end', collected => {
      if (!cancelled && collected.size === 0) message.reply('⏳ Temps écoulé, signalement annulé.');
    });

    return;
  }

  // 🟣 SUGGESTION SYSTEM
  if (isSuggestion) {
    const embed = new EmbedBuilder()
      .setTitle('💡 Nouvelle suggestion')
      .setColor(0x8a2be2)
      .setDescription(
        `Merci d’écrire ta **suggestion ou idée d’amélioration** ci-dessous !\n\n` +
        `> 🛑 Clique sur la réaction 🛑 pour **annuler** si tu changes d’avis.`
      )
      .setFooter({ text: 'ExoBot #Z © 2025' });

    const prompt = await message.reply({ embeds: [embed] });
    await prompt.react('🛑');

    let cancelled = false;

    const filterReaction = (reaction, user) => reaction.emoji.name === '🛑' && user.id === message.author.id;
    const reactionCollector = prompt.createReactionCollector({ filter: filterReaction, time: 60000 });

    const filterMessage = m => m.author.id === message.author.id;
    const msgCollector = message.channel.createMessageCollector({ filter: filterMessage, time: 60000, max: 1 });

    reactionCollector.on('collect', async () => {
      cancelled = true;
      await message.reply('🚫 Suggestion annulée.');
      reactionCollector.stop();
      msgCollector.stop();
    });

    msgCollector.on('collect', async m => {
      if (cancelled) return;
      const suggestion = m.content.trim();
      if (!suggestion) return message.reply('❌ Aucun texte reçu, annulation.');

      const suggestionChannelId = '1425784006628081698';
      const suggestionChannel = client.channels.cache.get(suggestionChannelId);
      if (!suggestionChannel) return message.reply('⚠️ Impossible d’envoyer la suggestion : salon introuvable.');

      const suggestEmbed = new EmbedBuilder()
        .setTitle('💡 Nouvelle suggestion reçue')
        .setColor(0x8a2be2)
        .addFields(
          { name: '👤 Auteur', value: `${m.author.tag} (${m.author.id})` },
          { name: '💬 Suggestion', value: suggestion },
          { name: '📅 Date', value: `<t:${Math.floor(Date.now() / 1000)}:F>` },
        )
        .setFooter({ text: 'ExoBot #Z © 2025' });

      await suggestionChannel.send({ embeds: [suggestEmbed] });
      await message.reply('✅ Ta suggestion a bien été envoyée à l’équipe, merci !');
      reactionCollector.stop();
    });

    msgCollector.on('end', collected => {
      if (!cancelled && collected.size === 0) message.reply('⏳ Temps écoulé, suggestion annulée.');
    });
  }
});



client.login(process.env.TOKEN);