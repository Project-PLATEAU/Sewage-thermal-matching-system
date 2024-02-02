import { AppSettings } from "./AppSettings.js";
import { MapObj } from "./MapObj.js";

/** 熱需要値変更 */
class EditHeatDemandAction {
    constructor() {
        /** 「家屋選択」ボタン(熱需要値変更) */
        this.elem = document.getElementById("editHeatDemandAction");
        /** 選択済み家屋Feature */
        this.selectedKaokuFeature = null;

        /** 「熱需要値変更」画面(モーダル) */
        this.modal = document.getElementById("editHeatDemandModal");
        /** 実行ボタン */
        this.saveButton = document.getElementById("heatDemandSaveButton");
        /** ×ボタン */
        this.closeButton = document.getElementById("customCloseButton");
        /** キャンセルボタン */
        this.cancelButton = document.getElementById("heatDemandCancelButton");
        /** エラーメッセージ用divタグ */
        this.editHeatDemandMessage = document.getElementById("editHeatDemandMessage");

        /** 電気 */
        this.denkiInput = document.getElementById("denki");
        /** MJ換算値(電気) */
        this.denkiRate = 9.76;
        /** 都市ガス */
        this.toshiGassInput = document.getElementById("toshiGass");
        /** MJ換算値(都市ガス) */
        this.toshiGassRate = 45;
        /** 灯油 */
        this.touyuInput = document.getElementById("touyu");
        /** MJ換算値(灯油) */
        this.touyuRate = 37;
        /** 重油 */
        this.zyuuyuInput = document.getElementById("zyuuyu");
        /** MJ換算値(重油) */
        this.zyuuyuRate = 41;
        /** 液化石油ガス */
        this.ekikaSekiyuGasuInput = document.getElementById("ekikaSekiyuGass");
        /** MJ換算値(液化石油ガス) */
        this.ekikaSekiyuGasuRate = 50;
        /** 他人から供給された熱 */
        this.taninKyoukyuInput = document.getElementById("taninKyoukyu");
        /** MJ換算値(他人から供給された熱) */
        this.taninKyoukyuRate = 1.36;
    }

    /** モーダルを表示する */
    showModal() {
        this.modal.classList.remove("d-none");
    }

    /** モーダルを閉じる */
    closeModal() {
        this.resetModalValue();
        this.modal.classList.add("d-none");
    }

    /** モーダルの入力値をデフォルトに戻す */
    resetModalValue() {
        this.denkiInput.value = 0;
        this.toshiGassInput.value = 0;
        this.touyuInput.value = 0;
        this.zyuuyuInput.value = 0;
        this.ekikaSekiyuGasuInput.value = 0;
        this.taninKyoukyuInput.value = 0;
        this.selectedKaokuFeature = null;
        this.editHeatDemandMessage.innerHTML = "";
    }

    /** 熱需要換算処理(入力値と換算値の積を合計してReGeatDemを計算する) */
    calculateReHeatDem() {
        const denki = this.denkiInput.value * this.denkiRate;
        const toshiGass = this.toshiGassInput.value * this.toshiGassRate;
        const touyu = this.touyuInput.value * this.touyuRate;
        const zyuuyu = this.zyuuyuInput.value * this.zyuuyuRate;
        const ekikaSekiyuGasu = this.ekikaSekiyuGasuInput.value * this.ekikaSekiyuGasuRate;
        const taninKyoukyu = this.taninKyoukyuInput.value * this.taninKyoukyuRate;

        return denki + toshiGass + touyu + zyuuyu + ekikaSekiyuGasu + taninKyoukyu;
    }

    /** 熱需要値の更新(ArcGIS Onlineのアイテムを更新) */
    async updateReHeatDem() {
        const reHeatDem = this.calculateReHeatDem();
        if (AppSettings.state.heatType === 3) {
            this.selectedKaokuFeature.attributes["ReHeatDem3"] = reHeatDem;
        } else if (AppSettings.state.heatType === 4) {
            this.selectedKaokuFeature.attributes["ReHeatDem4"] = reHeatDem;
        }

        const layer = MapObj.getLayer(AppSettings.settings.layerNameBuildingLod0);
        const portalItem = await layer.applyEdits({
            updateFeatures: [this.selectedKaokuFeature]
        });
    }

    /** 入力値に0または正数が入力されているかチェックする */
    checkInputs() {
        let errorMsg = null;
        if (Math.sign(this.denkiInput.value) === -1) {
            errorMsg = "「電気」に正しい値を入力してください";
        } else if (Math.sign(this.toshiGassInput.value) === -1) {
            errorMsg = "「都市ガス（13A）」に正しい値を入力してください";
        } else if (Math.sign(this.touyuInput.value) === -1) {
            errorMsg = "「灯油」に正しい値を入力してください";
        } else if (Math.sign(this.zyuuyuInput.value) === -1) {
            errorMsg = "「重油」に正しい値を入力してください";
        } else if (Math.sign(this.ekikaSekiyuGasuInput.value) === -1) {
            errorMsg = "「液化石油ガス（LPG）」に正しい値を入力してください";
        } else if (Math.sign(this.taninKyoukyuInput.value) === -1) {
            errorMsg = "「他人から供給された熱」に正しい値を入力してください";
        } else if (this.calculateReHeatDem() === 0) {
            errorMsg = "いずれかの項目に値を入力してください";
        }

        return errorMsg;
    }

    /** 選択済みの家屋フィーチャをクエリで取得して格納する */
    async setSelectedFeature() {
        const self = this;
        const layer = MapObj.getLayer(AppSettings.settings.layerNameBuildingLod0);
        const feature = MapObj.selectedFeatures[0];
        const query = layer.createQuery();
        query.where = "OBJECTID = " + feature["OBJECTID"];
        query.outFields = [
            "OBJECTID",
            AppSettings.queryOutFields.buildingLod0.ReHeatDem3,
            AppSettings.queryOutFields.buildingLod0.ReHeatDem4,
        ];
        query.returnGeometry = false;

        //検索の開始
        await layer.queryFeatures(query).then(function (response) {
            self.selectedKaokuFeature = response.features[0];
        });
    }

    /** 熱需要値変更の編集画面(モーダル)
     *    -  「実行」ボタンクリック
     *    -  「キャンセル」ボタンクリック
     *    -  「×」ボタンクリック */
    initializeModal() {
        const self = this;
        this.saveButton.addEventListener("click", async function () {
            const errorMsg = self.checkInputs();
            if (errorMsg) {
                self.editHeatDemandMessage.innerHTML = errorMsg;
                return;
            }

            await self.updateReHeatDem();

            MapObj.endAction();
            self.closeModal();
        });

        this.closeButton.addEventListener("click", function () {
            MapObj.endAction();
            self.closeModal();
        });
        this.cancelButton.addEventListener("click", function () {
            MapObj.endAction();
            self.closeModal();
        });
    }

    /** 熱需要値変更の初期化
     *    -  「家屋選択」ボタンクリック
     *    -  「家屋」フィーチャを選択 */
    initializeAction() {
        if (MapObj.currentAction?.isProcessing) {
            return;
        }
        const self = this;
        const targetLayer = AppSettings.settings.layerNameBuildingLod0;
        const isMultipleSelect = false;
        const canRemove = false;
        const mapClickFunction = async (event) => {           
            MapObj.setMapClickNoSelect();
            await self.setSelectedFeature();
            self.showModal();
        };
        const endActionFunction = () => {
            MapObj.clearMapClickHandleEvent();
        };

        MapObj.setActionTool(
            this.elem,
            targetLayer,
            isMultipleSelect,
            canRemove,
            mapClickFunction,
            endActionFunction
        );
    }

    /** 初期化 */
    initialize() {
        this.initializeAction();
        this.initializeModal();
    }
};

/** 熱需要値変更(ActionTool) */
const MapActionEditHeatDemand = new EditHeatDemandAction();

export { MapActionEditHeatDemand };