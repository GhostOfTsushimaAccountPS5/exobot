const axios = require('axios');
require('dotenv').config();

class SettingsManager {
  constructor() {
    this.apiBase = process.env.DASHBOARD_API_URL || 'http://localhost:3001';
    this.settingsCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Récupère les paramètres d'un serveur depuis l'API du dashboard
   * @param {string} guildId - ID du serveur Discord
   * @returns {Promise<Object>} Paramètres du serveur
   */
  async getSettings(guildId) {
    try {
      // Vérifier le cache
      const cached = this.settingsCache.get(guildId);
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        return cached.data;
      }

      const response = await axios.get(`${this.apiBase}/api/settings/${guildId}`, {
        timeout: 5000
      });

      // Mettre en cache
      this.settingsCache.set(guildId, {
        data: response.data,
        timestamp: Date.now()
      });

      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la récupération des paramètres pour ${guildId}:`, error.message);
      // Retourner les paramètres par défaut en cas d'erreur
      return this.getDefaultSettings();
    }
  }

  /**
   * Met à jour les paramètres d'un serveur via l'API du dashboard
   * @param {string} guildId - ID du serveur Discord
   * @param {Object} settings - Nouveaux paramètres
   * @returns {Promise<boolean>} Succès de la mise à jour
   */
  async updateSettings(guildId, settings) {
    try {
      await axios.post(`${this.apiBase}/api/settings/${guildId}`, settings, {
        timeout: 5000
      });

      // Invalider le cache
      this.settingsCache.delete(guildId);

      return true;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour des paramètres pour ${guildId}:`, error.message);
      return false;
    }
  }

  /**
   * Vérifie si une fonctionnalité est activée pour un serveur
   * @param {string} guildId - ID du serveur Discord
   * @param {string} category - Catégorie (moderation, support, utilities, general)
   * @param {string} feature - Nom de la fonctionnalité
   * @returns {Promise<boolean>} État de la fonctionnalité
   */
  async isFeatureEnabled(guildId, category, feature) {
    const settings = await this.getSettings(guildId);
    return settings[category]?.[feature] || false;
  }

  /**
   * Récupère la valeur d'un paramètre pour un serveur
   * @param {string} guildId - ID du serveur Discord
   * @param {string} category - Catégorie
   * @param {string} key - Clé du paramètre
   * @param {*} defaultValue - Valeur par défaut
   * @returns {Promise<*>} Valeur du paramètre
   */
  async getSetting(guildId, category, key, defaultValue = null) {
    const settings = await this.getSettings(guildId);
    return settings[category]?.[key] ?? defaultValue;
  }

  /**
   * Paramètres par défaut
   * @returns {Object} Paramètres par défaut
   */
  getDefaultSettings() {
    return {
      moderation: {
        antiSpam: false,
        spamThreshold: 5,
        linkFilter: false,
        allowedDomains: '',
        wordFilter: false,
        bannedWords: '',
        spamSanction: 'warn',
        linkSanction: 'delete',
        wordSanction: 'delete'
      },
      support: {
        tickets: false,
        ticketCategory: 'Support',
        logs: false,
        logChannel: '#logs',
        antiRaid: false,
        raidThreshold: 10,
        verification: false,
        verificationRole: 'Membre'
      },
      utilities: {
        games: false,
        info: false,
        tools: false
      },
      general: {
        botPrefix: '+',
        botLanguage: 'fr',
        botStatus: 'online',
        botActivity: 'https://guns.lol/0zsw'
      }
    };
  }

  /**
   * Nettoie le cache des paramètres expirés
   */
  cleanCache() {
    const now = Date.now();
    for (const [guildId, cached] of this.settingsCache.entries()) {
      if ((now - cached.timestamp) > this.cacheTimeout) {
        this.settingsCache.delete(guildId);
      }
    }
  }
}

module.exports = new SettingsManager();
