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

    private oldStats = {} as Record<"hp" | "lust" | "fatigue", number>
    

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
        this.element.classList.add("hidden");
        this.hideArrows();
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

            this.stats.hp.setMaxNumber(this.monster.eMaxHP());
            this.stats.lust.setMaxNumber(100);
            this.stats.fatigue.setMaxNumber(100);

            this.stats.hp.setNumber(this.monster.HP);
            this.stats.lust.setNumber(this.monster.lust);
            this.stats.fatigue.setNumber(this.monster.fatigue);

            this.stats.hp.setBar(this.monster.HPRatio());
            this.stats.lust.setBar(this.monster.lust / 100);
            this.stats.fatigue.setBar(this.monster.fatigue / 100);

            this.resetOldStats();

        }

        

    }
}