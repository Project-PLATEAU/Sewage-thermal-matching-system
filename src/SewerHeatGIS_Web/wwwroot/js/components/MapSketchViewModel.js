import { AppSettings } from "./AppSettings.js";
import { AppObj } from "./AppObj.js";
import { MapObj } from "./MapObj.js";
import { loadModules } from "./Utils.js";

let [Graphic, GeometryEngine, SketchViewModel] = await loadModules([
    "esri/Graphic",
    "esri/geometry/geometryEngine",
    "esri/widgets/Sketch/SketchViewModel",
]);

/** 2Dスケッチ */
class MapSketch {
    constructor() {
    }

    /** スケッチで作成したラインにラベルを追加する */
    addGraphicText(geometry) {
        const meter = ((Math.round(GeometryEngine.geodesicLength(geometry, "meters") * 10)) / 10);
        AppSettings.state.reportData.pipeLength = meter.toFixed(1);
        const textSymbol = {
            type: "text",
            color: AppSettings.constants.graphicTextColor,
            haloColor: "white",
            haloSize: "1px",
            text: AppSettings.state.reportData.pipeLength + " m",
            xoffset: AppSettings.constants.graphicTextOffset,
            yoffset: AppSettings.constants.graphicTextOffset,
            font: {
                size: AppSettings.constants.graphicTextSize,
                weight: "bold"
            }
        }
        const graphicText = new Graphic({
            geometry: geometry.extent.center,
            symbol: textSymbol
        });
        MapObj.graphicTextLayer.add(graphicText);
    }

    /** イベント追加 */
    addEventToSketchViewModel() {
        const self = this;

        MapObj.sketchViewModel.on("create", function (event) {
            if (event.state === "complete") {
                // 採熱経路作成後にラベルを追加
                self.addGraphicText(event.graphic.geometry);
                MapObj.endAction();
            }
        });

        MapObj.sketchViewModel.on("update", function (event) {
            if (MapObj.graphicTextLayer.graphics.length) {
                // 採熱経路の位置調整中はラベルを削除
                MapObj.graphicTextLayer.removeAll();
                AppSettings.state.reportData.pipeLength = null;
            }

            if (event.aborted) {
                MapObj.sketchViewModel.delete();
                return;
            }

            if (event.state === "complete" && event.graphics.length > 0) {
                // 位置確定後にラベルを再度追加
                self.addGraphicText(event.graphics[0].geometry);
            }
        });
    }

    /** スケッチの初期化 */
    initializeSketchViewModel() {
        const lineSymbol = {
            type: "simple-line",
            color: AppSettings.constants.graphicLineColor,
            width: AppSettings.constants.graphicLineWidth
        };
        MapObj.sketchViewModel = new SketchViewModel({
            view: MapObj.mapView,
            layer: MapObj.graphicLineLayer,
            polylineSymbol: lineSymbol,
        });

        this.addEventToSketchViewModel();
    }

    /** スケッチのクリア */
    clearSketchViewModel() {
        MapObj.sketchViewModel.layer.removeAll();
        MapObj.graphicTextLayer.removeAll();
        AppSettings.state.reportData.pipeLength = null;
    }

    /** 初期化 */
    initialize() {
        this.initializeSketchViewModel();
    }
};

/** スケッチ(採熱経路のライン・テキスト描画) */
const MapSketchViewModel = new MapSketch();

export { MapSketchViewModel };