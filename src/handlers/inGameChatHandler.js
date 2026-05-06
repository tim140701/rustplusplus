/*
    Copyright (C) 2023 Alexander Emanuelsson (alexemanuelol)

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.

    https://github.com/alexemanuelol/rustplusplus

*/

const Constants = require("../util/constants");

const RANDOM_PREFIX_LENGTH = 6;
const RANDOM_PREFIX_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

module.exports = {
    inGameChatHandler: async function (rustplus, client, message = null) {
        const guildId = rustplus.guildId;
        const generalSettings = rustplus.generalSettings;
        const commandDelayMs = parseInt(generalSettings.commandDelay) * 1000;
        const trademark = generalSettings.trademark;
        const trademarkString = (trademark === 'NOT SHOWING') ? '' : `${trademark} | `;

        /* Time to write a message from the queue. If message === null, that means that its a timer call. */
        if (message === null) {
            if (rustplus.inGameChatQueue.length !== 0) {
                clearTimeout(rustplus.inGameChatTimeout);
                rustplus.inGameChatTimeout = null;

                const messageFromQueue = rustplus.inGameChatQueue[0];
                rustplus.inGameChatQueue = rustplus.inGameChatQueue.slice(1);

                rustplus.updateBotMessages(messageFromQueue);

                rustplus.sendTeamMessageAsync(messageFromQueue);
                rustplus.log(client.intlGet(guildId, 'messageCap'), messageFromQueue);
            }
            else {
                clearTimeout(rustplus.inGameChatTimeout);
                rustplus.inGameChatTimeout = null;
            }
        }

        /* if there is a new message, add message to queue. */
        if (message !== null) {
            if (rustplus.team === null || rustplus.team.allOffline ||
                rustplus.generalSettings.muteInGameBotMessages) {
                return;
            }

            if (Array.isArray(message)) {
                for (const msg of message) {
                    handleMessage(rustplus, msg, trademarkString)
                }
            }
            else if (typeof message === 'string') {
                handleMessage(rustplus, message, trademarkString)
            }
        }

        /* Start new timer? */
        if (rustplus.inGameChatQueue.length !== 0 && rustplus.inGameChatTimeout === null) {
            rustplus.inGameChatTimeout = setTimeout(module.exports.inGameChatHandler, commandDelayMs, rustplus, client);
        }
    },
};

function handleMessage(rustplus, message, trademarkString) {
    if (typeof message !== 'string') return;

    const messagePrefix = `${getRandomPrefix()} ${trademarkString}`;
    const maxLength = Constants.MAX_LENGTH_TEAM_MESSAGE - messagePrefix.length;
    const strings = message.match(new RegExp(`.{1,${maxLength}}(\\s|$)`, 'g'));

    for (const str of strings) {
        rustplus.inGameChatQueue.push(`${messagePrefix}${str}`);
    }
}

function getRandomPrefix() {
    let prefix = '';
    for (let i = 0; i < RANDOM_PREFIX_LENGTH; i++) {
        const index = Math.floor(Math.random() * RANDOM_PREFIX_CHARS.length);
        prefix += RANDOM_PREFIX_CHARS[index];
    }

    return `[${prefix}]`;
}
