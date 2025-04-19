import { loadId, loadClass } from "./LoadUtils";

export class StatView {
    public element: HTMLElement;
    public animateText: boolean;
    protected info: HTMLElement;
    protected name: HTMLElement;
    protected numbers: HTMLElement;
    protected currNumber: HTMLElement;

    protected arrowUp: HTMLElement;
    protected arrowDown: HTMLElement;

    protected maxNumber: number;
    protected value: number;

    public animateDuration: number;

    public constructor(id: string, name: string) {
        this.element = loadId(id);

        this.info = loadClass('statInfo', this.element);
        this.name = loadClass('statName', this.element);
        this.name.textContent = name;

        this.numbers = loadClass('statNumbers', this.element);

        this.currNumber = loadClass('statCurrent', this.element);
        this.currNumber.textContent = '0';

        this.arrowUp = loadClass('arrowUp', this.element);
        this.arrowDown = loadClass('arrowDown', this.element);

        this.maxNumber = 0;
        this.value = 0;

        this.animateText = true;
        /**
         * Should be entered in ms
         */
        this.animateDuration = 500;
    }

    protected loadClass(className: string) {
        const element = this.element.getElementsByClassName(className)[0];
        if (!element)
            throw new Error('Could not load "' + className + '" element');
        return element as HTMLElement;
    }

    public setNumber(num: number) {
        const startValue = this.value;
        if (startValue != num) {
            if (this.animateText) {
                this.animateNumber(this.currNumber, startValue, num, this.animateDuration);
            } else {
                this.currNumber.textContent = Math.round(num) + (this.maxNumber > 0? '/' + this.maxNumber: '');
            }
        }
        this.value = num;
    }

    private animateNumber(element:HTMLElement, startValue:number, endValue:number, duration:number) {
        let startTimestamp: DOMHighResTimeStamp = -1;
        const step = (timestamp: DOMHighResTimeStamp) => {
            if (startTimestamp == -1) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            element.textContent = Math.floor(progress * (endValue - startValue) + startValue) + (this.maxNumber > 0? '/' + this.maxNumber: '') ;
            if (progress < 1) {
            window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step)
    }

    public showUp() {
        this.arrowUp.classList.remove('hidden');
        this.arrowDown.classList.add('hidden');
    }

    public showDown() {
        this.arrowUp.classList.add('hidden');
        this.arrowDown.classList.remove('hidden');
    }

    public hideArrows() {
        this.arrowUp.classList.add('hidden');
        this.arrowDown.classList.add('hidden');
    }
    
    public setMaxNumber(num: number) {
        this.maxNumber = Math.round(num);
    }
}

export class StatViewWithBar extends StatView {
    private bar: HTMLElement;
    private _animated: boolean = false;

    public constructor(id: string, name: string) {
        super(id, name);

        this.bar = this.loadClass('statBar');
        this.bar.style.width = '0%';

        this.animated = true;
    }

    public set animated(toAnimate: boolean) {
        if (toAnimate) {
            this.bar.classList.add("animated");
        } else {
            this.bar.classList.remove("animated");
        }
        this._animated = toAnimate;
    }

    public set animationDuration(durationInMS:number) {
        this.bar.style.transitionDuration = durationInMS + "ms";
    }

    public setBar(percent: number) {
        if (percent > 1) percent = 1;
        this.bar.style.width = percent * 100 + '%';
    }
}