import { AppSettings } from "./AppSettings.js";
import { AppObj } from "./AppObj.js";
import { SceneActionPumpSubmit } from "./SceneActionPumpSubmit.js";
import { SceneSketchViewModel } from "./SceneSketchViewModel.js";
import { loadModules } from "./Utils.js";

/** ArcGISのモジュールを読み込む */
let [WebScene, SceneView, GraphicsLayer, Portal] = await loadModules([
    "esri/WebScene",
    "esri/views/SceneView",
    "esri/layers/GraphicsLayer",
    "esri/portal/Portal",
]);

class Scene {
    constructor() {
    }

    /** レイヤに対応したレンダラーを取得する */
    getRenderer(layerName) {
        const type = "simple";
        const symbol = this.getSymbol(layerName);
        const renderer = {
            type: type,
            symbol: symbol,
        };

        const visualVariables = this.getVisualVariables(layerName);
        renderer.visualVariables = visualVariables;

        return renderer;
    }

    /** 3Dシンボルを取得する */
    getSymbol(layerName) {
        if (layerName === AppSettings.settings.layerNameDrainPipe) {
            // 3D管渠
            return {
                type: "line-3d",
                symbolLayers: [{
                    type: "path",
                    profile: "quad",
                    material: { color: AppSettings.constants.sceneDrainPipeColor }
                }]
            };
        }
        else if (layerName === AppSettings.settings.layerNameManhole) {
            // 3D人孔
            return {
                type: "point-3d",
                symbolLayers: [{
                    type: "object",
                    anchor: "relative",
                    anchorPosition: { x: 0, y: 0, z: 0.50 },
                    resource: { primitive: "cube" },
                    material: { color: AppSettings.constants.sceneManholeColor }
                }]
            };
        }
        else if (layerName === AppSettings.constants.heatPumpLayerName) {
            // 3Dヒートポンプ(高さはAppSettingsを都度参照)
            return {
                type: "extrude",
                size: AppSettings.state.reportData.heatPumpHight / 1000,
                material: {
                    color: AppSettings.constants.sceneHeatPumpColor
                },
                edges: {
                    type: "solid",
                    size: "1px",
                    color: AppSettings.constants.sceneHeatPumpOutlineColor
                }
            };
        }
    }

    /** 3Dシンボルの動的なスタイルを取得する */
    getVisualVariables(layerName) {
        if (layerName === AppSettings.settings.layerNameDrainPipe) {
            // 3D管渠
            return [{
                type: "size",
                axis: "height",
                /** 幅(垂直)は「外径高さ」を利用 */
                field: AppSettings.settings.fieldName3dGaikeiH,
                valueUnit: "millimeters"
            }, {
                type: "size",
                axis: "width",
                /** 幅(水平)は「外径幅」を利用 */
                field: AppSettings.settings.fieldName3dGaikeiW,
                valueUnit: "millimeters"
            }];
        }
        else if (layerName === AppSettings.settings.layerNameManhole) {
            // 3D人孔
            return [
                {
                    type: "size",
                    axis: "depth", // rotationType: "arithmetic"なので、widthとdepthを逆に設定する
                    /** 幅(東西方向)は「長辺外径」を利用*/
                    field: AppSettings.settings.fieldName3dGaikeiL,
                    valueUnit: "millimeters"
                },
                {
                    type: "size",
                    axis: "height",
                    /** 高さは「深さ」を利用 */
                    field: AppSettings.settings.fieldName3dDepth,
                    valueUnit: "meters"
                },
                {
                    type: "size",
                    axis: "width", // rotationType: "arithmetic"なので、widthとdepthを逆に設定する
                    /** 深さ(南北方向)は「短辺外径」を利用 */
                    field: AppSettings.settings.fieldName3dGaikeiS,
                    valueUnit: "millimeters"
                },
                {
                    type: "rotation",
                    axis: "heading",
                    /** 東が0度で反時計回り */
                    rotationType: "arithmetic",
                    field: AppSettings.settings.fieldName3dAngle
                }
            ];
        }
    }

    /** 選択済みフィーチャの解除(ハイライトの解除) */
    clearSelectedFeatures() {
        for (const f of this.selectedFeatures) {
            f.highlight.remove();
        }
        this.selectedFeatures = [];
    }

    /** 処理区フィルターを設定する */
    setFeatureFilter(value) {
        for (const layer of this.scene.layers) {
            if (layer.title === AppSettings.settings.layerNameBuildingLod1
                || layer.title === AppSettings.settings.layerNameDrainPipe
                || layer.title === AppSettings.settings.layerNameManhole
            ) {
                layer.definitionExpression = AppSettings.settings.fieldNameArea + " = " + value;
            }
        }
    }

    initializeEvents() {
        SceneActionPumpSubmit.initialize();
    }

    initializeFilter() {
        if (AppSettings.settings.fieldNameAreaNames?.length === 0) {
            throw new Error('設定ファイルから処理区が参照できません。');
        }
        // 処理区フィルターを設定
        const defaultAreaValue = AppSettings.settings.fieldNameAreaNames[0].Value;
        this.setFeatureFilter(defaultAreaValue);
    }

    initializeLayers() {
        // 管渠と家屋レイヤは独自の3Dシンボルを設定
        for (const layer of this.scene.layers) {
            layer.minScale = AppSettings.constants.sceneLayerMinScale;
            layer.maxScale = AppSettings.constants.SceneLayerMaxScale;

            if (layer.title === AppSettings.settings.layerNameBuildingLod1) {
                continue; // 家屋はシーンレイヤをそのまま表示
            }

            // 属性値から3Dシンボルの属性を動的に変更
            layer.renderer = this.getRenderer(layer.title);
        }
    }

    async initialize() {
        /** (3Dポリゴン)ヒートポンプレイヤ */
        this.graphicCubeLayer = new GraphicsLayer({
            title: AppSettings.constants.heatPumpLayerName,
            elevationInfo: {
                mode: "on-the-ground"
            },
        });
        /** ヒートポンプの回転・位置調整用 */
        this.sketchViewModel = null;
        /** 選択済みフィーチャ */
        this.selectedFeatures = [];

        // ハイライト(枠線)の透過度を変更
        this.sceneView.highlightOptions.haloOpacity = AppSettings.constants.highlightHaloOpacity;
        // ハイライト(塗りつぶし)の透過度を変更
        this.sceneView.highlightOptions.fillOpacity = AppSettings.constants.highlightFillOpacity;

        this.scene.ground.navigationConstraint = {
            type: "none"
        };
        this.scene.ground.opacity = AppSettings.constants.sceneGroundOpacity;
        this.sceneView.popup.autoOpenEnabled = false;

        this.initializeLayers();
        SceneSketchViewModel.initialize();
        this.initializeFilter();
        this.initializeEvents();
    }

    /** オブジェクトの初期化 */
    async init() {
        var portal = new Portal();
        portal.authMode = "immediate";
        await portal.load();

        let itemTitle = "公開用シーン";
        let queryParams = {
            filter: 'type:"Web Scene" AND title:"' + itemTitle + '" NOT access:public'
        };
        let items = await portal.queryItems(queryParams);
        if (items.results.length === 0) {
            throw new Error('ArcGIS Onlineから公開用シーンが参照できません。');
        }

        /** WebScene (ArcGIS) */
        this.scene = new WebScene({
            portalItem: {
                id: items.results[0].id
            }
        });
        /** SceneView (ArcGIS) */
        this.sceneView = new SceneView({
            map: this.scene,
            container: "sceneViewDiv",
            center: AppSettings.settings.center,
            zoom: AppSettings.settings.zoom,
        });

        // シーンデータ読み込み後
        this.scene.when(() => {
            this.initialize();
        });
    }
};

/** 3D地図 */
const SceneObj = new Scene();

export { SceneObj };