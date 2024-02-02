import { AppSettings } from "./AppSettings.js";
import { AppObj } from "./AppObj.js";
import { MapObj } from "./MapObj.js";
import { MapSketchViewModel } from "./MapSketchViewModel.js";
import { MapActionReportCreate3DPump } from "./MapActionReportCreate3DPump.js";
import { MapActionReportCreatePipeLine } from "./MapActionReportCreatePipeLine.js";
import { MapActionReportDownload } from "./MapActionReportDownload.js";

class ReportModeAction {
    constructor() {
        /** 「家屋→管渠選択」ボタン(検討ツール・調書作成) */
        this.startReportModeElem = document.getElementById("startReportModeAction");
        /** 「図形削除」ボタン */
        this.endReportModeElem = document.getElementById("endReportModeAction");

        // レポート作成で利用する属性名
        // 家屋
        this.buildingKeyName = AppSettings.queryOutFields.buildingLod0.SEQNO; // gen_建物ID
        this.buildingNobeyukaName = AppSettings.queryOutFields.buildingLod0.Nobeyuka; // Nobeyuka
        this.buildingYoutoName = AppSettings.queryOutFields.buildingLod0.NewYouto; // NewYouto
        this.buildingReHeatDem3Name = AppSettings.queryOutFields.buildingLod0.ReHeatDem3; // ReHeatDem3
        this.buildingReHeatDem4Name = AppSettings.queryOutFields.buildingLod0.ReHeatDem4; // ReHeatDem4
        // 管渠
        this.drainPipeKeyName = AppSettings.queryOutFields.drainPipe.SEQNO; // SEQNO
        this.drainPipeSecDistName = AppSettings.queryOutFields.drainPipe.SEC_DIST; // SEC_DIST
        this.drainPipeDiameterWName = AppSettings.queryOutFields.drainPipe.DIAMETER_W; // DIAMETER_W
        this.drainPipeConstYearName = AppSettings.queryOutFields.drainPipe.CONST_YEAR; // CONST_YEAR
        this.drainPipePotentialSName = AppSettings.queryOutFields.drainPipe.Potential_S; // Potential_S
        this.drainPipePotentialWName = AppSettings.queryOutFields.drainPipe.Potential_W; // Potential_W
        this.drainPipePotentialYName = AppSettings.queryOutFields.drainPipe.Potential_Y; // Potential_Y
    }

    /** レポートモードを開始する */
    reportModeStart() {
        MapObj.ChangeMode("report");
        MapObj.refreshDisabledElems();

        // 選択中のフィーチャから必要な属性を取得
        this.setAttributesBySelectedFeatures();
    }

    /** レポートモードを終了する */
    reportModeEnd() {
        MapObj.graphicHeatPumpLayer.removeAll();
        MapSketchViewModel.clearSketchViewModel();
        MapObj.clearSelectedFeatures();
        MapObj.clearMapClickHandleEvent();
        MapObj.ChangeMode("default");
        AppObj.clearReportData();
        MapObj.mapView.popup.autoOpenEnabled = true;
        MapObj.refreshDisabledElems();
    }

    /** レポート作成に必要な属性値をAppSettingsに格納する */
    setAttributesBySelectedFeatures() {
        let reHeatDemFiledName;
        if (AppSettings.state.heatType === 3) {
            reHeatDemFiledName = this.buildingReHeatDem3Name;
        } else if (AppSettings.state.heatType === 4) {
            reHeatDemFiledName = this.buildingReHeatDem4Name;
        }

        // AppSettingsを更新
        for (const f of MapObj.selectedFeatures) {
            if (f.layerName !== AppSettings.settings.layerNameBuildingLod0
                && f.layerName !== AppSettings.settings.layerNameDrainPipe) {
                return; // 家屋と管渠以外は参照しない
            }

            // レポート作成で必要な属性を取得する。
            if (f.layerName === AppSettings.settings.layerNameBuildingLod0) {
                // 家屋
                AppSettings.state.reportData.selectedBuildingKey = f.graphic.attributes[this.buildingKeyName];
                AppSettings.state.reportData.nobeyuka = f.graphic.attributes[this.buildingNobeyukaName];
                AppSettings.state.reportData.youto = f.graphic.attributes[this.buildingYoutoName];
                AppSettings.state.reportData.reHeatDem = f.graphic.attributes[reHeatDemFiledName];
            } else if (f.layerName === AppSettings.settings.layerNameDrainPipe) {
                // 管渠
                AppSettings.state.reportData.selectedDrainPipeCenter = f.graphic.geometry.extent.center;
                AppSettings.state.reportData.selectedDrainPipeKey = f.graphic.attributes[this.drainPipeKeyName];
                AppSettings.state.reportData.potentialS = f.graphic.attributes[this.drainPipePotentialSName];
                AppSettings.state.reportData.potentialW = f.graphic.attributes[this.drainPipePotentialWName];
                AppSettings.state.reportData.potentialY = f.graphic.attributes[this.drainPipePotentialYName];
                AppSettings.state.reportData.constYear = f.graphic.attributes[this.drainPipeConstYearName];
                AppSettings.state.reportData.diameterW = f.graphic.attributes[this.drainPipeDiameterWName];
                AppSettings.state.reportData.secDist = f.graphic.attributes[this.drainPipeSecDistName];
            }
        }
    }

    /** レポートモード開始の初期化
     *    -  「家屋→管渠選択」ボタンクリック
     *    -  「家屋」フィーチャを選択
     *    -  「管渠」フィーチャを選択 */
    initializeActionStart() {
        if (MapObj.currentAction?.isProcessing) {
            return;
        }

        const self = this;
        // モード管理があるので汎用クリックイベントは使わない。
        this.startReportModeElem.addEventListener("click", function () {
            if (MapObj.mode === "default") {
                // レポートモード未開始
                const currentActionName = MapObj.currentAction?.name;
                MapObj.endAction();
                if (currentActionName === this.id) {
                    self.reportModeEnd();
                    return; // もう一度ボタンをクリックした場合は解除する。
                }
            } else {
                // レポートモードを終了し、再度「家屋→管渠選択」を実行する。
                MapObj.endAction();
                self.reportModeEnd();
            }

            // Action起動時のイベント追加
            const mapClickFunctionSecond = (event) => {
                self.reportModeStart();
                MapObj.endAction();
            };
            const mapClickFunctionFirst = (event) => {
                MapObj.clearMapClickHandleEvent();
                MapObj.setMapClickHandle(mapClickFunctionSecond, AppSettings.settings.layerNameDrainPipe);
            };
            MapObj.setMapClickHandle(mapClickFunctionFirst, AppSettings.settings.layerNameBuildingLod0);

            const endActionFunction = () => {
                if (MapObj.mode === "default") {
                    MapObj.clearMapClickHandleEvent();
                } else {
                    MapObj.setMapClickNoSelect();
                }
            };
            MapObj.setAction(this.id, endActionFunction);
        });
    }


    /** レポートモード終了の初期化
     *    -  「図形削除」ボタンクリックで起動 */
    initializeActionEnd() {
        if (MapObj.currentAction?.isProcessing) {
            return;
        }

        const self = this;
        this.endReportModeElem.addEventListener("click", function () {
            MapObj.endAction();

            self.reportModeEnd();
        });
    }

    /** 初期化 */
    initialize() {
        MapSketchViewModel.initialize();
        this.initializeActionStart();
        MapActionReportCreate3DPump.initialize();
        MapActionReportCreatePipeLine.initialize();
        MapActionReportDownload.initialize();
        this.initializeActionEnd();
    }
};

/** レポート作成モード(ActionTool/ActionCommand) */
const MapActionReportMode = new ReportModeAction();

export { MapActionReportMode };