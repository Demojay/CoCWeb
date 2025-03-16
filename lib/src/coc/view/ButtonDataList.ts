//Imported by Demojay on 13/3/2025, translated from class of same name made by aimozg on 30.09.2017.

import { ButtonData } from "./ButtonData";

export class ButtonDataList {
    constructor(
        public list: Array<ButtonData> = []
    ) {}

    public append(bd:ButtonData) {
		this.list.push(bd);
	}

	public add(text:string, callback?: () => void, toolTipText:string ="", toolTipHeader:string =""):ButtonData {
		const bd:ButtonData = new ButtonData(text,callback,toolTipText,toolTipHeader);
		this.list.push(bd);
		return bd;
	}
	public get(index:number):ButtonData {
		return this.list[index];
	}
	public clear() {
		this.list.splice(0);
	}
	public get length():number {
		return this.list.length;
	}
	public get active():number {
		return this.list.reduce((accumulator, currentValue) => accumulator + (currentValue.visible? 1: 0), 0)
	}
}