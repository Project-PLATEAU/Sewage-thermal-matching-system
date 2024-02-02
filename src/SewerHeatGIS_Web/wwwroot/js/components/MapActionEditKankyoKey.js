import { AppSettings } from "./AppSettings.js";
import { AppObj } from "./AppObj.js";
import { MapObj } from "./MapObj.js";

/** 関連管渠変更 */
class EditKankyoKeyAction {
    constructor() {
        /** 「家屋選択」ボタン(関連管渠変更) */
        this.elem = document.getElementById("editKankyoKeyAction");

        /** 家屋の管渠キーフィールド名 */
        this.TmpKankyoKeyName = AppSettings.queryOutFields.buildingLod0.TmpKankyoKey;

        /** 管渠のキーフィールド名 */
        this.KankyoKeyName = AppSettings.settings.fieldNameDrainPipeKey;
    }


    async updateTempKankyoKey() {
        const selectedBuildingFeature = MapObj.selectedFeatures[0];
        const selectedDrainPipeFeature = MapObj.selectedFeatures[1];

        const kankyokey = selectedDrainPipeFeature.graphic.attributes[this.KankyoKeyName];
        selectedBuildingFeature.graphic.attributes[this.TmpKankyoKeyName] = kankyokey;

        const layer = MapObj.getLayer(AppSettings.settings.layerNameBuildingLod0);
        const portalItem = await layer.applyEdits({
            updateFeatures: [selectedBuildingFeature.graphic]
        });
    }

    /** 関連管渠変更の初期化
     *    -  「家屋選択」ボタンクリック
     *    -  「家屋」フィーチャを選択
     *    -  「管渠」フィーチャを選択 */
    initializeAction() {
        if (MapObj.currentAction?.isProcessing) {
            return;
        }

        const self = this;
        const targetLayer = AppSettings.settings.layerNameBuildingLod0;
        const isMultipleSelect = false;
        const canRemove = false;

        const mapClickFunctionSecond = async () => {
            await self.updateTempKankyoKey();
            MapObj.endAction();
        }
        const mapClickFunctionFirst = (event) => {
            MapObj.clearMapClickHandleEvent();

            MapObj.setMapClickHandle(mapClickFunctionSecond, AppSettings.settings.layerNameDrainPipe);
        };

        const endActionFunction = () => {
            MapObj.clearMapClickHandleEvent();
        };

        MapObj.setActionTool(
            this.elem,
            targetLayer,
            isMultipleSelect,
            canRemove,
            mapClickFunctionFirst,
            endActionFunction
        );
    }

    /** 初期化 */
    initialize() {
        this.initializeAction();
    }
};

/** 関連管渠変更(ActionTool) */
const MapActionEditKankyoKey = new EditKankyoKeyAction();
export { MapActionEditKankyoKey };