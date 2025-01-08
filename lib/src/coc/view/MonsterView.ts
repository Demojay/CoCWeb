import { Monster } from "../../../../classes/classes/Monster";
import { GameModel } from "../../../../classes/coc/model/GameModel";
import { trace } from "../../../../classes/console";
import { loadId } from "./LoadUtils";
import { NameView } from "./NameView";
import { OtherKeys, StatKeys } from "./StatsView";
import { StatView, StatViewWithBar } from "./StatView";

export class MonsterView {
    
    private model: GameModel;
    private element: HTMLElement;
    private name: NameView;
    private monster?: Monster;

    private stats = {} as Record<StatKeys, StatViewWithBar> & Record<OtherKeys, StatView>;

    private oldStats = {} as Record<"hp" | "lust" | "fatigue", number>;

    //Override variable that is used to make sure monster view is still hidden in defeat/victory scenes, even when still technically in combat
    public showView:Boolean = true;
    

    public constructor(model: GameModel) {
        this.model = model;
        this.element = loadId("monsterstatusPanel");
        this.name = new NameView("monsterNameDisplay");

        this.stats.hp = new StatViewWithBar('monsterhpPanel', 'HP');
        this.stats.lust = new StatViewWithBar('monsterLustPanel', 'Lust');
        this.stats.fatigue = new StatViewWithBar('monsterFatiguePanel', 'Fatigue');
    }

    public show() {
        this.refresh();
        this.element.classList.remove("hidden");
    }

    public hide() {
        this.hideArrows();
        this.element.classList.add("hidden");
    }

    public dim() {
        this.element.classList.add("dim");
    }
    
    public brighten() {
        this.element.classList.remove("dim");
    }

    public setMonster(monster: Monster) {
        this.monster = monster;
        this.resetOldStats();
    }

    public hideArrows() {
        this.stats.hp.hideArrows();
        this.stats.lust.hideArrows();
        this.stats.fatigue.hideArrows();
    }

    public resetOldStats() {
        if (this.monster) {
            this.oldStats.hp = this.monster.HP;
            this.oldStats.lust = this.monster.lust;
            this.oldStats.fatigue = this.monster.fatigue;
        }
    }

    public refresh(newMonster?: Monster) {
        if (newMonster) {
            this.monster = newMonster;
        }

        if (this.monster) {

            this.name.setText(this.monster.short);

            if (this.oldStats.hp && (this.oldStats.hp > this.monster.HP)) {
                this.stats.hp.showDown();
            } else if (this.oldStats.hp && (this.oldStats.hp < this.monster.HP)){
                this.stats.hp.showUp();
            }

            if (this.oldStats.lust && (this.oldStats.lust > this.monster.lust)) {
                this.stats.lust.showDown();
            } else if (this.oldStats.lust && (this.oldStats.lust < this.monster.lust)){
                this.stats.lust.showUp();
            }

            if (this.oldStats.fatigue && (this.oldStats.fatigue > this.monster.fatigue)) {
                this.stats.fatigue.showDown();
            } else if (this.oldStats.fatigue && (this.oldStats.fatigue < this.monster.fatigue)){
                this.stats.fatigue.showUp();
            }

            const maxHP = this.monster.eMaxHP();
            const maxLust = 100;
            const maxFatique = 100;

            this.stats.hp.setMaxNumber(maxHP);
            this.stats.lust.setMaxNumber(maxLust);
            this.stats.fatigue.setMaxNumber(maxFatique);

            this.stats.hp.setNumber(this.monster.HP);
            this.stats.lust.setNumber(this.monster.lust);
            this.stats.fatigue.setNumber(this.monster.fatigue);

            this.stats.hp.setBar(this.monster.HPRatio());
            this.stats.lust.setBar(this.monster.lust / maxLust);
            this.stats.fatigue.setBar(this.monster.fatigue / maxFatique);

            this.resetOldStats();

            //Dim/Brighten monster details depending on whether the enemy has been defeated yet
            if ((this.monster.HP <= 0) || (this.monster.lust >= maxLust)) {
                this.dim();
            } else {
                this.brighten();
            }

        }

        

    }
}