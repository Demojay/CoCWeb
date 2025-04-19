import { loadClass } from "./LoadUtils";

export class CoCButton {
    private button: HTMLElement;
    private tooltip?: HTMLElement;
    private _toolTipText: string;
    private _toolTipHeader: string;
    private _disabled: boolean;

    protected _callback?: () => void;

    public constructor(
        protected element: HTMLElement
    ) {
        this.button = loadClass('button', element);
        this.tooltip = element.getElementsByClassName('tooltip')[0] as HTMLElement;
        this._toolTipText = '';
        this._toolTipHeader = '';
        this._disabled = false;

        this.button.addEventListener('mouseover', () => {
            if (this.toolTipText && this.tooltip)
                this.tooltip.classList.remove('hidden');
        });
        this.button.addEventListener('mouseleave', () => {
            if (this.tooltip)
                this.tooltip.classList.add('hidden');
        });
        this.button.addEventListener('click', () => {
            if (this.tooltip && !this._disabled)
                this.tooltip.classList.add('hidden');
            if (this._callback && !this._disabled)
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
        if (vis && this.labelText !== '') {
            this.button.classList.remove('hidden');
            this.disabled = this.callback == undefined
        }
        else
            this.button.classList.add('hidden');
    }

    public get disabled() {
        return this._disabled;
    }

    public set disabled(value: boolean) {
        let buttonElement = this.element.querySelector("a");
        if (buttonElement) {
            if (value) {
                buttonElement.classList.add("dim")
            } else {
                buttonElement.classList.remove("dim")
            }
        }
        this._disabled = value;
    }

    //TODO: Add reset and methods from COCX
    public show(label: string, callback?: any, toolTipViewText: string = '', toolTipHeader: string = ''):CoCButton {
        this.labelText = label;
        this.callback = callback? callback: undefined;
        this.toolTipText = toolTipViewText;
        this.toolTipHeader = toolTipHeader;
        this.visible = true;
        this.disabled = this.callback == undefined;
        return this;
    }

    public disableIf(condition:Boolean, toolTipText?: string, toolTipHeader?: string):CoCButton {
        if (condition) {
            this.disabled = true;
            if (toolTipText) this.toolTipText = toolTipText;
            if (toolTipHeader) this.toolTipHeader = toolTipHeader;
        }

        return this;
    }

}
