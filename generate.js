let Vertrag = class {
    static createContractSettings() {
        return {
            mindestsparguthaben: 0.4,
            tilgungsbeitrag: 300,
            sollzins: 0.015,
            bausparsumme: 50000,
            kontogebuehr: 15,
            abschlussgebuehr: 550,
            guthabenzins: 0.001,
            startbetrag: 7800,
            monatsbeitrag: 100
        };
    }

    // noinspection JSUnusedGlobalSymbols
    constructor(contractSettings) {
        this.mindestsparguthaben = contractSettings.mindestsparguthaben;
        this.tilgungsbeitrag = contractSettings.tilgungsbeitrag;
        this.sollzins = contractSettings.sollzins;
        this.bausparsumme = contractSettings.bausparsumme;
        this.kontogebuehr = contractSettings.kontogebuehr;
        this.abschlussgebuehr = contractSettings.abschlussgebuehr;
        this.guthabenzins = contractSettings.guthabenzins;
        this.startbetrag = contractSettings.startbetrag;
        this.monatsbeitrag = contractSettings.monatsbeitrag;
    }

    // SPARPLAN ========================================================================================================
    get sparplan() {
        if (!this._sparplan) {
            let currentSparbeitrag = 0;
            let self = this;
            let addYear = function (beitrag, gebuehr) {
                let zins = Math.round(currentSparbeitrag * self.guthabenzins * 100) / 100;
                return {
                    beitrag: beitrag,
                    zins: zins,
                    gebuehr: gebuehr,
                    guthaben: currentSparbeitrag = Math.round((currentSparbeitrag + beitrag + zins - gebuehr) * 100) / 100,
                    opportunity: Math.round((currentSparbeitrag * 0.05) * 100) / 100,
                }
            };
            let sparplan = [addYear(this.startbetrag, this.abschlussgebuehr + this.kontogebuehr)];
            while (currentSparbeitrag < this.mindestsparguthaben * this.bausparsumme) {
                sparplan.push(addYear((12 * this.monatsbeitrag), this.kontogebuehr));
            }
            this._sparplan = sparplan;
        }
        return this._sparplan;
    }

    get summeSparbeitraege() {
        if (!this._summeSparbeitraege) {
            this._summeSparbeitraege = this.sparplan.reduce((accumulator, currentValue) => accumulator + currentValue.beitrag, 0);
        }
        return this._summeSparbeitraege;
    }

    get summeGuthabenzinsen() {
        if (!this._summeGuthabenzinsen) {
            this._summeGuthabenzinsen = this.sparplan.reduce((accumulator, currentValue) => accumulator + currentValue.zins, 0);
        }
        return this._summeGuthabenzinsen;
    }

    get summeGebuehren() {
        if (!this._summeGebuehren) {
            this._summeGebuehren = this.sparplan.reduce((accumulator, currentValue) => accumulator + currentValue.gebuehr, 0);
        }
        return this._summeGebuehren;
    }

    get summeOpportunity() {
        if (!this._summeOpportunity) {
            this._summeOpportunity = this.sparplan.reduce((accumulator, currentValue) => accumulator + currentValue.opportunity, 0);
        }
        return this._summeOpportunity;
    }

    get maxBausparGuthaben() {
        if (!this._maxBausparGuthaben) {
            this._maxBausparGuthaben = this.sparplan[this.sparplan.length - 1].guthaben;
        }
        return this._maxBausparGuthaben;
    }

    // TILGUNGSPLAN ========================================================================================================
    get tilgungsplan() {
        if (!this._tilgungsplan) {
            this._tilgungsplan = [];
            let darlehensstand = this.maxDarlehenssumme;
            let self = this;
            let addYear = function (beitrag) {
                let zins = Math.round(darlehensstand * self.sollzins * 100) / 100;
                darlehensstand = darlehensstand + zins;
                if (darlehensstand < beitrag) {
                    beitrag = darlehensstand;
                }
                return {
                    beitrag: beitrag,
                    zins: zins,
                    guthaben: darlehensstand = Math.round((darlehensstand - beitrag) * 100) / 100
                }
            };

            while (darlehensstand > 0) {
                this._tilgungsplan.push(addYear((12 * this.tilgungsbeitrag)));
            }

        }
        return this._tilgungsplan;
    }

    get summeTilgungsbeitraege() {
        if (!this._summeTilgungsbeitraege) {
            this._summeTilgungsbeitraege = this.tilgungsplan.reduce((accumulator, currentValue) => accumulator + currentValue.beitrag, 0);
        }
        return this._summeTilgungsbeitraege;
    }

    get summeSollzinsen() {
        if (!this._summeSollzinsen) {
            this._summeSollzinsen = this.tilgungsplan.reduce((accumulator, currentValue) => accumulator + currentValue.zins, 0);
        }
        return this._summeSollzinsen;
    }

    get maxDarlehenssumme() {
        if (!this._maxDarlehenssumme) {
            this._maxDarlehenssumme = this.bausparsumme - this.maxBausparGuthaben;
        }
        return this._maxDarlehenssumme;
    }

    // Metrics
    get kosten() {
        if (!this._kosten) {
            this._kosten = this.summeSollzinsen + this.summeGebuehren - this.summeGuthabenzinsen;
        }
        return this._kosten;
    }

    get laufzeit() {
        if (!this._laufzeit) {
            this._laufzeit = this.sparplan.length + this.tilgungsplan.length;
        }
        return this._laufzeit;
    }

    get costPerKredit() {
        if (!this._costPerKredit) {
            this._costPerKredit = this.kosten / this.maxDarlehenssumme;
        }
        return this._costPerKredit;
    }

    get costAndOpportunityPerKredit() {
        if (!this._costAndOpportunityPerKredit) {
            this._costAndOpportunityPerKredit = (this.kosten + this.summeOpportunity) / this.maxDarlehenssumme;
        }
        return this._costAndOpportunityPerKredit;
    }

    // noinspection JSUnusedGlobalSymbols
    toJSON() {
        return {
            mindestsparguthaben: this.mindestsparguthaben,
            tilgungsbeitrag: this.tilgungsbeitrag,
            sollzins: this.sollzins,
            bausparsumme: this.bausparsumme,
            kontogebuehr: this.kontogebuehr,
            abschlussgebuehr: this.abschlussgebuehr,
            guthabenzins: this.guthabenzins,
            startbetrag: this.startbetrag,
            monatsbeitrag: this.monatsbeitrag,
            sparplan: this.sparplan,
            summeSparbeitraege: this.summeSparbeitraege,
            summeGuthabenzinsen: this.summeGuthabenzinsen,
            summeGebuehren: this.summeGebuehren,
            maxBausparGuthaben: this.maxBausparGuthaben,
            summeOpportunity: this.summeOpportunity,
            tilgungsplan: this.tilgungsplan,
            summeTilgungsbeitraege: this.summeTilgungsbeitraege,
            summeSollzinsen: this.summeSollzinsen,
            maxDarlehenssumme: this.maxDarlehenssumme,
            kosten: this.kosten,
            laufzeit: this.laufzeit,
            costPerKredit: this.costPerKredit,
            costAndOpportunityPerKredit: this.costAndOpportunityPerKredit
        }
    }

};

let vertraege = [];

//Existing Contract
let currentConfiguration = Vertrag.createContractSettings();
currentConfiguration.abschlussgebuehr = 500;
currentConfiguration.mindestsparguthaben = 0.3;
currentConfiguration.tilgungsbeitrag = 300;
currentConfiguration.sollzins = 0.028;
currentConfiguration.bausparsumme = 50000;
currentConfiguration.kontogebuehr = 0;
currentConfiguration.guthabenzins = 0.005;
currentConfiguration.startbetrag = 7800;
currentConfiguration.monatsbeitrag = 100;
let currentVertrag = new Vertrag(currentConfiguration);

let configuration = Vertrag.createContractSettings();
//Serie Bausparsumme: 50000 to 125000
for (let bausparsumme = 50000; bausparsumme <= 100000; bausparsumme += 25000) {
    configuration.bausparsumme = bausparsumme;

    if (bausparsumme >= 100000) {
        configuration.sollzins = 0.0125;
      configuration.abschlussgebuehr = 1100;
    }

    //Serie Betrag Einzahlung
    for (let monatsbeitrag = 50; monatsbeitrag <= 500; monatsbeitrag += 50) {
        configuration.monatsbeitrag = monatsbeitrag;

        //Serie Betrag Einzahlung
        for (let tilgungsbeitrag = 300; tilgungsbeitrag <= 1000; tilgungsbeitrag += 50) {
            configuration.tilgungsbeitrag = tilgungsbeitrag;

            if (currentConfiguration.bausparsumme === configuration.bausparsumme &&
                currentConfiguration.monatsbeitrag === configuration.monatsbeitrag &&
                currentConfiguration.tilgungsbeitrag === configuration.tilgungsbeitrag) {
                vertraege.push(currentVertrag);
            } else {
                vertraege.push(new Vertrag(configuration));
            }
        }
   }
}


let dataToWrite = JSON.stringify(vertraege);
let fs = require('fs');

fs.writeFile('list.json', dataToWrite, 'utf8', function (err) {
    if (err) {
        console.log('Some error occured - file either not saved or corrupted file saved.');
    } else {
        console.log('It\'s saved!');
    }
});