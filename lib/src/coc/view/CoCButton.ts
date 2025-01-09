import { loadClass } from "./LoadUtils";

export class CoCButton {
    private button: HTMLElement;
    private tooltip?: HTMLElement;
    private _toolTipText: string;
    private _toolTipHeader: string;

    protected _callback?: () => void;

    public constructor(
        protected element: HTMLElement
    ) {
        this.button = loadClass('button', element);
        this.tooltip = element.getElementsByClassName('tooltip')[0] as HTMLElement;
        this._toolTipText = '';
        this._toolTipHeader = '';

        this.button.addEventListener('mouseover', () => {
            if (this.toolTipText && this.tooltip)
                this.tooltip.classList.remove('hidden');
        });
        this.button.addEventListener('mouseleave', () => {
            if (this.tooltip)
                this.tooltip.classList.add('hidden');
        });
        this.button.addEventListener('click', () => {
            if (this.tooltip)
                this.tooltip.classList.add('hidden');
            if (this._callback)
                this._callback();
        });
    };

    public click() {
        this.button.click();
    }

    private createToolTip() {
        if (this.tooltip) {
            let text = '';

            if (this._toolTipHeader) {
                text = `<span class="toolTipHeader">${this._toolTipHeader}</span><hr>`;
            }

            if (this._toolTipText) {
                text += this._toolTipText;
            }

            this.tooltip.innerHTML = text;
        }
    }

    //////// Getters and Setters ////////

    public get toolTipText() {
        return this._toolTipText;
    }

    public set toolTipText(text) {
        this._toolTipText = text;
        this.createToolTip();
    }

    public get toolTipHeader() {
        return this._toolTipHeader;
    }

    public set toolTipHeader(text) {
        this._toolTipHeader = text;
        this.createToolTip();
    }

    public get labelText() {
        return this.button.innerHTML || '';
    };

    public set labelText(value) {
        this.button.innerHTML = value;
    };

    public get callback() {
        return this._callback;
    };

    public set callback(value) {
        this._callback = value;
    };

    public get visible() {
        return !this.button.classList.contains('hidden');
    }

    public set visible(vis) {
        if (vis && this.labelText !== '' && this._callback !== undefined)
            this.button.classList.remove('hidden');
        else
            this.button.classList.add('hidden');
    }

    public get disabled() {
        if (this.element instanceof HTMLButtonElement) {
            return (this.element as HTMLButtonElement).disabled;
        }
        return false;
    }

    public set disabled(value: boolean) {
       if (this.element instanceof HTMLButtonElement) {
        if (value) {
            this.element.classList.add("disabled");
        } else {
            this.element.classList.remove("disabled");
        }
        (this.element as HTMLButtonElement).disabled = value;
       } 
    }

}
