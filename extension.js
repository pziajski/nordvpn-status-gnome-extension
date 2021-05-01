/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

// TODO what does text domain mean???
const GETTEXT_DOMAIN = 'my-indicator-extension';

const { Clutter, GObject, St, GLib } = imports.gi;

// deals with text translations
const Gettext = imports.gettext.domain(GETTEXT_DOMAIN);
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

let connectionStatus, timeout;

function extensionLog(message) {
    log("[Nordvpn Status] " + message);
}

function setConnectionStatus() {
    var [ok, out, err, exit] = GLib.spawn_command_line_sync('nordvpn status');
    const bytesToString = String.fromCharCode(...out);
    let statusString = bytesToString.split('\n')[0].split(': ')[1];
    if (connectionStatus.get_text() !== statusString) {
        connectionStatus.set_text(statusString);
    }
    return true;
}

const Indicator = GObject.registerClass(
class Indicator extends PanelMenu.Button {
    _init() {
        // TODO my shiny indicator? what?
        super._init(0.0, _('My Shiny Indicator'));
        
        connectionStatus = new St.Label({
            style_class: "connectionStatusText",
            text: "Loading...",
            y_align: Clutter.ActorAlign.CENTER
        })

        // display icon in statusbar
        this.add_child(connectionStatus);

        let connect = new PopupMenu.PopupMenuItem(_('Connect'));
        // item.connect('activate', () => {
        //     Main.notify(_('Whatʼs up, folks?'));
        // });
        this.menu.addMenuItem(connect);

        let disconnect = new PopupMenu.PopupMenuItem(_('Disconnect'));
        this.menu.addMenuItem(disconnect);

        // setConnectionStatus();
        extensionLog("initialize complete");
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;

        ExtensionUtils.initTranslations(GETTEXT_DOMAIN);
    }

    enable() {
        extensionLog("enabling...");
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator, -1, 'center'); // TODO change to set dynamically
        timeout = Mainloop.timeout_add_seconds(1.0, setConnectionStatus);
    }

    disable() {
        extensionLog("disabling...");
        Mainloop.source_remove(timeout);
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
