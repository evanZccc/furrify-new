const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Wcard } = require('wcard-gen');
const { welcomeCollection } = require('../mongodb');
const data = require('../UI/banners/welcomecards');

async function loadWelcomeConfig() {
    try {
        const configs = await welcomeCollection.find().toArray();
        return configs.reduce((acc, config) => {
            acc[config.serverId] = config;
            return acc;
        }, {});
    } catch (err) {
        return {};
    }
}

function getOrdinalSuffix(number) {
    if (number === 11 || number === 12 || number === 13) {
        return 'th';
    }
    const lastDigit = number % 10;
    switch (lastDigit) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}

function getRandomImage(images) {
    return images[Math.floor(Math.random() * images.length)];
}

function truncateUsername(username, maxLength = 15) {
    return username.length > maxLength ? `${username.slice(0, maxLength)}...` : username;
}

module.exports = async (client) => {
    let welcomeConfig = await loadWelcomeConfig();

    setInterval(async () => {
        welcomeConfig = await loadWelcomeConfig();
    }, 5000);

    client.on('guildMemberAdd', async (member) => {
        const guildId = member.guild.id;
        const settings = welcomeConfig[guildId];

        if (settings && settings.status) {
            const welcomeChannel = member.guild.channels.cache.get(settings.welcomeChannelId);
            if (welcomeChannel) {
                const memberCount = member.guild.memberCount;
                const suffix = getOrdinalSuffix(memberCount);
                const userName = truncateUsername(member.user.username);
                const joinDate = member.joinedAt.toDateString();
                const creationDate = member.user.createdAt.toDateString();
                const serverIcon = member.guild.iconURL({ format: 'png', dynamic: true, size: 256 });
                const randomImage = getRandomImage(data.welcomeImages);
                
               
                const shortTitle = truncateUsername(`Welcome`, 15);

                const welcomecard = new Wcard()
                    .setName(userName)
                    .setAvatar(member.user.displayAvatarURL({ format: 'png' }))
                    .setTitle(shortTitle) // Ensure the title is <= 15 characters
                    .setColor("A020F0")
                    .setBackground(randomImage);
                
                const card = await welcomecard.build();
                const attachment = new AttachmentBuilder(card, { name: 'welcome.png' });
                
                const embed = new EmbedBuilder()
                    .setTitle("Benvenuto su Furrytalia!")
                    .setDescription(`${member}, sei il **${memberCount}${suffix}** membro del server!`)
                    .setColor("#A020F0")
                    .setThumbnail(serverIcon)
                    .setImage('attachment://welcome.png')
                    .addFields(
                        { name: 'Nome Utente', value: userName, inline: true },
                        { name: 'Entrato il', value: joinDate, inline: true },
                        { name: 'Account creato il', value: creationDate, inline: true }
                    )
                    .setFooter({ text: "Siamo felici che tu sia qui!", iconURL: serverIcon })
                    .setAuthor({ name: userName, iconURL: member.user.displayAvatarURL() })
                    .setTimestamp();
                
                welcomeChannel.send({
                    content: `🐾Yaaay a new frien~, awoooo ${member}!`,
                    embeds: [embed],
                    files: [attachment]
                });                
            }
        }
    });
};
