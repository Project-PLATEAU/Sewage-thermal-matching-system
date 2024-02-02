import { AppSettings } from "./AppSettings.js";
import { MapObj } from "./MapObj.js";
import { SceneObj } from "./SceneObj.js";
import { loadModules, toggleElem } from "./Utils.js";

/** ArcGISのモジュールを読み込む */
let [Graphic] = await loadModules(["esri/Graphic"]);

/** 共通処理(2D地図・3D地図) */
class App {
    constructor() {
    }


    /** 2D地図と3D地図の表示を切り替える */
    switchView() {
        const map = document.getElementById("mapDiv");
        const scene = document.getElementById("sceneDiv");
        if (this.isMap) {
            // 3D地図を表示
            map.classList.add("d-none");
            scene.classList.remove("d-none");
            this.activeSceneEvent(MapObj.mapView.viewpoint);
        } else {
            // 2D地図を表示
            map.classList.remove("d-none");
            scene.classList.add("d-none");
            this.activeMapEvent(SceneObj.sceneView.viewpoint);
        }

        this.isMap = !this.isMap;
    }

    /** 2Dのヒートポンプ位置を更新する */
    updateHeatPumpPolygon(polygon) {
        // 2D地図をアクティブにするときにヒートポンプのジオメトリを3D地図から引き継ぐ
        MapObj.graphicHeatPumpLayer.removeAll();

        // シンボルを2Dに変更
        polygon.symbol = {
            type: "simple-fill",
            color: AppSettings.constants.sceneHeatPumpColor,
            style: "solid",
            outline: {
                color: AppSettings.constants.sceneHeatPumpOutlineColor,
                width: 1
            }
        };
        MapObj.graphicHeatPumpLayer.add(polygon);

        AppSettings.state.reportData.heatPumpPolygon = polygon.geometry;
        AppObj.reset3dHeatPumpPosition();
    }

    /** レポート作成用データをクリアする */
    clearReportData() {
        AppSettings.state.reportData = structuredClone(this.reportDataOrigin);
    }

    /** 処理区によるフィルター */
    setFeatureFilters(value) {
        MapObj.setFeatureFilter(value);
        SceneObj.setFeatureFilter(value);
    }

    /** 2D地図アクティブ時のイベント */
    activeMapEvent(viewpoint) {
        // viewpointを3D地図から引き継ぐ
        MapObj.mapView.viewpoint = viewpoint;
        MapObj.endAction();
    }

    /** 2Dデータを元に3Dデータを参照するクエリ用フィールドを取得する */
    getQueryFieldNames(layerName) {
        if (layerName === AppSettings.settings.layerNameBuildingLod1) {
            return [
                "OBJECTID",
                AppSettings.settings.fieldNameBuildingKey // 家屋のキー
            ];
        } else if (layerName === AppSettings.settings.layerNameDrainPipe) {
            return [
                "OBJECTID",
                AppSettings.settings.fieldNameDrainPipeKey // 管渠のキー
            ];
        }
    }

    /** 選択中2Dデータの属性値を取得する */
    getSelected2DValue(layerName) {
        if (layerName === AppSettings.settings.layerNameBuildingLod1) {
            return "'" + AppSettings.state.reportData.selectedBuildingKey + "'"; // 家屋はクエリ用に''で囲む
        } else if (layerName === AppSettings.settings.layerNameDrainPipe) {
            return AppSettings.state.reportData.selectedDrainPipeKey;
        }
    }

    /** 参照した3Dデータを選択中にする */
    selectAndHighlight(layer) {
        const fieldNames = this.getQueryFieldNames(layer.title);
        const selectedValue = this.getSelected2DValue(layer.title);

        const query = layer.createQuery();
        query.outFields = fieldNames;
        query.where = fieldNames[1] + " = " + selectedValue;
        layer.queryFeatures(query).then((result) => {
            if (result.features?.length > 0) {
                SceneObj.sceneView.whenLayerView(layer).then(function (layerView) {
                    const f = result.features[0];
                    const highlight = layerView.highlight(f.attributes.OBJECTID);
                    SceneObj.selectedFeatures.push({
                        layerName: layer.title,
                        graphic: f,
                        highlight: highlight
                    });
                });
            }
        });
    }

    /** 3D地図アクティブ時のイベント */
    activeSceneEvent(viewpoint) {
        // viewpointを2D地図から引き継ぐ
        SceneObj.sceneView.viewpoint = viewpoint;

        SceneObj.clearSelectedFeatures();

        for (const layer of SceneObj.scene.layers) {
            if (layer.title !== AppSettings.settings.layerNameBuildingLod1 &&
                layer.title !== AppSettings.settings.layerNameDrainPipe) {
                continue;
            }

            // 家屋と管渠レイヤを選択中にする
            this.selectAndHighlight(layer);
        }
    }

    /** 3Dヒートポンプの位置を初期化 */
    reset3dHeatPumpPosition() {
        SceneObj.graphicCubeLayer.removeAll();
        // ヒートポンプのグラフィックを追加
        const symbol = {
            type: "polygon-3d",
            symbolLayers: SceneObj.getSymbol(AppSettings.constants.heatPumpLayerName)
        };
        const graphic = new Graphic({
            geometry: AppSettings.state.reportData.heatPumpPolygon,
            symbol: symbol
        });
        SceneObj.graphicCubeLayer.add(graphic);
    }

    async init() {
        /** 2D地図表示中フラグ */
        this.isMap = true
        /** レポート作成用データの初期値 */
        this.reportDataOrigin = structuredClone(AppSettings.state.reportData);
        /** 2D⇔3D切り替えボタン */
        this.switchButton = document.getElementById("switchBtn");
        const self = this;
        this.switchButton.addEventListener("click", function () {
            if (self.isMap) {
                this.value = "2D";
                SceneObj.sketchViewModel.updateOnGraphicClick = false;
            } else {
                this.value = "3D";
                SceneObj.sketchViewModel.updateOnGraphicClick = true;
            }

            const sceneInfoDiv = document.getElementById("sceneInfoDiv");
            toggleElem(sceneInfoDiv);

            self.switchView();
        });
    }
};

/** 共通処理(2D地図・3D地図) */
const AppObj = new App();
export { AppObj };