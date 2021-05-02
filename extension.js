const { Clutter, GObject, St, GLib } = imports.gi;

const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Gettext = imports.gettext.domain(Me.metadata["gettext-domain"]);
const _ = Gettext.gettext;

const NORDVPN_SERVER_LIST_API = "https://api.nordvpn.com/server";

function extensionLog(message) {
    log("[Nordvpn Status] " + message);
}

const NordvpnStatus = GObject.registerClass(
class NordvpnStatus extends PanelMenu.Button {
    _connectionStatus;

    _init() {
        super._init(0.0, _("NordvpnStatus"));
        
        this._connectionStatus = new St.Label({
            style_class: "connectionStatusText",
            text: "Loading...",
            y_align: Clutter.ActorAlign.CENTER
        })

        this.add_child(this._connectionStatus);

        this._getStatustimeout = Mainloop.timeout_add_seconds(1.0, () => this._updateConnectionStatus());
        extensionLog("initialize complete");
    }

    _updateConnectionStatus() {
        var [_ok, out, _err, _exit] = GLib.spawn_command_line_sync("nordvpn status");
        
        // convert ByteArray to String to get certain lines easier
        const bytesToString = String.fromCharCode(...out);

        const statusData = bytesToString.split("\n");
        const connectionStatus = statusData[0].split(": ")[1];
        if (connectionStatus === "Disconnected" || connectionStatus === "Connecting") {
            if (this._connectionStatus.get_text() !== connectionStatus) {
                this._connectionStatus.set_text(connectionStatus);
            }
        } else if (connectionStatus === "Connected") {
            const server = statusData[1].split(": ")[1];
            if (this._connectionStatus.get_text() !== server) {
                this._connectionStatus.set_text(server);
            }
        }

        return true;
    }

    destroy = () => {
        Mainloop.source_remove(this._getStatustimeout);
    }
});

class Extension {
    constructor(uuid) {
        this._uuid = uuid;
        ExtensionUtils.initTranslations(Me.metadata["gettext-domain"]);
    }

    enable() {
        extensionLog("enabling...");
        this._nordvpnStatus = new NordvpnStatus();
        Main.panel.addToStatusArea(this._uuid, this._nordvpnStatus, -1, "center");
        // TODO ^ change to set dynamically
    }

    disable() {
        extensionLog("disabling...");
        this._nordvpnStatus.destroy();
        this._nordvpnStatus = null;
    }
}

function init(meta) {
    return new Extension(meta.uuid);
}
