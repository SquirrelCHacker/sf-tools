class FloatingPopup {
    constructor (closeable = true) {
        this.closeable = closeable;
    }

    open () {
        return new Promise((resolve, reject) => {
            this.resolvePromise = resolve;

            if (!this._hasParent()) {
                this.$parent = $(this._createModal()).appendTo($('body').first());

                this._createModal();
                this._createBindings();
            }

            this._show();
        });
    }

    close () {
        this._hide();
    }

    _hasParent () {
        return typeof this.$parent !== 'undefined'
    }

    _createModal () {
        return '';
    }

    _createBindings () {

    }

    _show () {
        this.$parent.modal({
            centered: true,
            transition: 'fade',
            closable: this.closeable,
            onHidden: () => this.resolvePromise(),
            duration: 0
        }).modal('show');
    }

    _hide () {
        this.$parent.modal('hide');
    }
}

class UncloseableFloatingPopup extends FloatingPopup {
    constructor () {
        super(false);
    }
}

const PopUpController = new (class {
    constructor () {
        this.queue = [];
        this.active = undefined;
    }

    show (popup) {
        if (popup) {
            this.queue.push(popup);

            if (!this.active) {
                this.active = this.queue.shift();
                this.active.open().then(() => {
                    this.active = undefined;
                    this.show(this.queue.shift());
                });
            }
        }
    }
})();

const TermsAndConditionsPopup = new (class extends UncloseableFloatingPopup {
    _createModal () {
        return `
            <div class="ui basic modal">
                <h2 class="ui centered header" style="padding-bottom: 0.5em; text-decoration: underline;">Terms and Conditions</h2>
                <h4 class="ui centered header" style="padding-top: 0; color: orange;">§1 General use</h4>
                <div style="padding-right: 15em; padding-left: 15em;">
                    <ul style="margin-top: 0; line-height: 1.3em;">
                        <li>It is advised to never share HAR files as they <b>might</b> contain private data such as IP address and cookies.</li>
                        <li style="margin-top: 0.5em;">The site is distributed <b>AS IS</b> wthout any warranties. You are fully responsible for use of this site.</li>
                        <li style="margin-top: 0.5em;">You're free to share, copy and modify the site, but you are not allowed to distribute it or any of it's parts without explicit approval.</li>
                        <li style="margin-top: 0.5em;">You agree to limit data collection from the game to reasonable amounts.</li>
                        <li style="margin-top: 0.5em;">You agree to follow the Shakes & Fidget <a href="https://cdn.playa-games.com/res/sfgame3/legal/html/terms_en.html">Terms and Conditions</a></li>
                        <li style="margin-top: 0.5em;">You are not allowed to automate any part of this tool.</li>
                    </ul>
                </div>
                <h4 class="ui centered header" style="padding-top: 0; color: orange;">§2 Endpoint</h4>
                <div style="padding-right: 15em; padding-left: 15em;">
                    <ul style="margin-top: 0; line-height: 1.3em;">
                        <li>Endpoint is a Unity application bundled with the tool that allows you to log into the game and collect limited data about yourself and your guild members without the lengthy process of creating a HAR file.</li>
                        <li style="margin-top: 0.5em;">It is not possible to capture any other players than those listed above.</li>
                        <li style="margin-top: 0.5em;">Everything happens locally in a identical way to playing the game through browser.</li>
                    </ul>
                </div>
                <h4 class="ui centered header" style="padding-top: 0; color: orange;">§3 Integrated share service</h4>
                <div style="padding-right: 15em; padding-left: 15em;">
                    <ul style="margin-top: 0; line-height: 1.3em;">
                        <li>All data shared via the integrated share function is not protected in any other way other than the share key.</li>
                        <li style="margin-top: 0.5em;">The shared data might be deleted at any point of time, up to full 2 days.</li>
                    </ul>
                </div>
                <h4 class="ui centered header" style="padding-top: 0; color: orange;">§4 Sentry</h4>
                <div style="padding-right: 15em; padding-left: 15em;">
                    <ul style="margin-top: 0; line-height: 1.3em;">
                        <li>All errors raised during use of this tool will be reported via Sentry.io tool.</li>
                        <li style="margin-top: 0.5em;">These reports are anonymous so that it's not possible to track their origin.</li>
                    </ul>
                </div>
                <button class="ui green fluid button" style="width: 30%; margin-left: 35%; margin-right: 35%; margin-top: 2em;" data-op="accept">I understand & accept these terms</button>
            </div>
        `;
    }

    _createBindings () {
        this.$parent.find('[data-op="accept"]').click(() => {
            SiteOptions.terms_accepted = true;
            this.close();
        });
    }
})();

const ChangeLogPopup = new (class extends UncloseableFloatingPopup {
    _createModal () {
        const release = MODULE_VERSION;
        const entries = CHANGELOG[release];

        let content = '';
        if (Array.isArray(entries)) {
            for (const entry of entries) {
                content += `
                    <li style="margin-top: 0.5em;">${entry}</li>
                `
            }
        } else if (entries) {
            for (const [ category, changes ] of Object.entries(entries)) {
                content += `<h4 class="ui header" style="color: orange; margin-left: -1em; margin-bottom: 0;">${category}</h4>`
                for (const entry of changes) {
                    content += `
                        <li style="margin-top: 0.5em;">${entry}</li>
                    `
                }
            }
        } else {
            content = '<p style="text-align: center; margin-top: 20%; margin-bottom: 20%;"><b>Changes are yet to be announced</b></p>'
        }

        return `
            <div class="ui basic modal">
                <h2 class="ui centered header" style="padding-bottom: 0.5em;">Release <span style="color: orange;">${release}</span></h2>
                <div style="text-align: left; margin-left: 15em; margin-right: 15em; line-height: 1.3em; max-height: 50vh; overflow-y: scroll;">
                    <ul>
                        ${content}
                    </ul>
                </div>
                <button class="ui black fluid button" style="width: 30%; margin-left: 35%; margin-right: 35%; margin-top: 2em;" data-op="accept">Continue</button>
            </div>
        `;
    }

    _createBindings () {
        this.$parent.find('[data-op="accept"]').click(() => {
            SiteOptions.version_accepted = MODULE_VERSION;
            this.close();
        });
    }
})();

// Automatically open Terms and Conditions if not accepted yet
document.addEventListener("DOMContentLoaded", function() {
    if (!SiteOptions.terms_accepted) {
        PopUpController.show(TermsAndConditionsPopup);
    }

    if (SiteOptions.version_accepted != MODULE_VERSION) {
        PopUpController.show(ChangeLogPopup);
    }
});