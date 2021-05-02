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

const { Clutter, GObject, St, GLib } = imports.gi;

const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Gettext.gettext;

function extensionLog(message) {
    log("[Nordvpn Status] " + message);
}

const NordvpnStatus = GObject.registerClass(
class NordvpnStatus extends PanelMenu.Button {
    _connectionStatus;

    _init() {
        super._init(0.0, _('NordvpnStatus'));
        
        this._connectionStatus = new St.Label({
            style_class: "connectionStatusText",
            text: "Loading...",
            y_align: Clutter.ActorAlign.CENTER
        })

        this.add_child(this._connectionStatus);

        // let connect = new PopupMenu.PopupMenuItem(_('Connect'));
        // item.connect('activate', () => {
        //     Main.notify(_('Whatʼs up, folks?'));
        // });
        // this.menu.addMenuItem(connect);

        // let disconnect = new PopupMenu.PopupMenuItem(_('Disconnect'));
        // this.menu.addMenuItem(disconnect);

        this._getStatustimeout = Mainloop.timeout_add_seconds(1.0, () => this._updateConnectionStatus());
        extensionLog("initialize complete");
    }

    _updateConnectionStatus() {
        var [_ok, out, _err, _exit] = GLib.spawn_command_line_sync('nordvpn status');
        
        // convert ByteArray to String to get certain lines easier
        const bytesToString = String.fromCharCode(...out);

        // get only connection status
        const statusString = bytesToString.split('\n')[0].split(': ')[1];
        if (this._connectionStatus.get_text() !== statusString) {
            this._connectionStatus.set_text(statusString);
        }
        return true;
    }

    destroy() {
        Mainloop.source_remove(this._getStatustimeout);
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
        ExtensionUtils.initTranslations(Me.metadata['gettext-domain']);
    }

    enable() {
        extensionLog("enabling...");
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this._uuid, this._indicator, -1, 'center');
        // TODO ^ change to set dynamically
    }

    disable() {
        extensionLog("disabling...");
        this._indicator.destroy();
        this._indicator = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
