import { AppSettings } from "./AppSettings.js";
import { AppObj } from "./AppObj.js";
import { MapActionMatching } from "./MapActionMatching.js";
import { MapActionEditKankyoKey } from "./MapActionEditKankyoKey.js";
import { MapActionEditHeatDemand } from "./MapActionEditHeatDemand.js";
import { MapActionReportMode } from "./MapActionReportMode.js";
import { loadModules } from "./Utils.js";

/** ArcGISのモジュールを読み込む */
let [WebMap, MapView, GraphicsLayer, Legend, ReactiveUtils, Portal, SimpleFillSymbol, SimpleLineSymbol, Color, Graphic, esriId] = await loadModules([
    "esri/WebMap",
    "esri/views/MapView",
    "esri/layers/GraphicsLayer",
    "esri/widgets/Legend",
    "esri/core/reactiveUtils",
    "esri/portal/Portal",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    "esri/Graphic",
    "esri/identity/IdentityManager",
]);

class Map {
    constructor() {
    }

    addDisabledElems() {
        const elems = document.getElementsByClassName("canDisabled");
        for (let i = 0; i < elems.length; i++) {
            if (this.mode === "report" && !elems[i].closest("#reportModeLabel")) {
                elems[i].disabled = true;
            }
            else if (this.mode === "default" && elems[i].closest("#reportModeLabel")) {
                elems[i].disabled = true;
            }
        }
    }

    removeDisabledElems() {
        const elems = document.getElementsByClassName("canDisabled");
        for (let i = 0; i < elems.length; i++) {
            elems[i].disabled = false;
        }
    }

    refreshDisabledElems() {
        this.removeDisabledElems();
        this.addDisabledElems();
    }

    /**
     * マップクリック時のイベントハンドラを設定する
     * @param {Function} click_func フィーチャの選択が全て終わったら実行される処理
     * @param {string} targetLayerName マップでの選択対象レイヤ(1レイヤ)
     * @param {boolean} isMultipleSelect フィーチャ複数選択フラグ
     * @param {boolean} canRemove フィーチャ解除可能フラグ
     */
    setMapClickHandle(click_func, targetLayerName, isMultipleSelect = false, canRemove = false) {
        const self = this;
        if (this.mapClickHandle) {
            this.clearMapClickHandleEvent();
        }

        // 各Actionで定義したクリック時の処理をイベントハンドラに追加
        this.mapClickHandle = ReactiveUtils.on(
            () => self.mapView,
            "click",
            (event) => {
                if (!self.currentAction) {
                    return;
                }

                self.currentAction.isProcessing = true;
                self.mapView.hitTest(event, { include: MapObj.getLayer(targetLayerName)}).then(function (response) {
                    const graphicHits = response.results?.filter(
                        (hitResult) =>
                            hitResult.type === "graphic"
                            && hitResult.layer.title === targetLayerName // 対象レイヤーのみにフィルター
                    );

                    // 対象レイヤでクリックしたデータがあればハイライトする。
                    if (graphicHits?.length > 0) {
                        graphicHits.forEach((graphicHit, index) => {
                            if (!isMultipleSelect && index !== 0) {
                                return;
                            }

                            // ハイライト表示
                            self.mapView.whenLayerView(graphicHit.graphic.layer).then(function (layerView) {
                                const objectid = graphicHit.graphic.attributes.OBJECTID;
                                const existF = self.selectedFeatures?.filter(
                                    (f) => f.OBJECTID === objectid
                                );
                                if (existF.length === 0) {
                                    // クリックしたフィーチャが未選択の場合
                                    const highlight = layerView.highlight(graphicHit.graphic);
                                    self.selectedFeatures.push({
                                        OBJECTID: objectid,
                                        layerName: graphicHit.layer.title,
                                        graphic: graphicHit.graphic,
                                        highlight: highlight
                                    });
                                    let selectedGraphic = self.createSelectionGraphic(graphicHit.graphic.geometry);
                                    self.graphicsSelectionLayer.add(selectedGraphic);
                                } else if (canRemove) {
                                    // クリックしたフィーチャが選択済みの場合
                                    self.removeSelectedFeatures(graphicHit.layer.title, existF[0].OBJECTID);
                                }

                                if ((!isMultipleSelect && index === 0)
                                    || (graphicHits.length == index + 1)) {
                                    // フィーチャの選択が全て終わったらクリック時の処理を実行
                                    click_func(event);

                                    if (self.currentAction?.isProcessing) {
                                        self.currentAction.isProcessing = false;
                                    }
                                }
                            });
                        });
                    }
                });
            }
        );
    }

    /** イベントハンドラをクリア */
    clearMapClickHandleEvent() {
        if (this.mapClickHandle) {
            this.mapClickHandle.remove();
            this.mapClickHandle = null;
        }
    }

    /** マップクリック時に何もしない。(フィーチャ選択させない)  */
    setMapClickNoSelect() {
        this.clearMapClickHandleEvent();
        this.setMapClickHandle(() => { }, "");
    }

    ChangeMode(targetMode) {
        if (targetMode === this.mode) {
            return;
        }

        this.mode = targetMode;
    }

    /** Actionを設定する */
    setAction(currentActionName, end_func) {
        if (this.mode === "default") {
            this.clearPopupHighlight();
        }

        const targetElem = document.getElementById(currentActionName);
        targetElem.classList.add("item-selected");
        targetElem.blur();

        this.currentAction = {
            /** Action名 */
            name: currentActionName,
            /** 処理実行中フラグ */
            isProcessing: false,
            /** Action完了時の処理 */
            end: end_func,
        };

        // ポップアップの自動表示をOFF
        this.mapView.popup.autoOpenEnabled = false;
    }

    /** アクション終了処理 */
    endAction() {
        if (!this.currentAction) {
            return;
        }

        const targetElem = document.getElementById(this.currentAction.name);
        targetElem.classList.remove("item-selected");
        targetElem.blur();

        // Actionごとに設定してあるend()処理を実行
        this.currentAction.end();
        this.currentAction = null;

        if (this.mode === "default") {
            this.mapView.popup.autoOpenEnabled = true;
            this.clearSelectedFeatures();
        }
    }

    /** 選択済みのフィーチャから除外する */
    removeSelectedFeatures(layerName, objectid) {
        const feature = this.selectedFeatures.filter(f =>
            f.layerName === layerName &&
            f.OBJECTID === objectid
        );
        if (feature?.length > 0) {
            feature[0].highlight.remove();
            this.selectedFeatures = this.selectedFeatures.filter(f => f !== feature[0]);
        }
    }

    /** 選択済みのフィーチャから対象レイヤのデータを全て除外する */
    removeLayerSelectedFeatures(layerName) {
        const featues = this.selectedFeatures.filter(
            (f) => f.layerName === layerName
        );
        const objectids = featues.map(x => x.OBJECTID);
        for (const objectid of objectids) {
            MapObj.removeSelectedFeatures(layerName, objectid);
        }
    }

    /** 選択済みのフィーチャを全てクリアする */
    clearSelectedFeatures() {
        for (const f of this.selectedFeatures) {
            f.highlight.remove();
        }
        this.selectedFeatures = [];
        this.clearSelectionGraphic();
    }

    clearPopupHighlight() {
        this.mapView.popup.highlightEnabled = false;
        this.mapView.popup.close();
        this.mapView.popup.highlightEnabled = true;
    }


    createSelectionGraphic(geometry) {
        if (geometry.type === "polygon") {
            const graphic = new Graphic({
                geometry: geometry,
                symbol: this.selectionFillSymbol
            });
            this.graphicsSelectionLayer.add(graphic);
        }
        else if (geometry.type === "polyline") {
            const graphic = new Graphic({
                geometry: geometry,
                symbol: this.selectionLineSymbol
            });
            this.graphicsSelectionLayer.add(graphic);
        }
    }

    clearSelectionGraphic()
    {
        this.graphicsSelectionLayer.removeAll();
    }

    /** ArcGIS Onlineに公開されているレイヤをオブジェクトに格納する */
    setFeatureLayer(layer) {
        if (layer.title === AppSettings.settings.layerNameBuildingLod0) {
            this.buildingLod0FeatureLayer = layer;
        } else if (layer.title === AppSettings.settings.layerNameDrainPipe) {
            this.drainPipeFeatureLayer = layer;
        } else if (layer.title === AppSettings.settings.layerNameManhole) {
            this.manholeFeatureLayer = layer;
        }
    }

    /** mapからレイヤを取得する */
    getLayer(layerName) {
        for (const layer of this.map.layers) {
            if (layer.title === layerName) {
                return layer;
            }
        }
    }

    /** 処理区フィルターを設定する */
    setFeatureFilter(value) {
        for (const layer of this.map.layers) {
            if (layer.title === AppSettings.settings.layerNameBuildingLod0
                || layer.title === AppSettings.settings.layerNameDrainPipe
                || layer.title === AppSettings.settings.layerNameManhole
            ) {
                layer.definitionExpression = AppSettings.settings.fieldNameArea + " = " + value;
            }
        }
    }

    /** フィーチャ選択時のポップアップイベント */
    addEventToPopup() {
        const self = this;
        ReactiveUtils.watch(
            () => self.mapView.popup.selectedFeature,
            () => {
                if (self.currentAction) {
                    self.clearPopupHighlight();
                }
            }
        );
    }

    /** 「地区絞込み(処理区)」セレクトボックス変更イベント */
    addEventToChikuSelect() {
        if (this.currentAction?.isProcessing) {
            return;
        }

        const self = this;
        const elem = document.getElementById("chikuSelect");
        AppSettings.state.chiku = elem.value;
        elem.addEventListener("calciteSelectChange", function () {
            self.endAction();
            AppSettings.state.chiku = this.value;
            AppObj.setFeatureFilters(this.value);
        });
    }

    /** 「検索対象選択」セレクトボックス変更イベント */
    addEventToHeatTypeSelect() {
        if (this.currentAction?.isProcessing) {
            return;
        }

        const self = this;
        const elem = document.getElementById("heatTypeSelect");
        AppSettings.state.heatType = parseInt(elem.value);
        elem.addEventListener("calciteSelectChange", function () {
            self.endAction();
            AppSettings.state.heatType = parseInt(this.value);
        });
    }

    /**
     * ActionTool共通の設定(ActionTool:マップ上で操作する)
     *  - ボタンクリックのイベント追加
     *  - マップ上でのフィーチャ選択モードの設定
     * @param {HTMLElement} elem 対象ボタンのエレメント
     * @param {string} targetLayerName マップでの選択対象レイヤ(1レイヤ)
     * @param {boolean} isMultipleSelect フィーチャ複数選択フラグ
     * @param {Function} mapClick_func フィーチャ選択時の処理
     * @param {Function} endAction_func Action終了時の処理
     */
    setActionTool(elem, targetLayerName, isMultipleSelect, canRemove, mapClick_func, endAction_func) {
        const self = this;

        elem.addEventListener("click", function () {
            const currentActionName = self.currentAction?.name;
            self.endAction();
            if (currentActionName === this.id) {
                // 同じボタンをクリックした場合はActionを解除する。
                return;
            }

            // マップクリックイベント追加
            self.setMapClickHandle(
                mapClick_func,
                targetLayerName,
                isMultipleSelect,
                canRemove
            );

            self.setAction(this.id, endAction_func);
        });
    }

    initializeEvents() {
        this.addEventToPopup();

        const elem = document.getElementById("control-signout");
        elem.addEventListener('click', () => {
            esriId.destroyCredentials();
            window.location.reload();
        });

        this.addEventToChikuSelect(); // 処理区選択
        this.addEventToHeatTypeSelect(); // 検索対象選択            

        MapActionMatching.initialize();
        MapActionEditKankyoKey.initialize();
        MapActionEditHeatDemand.initialize();
        MapActionReportMode.initialize();
    }

    initializeFilter() {
        if (AppSettings.settings.fieldNameAreaNames?.length === 0) {
            throw new Error('設定ファイルから処理区が参照できません。');
        }
        // 処理区フィルターを設定
        const defaultAreaValue = AppSettings.settings.fieldNameAreaNames[0].Value;
        this.setFeatureFilter(defaultAreaValue);

        // 処理区のセレクトボックスに項目追加
        const elem = document.getElementById("chikuSelect");
        let html;
        for (const area of AppSettings.settings.fieldNameAreaNames) {
            if (html) {
                html += `<calcite-option value="${area.Value}">${area.Name}</calcite-option>`;
            } else {
                html = `<calcite-option value="${area.Value}" selected="">${area.Name}</calcite-option>`;
            }
        }
        elem.innerHTML = html;
    }

    initializePopup() {
        // ドッキングボタンを無効
        this.mapView.popup.dockOptions.buttonEnabled = false;

        // ポップアップで表示する属性だけにフィルター
        const builfingLod0FieldInfo = this.buildingLod0FeatureLayer.popupTemplate.content[0].fieldInfos.filter(
            (x) => Object.values(AppSettings.popupFields.buildingLod0).includes(x.fieldName)
        );
        this.buildingLod0FeatureLayer.popupTemplate.content[0].fieldInfos = builfingLod0FieldInfo;
        this.buildingLod0FeatureLayer.popupTemplate.title = "家屋";

        const drainPipeFieldInfo = this.drainPipeFeatureLayer.popupTemplate.content[0].fieldInfos.filter(
            (x) => Object.values(AppSettings.popupFields.drainPipe).includes(x.fieldName)
        );
        this.drainPipeFeatureLayer.popupTemplate.content[0].fieldInfos = drainPipeFieldInfo;
        this.drainPipeFeatureLayer.popupTemplate.title = "管渠";

        const manholeFieldInfo = this.manholeFeatureLayer.popupTemplate.content[0].fieldInfos.filter(
            (x) => Object.values(AppSettings.popupFields.manhole).includes(x.fieldName)
        );
        this.manholeFeatureLayer.popupTemplate.content[0].fieldInfos = manholeFieldInfo;
        this.manholeFeatureLayer.popupTemplate.title = "人孔";
    }

    initializeQuery() {
        // クエリで利用する属性を設定
        this.buildingLod0FeatureLayer.outFields = Object.values(AppSettings.queryOutFields.buildingLod0);
        this.drainPipeFeatureLayer.outFields = Object.values(AppSettings.queryOutFields.drainPipe);
        this.manholeFeatureLayer.outFields = Object.values(AppSettings.queryOutFields.manhole);
    }

    initializeLegend() {
        const layerInfos = [
            {
                title: "家屋", layer: this.buildingLod0FeatureLayer,
            },
            {
                title: "管渠", layer: this.drainPipeFeatureLayer,
            },
            {
                title: "人孔", layer: this.manholeFeatureLayer,
            },
        ];
        const legend = new Legend({
            view: this.mapView,
            layerInfos: layerInfos
        });
        this.mapView.ui.add(legend, "bottom-left");
    }

    initializeLayers() {
        for (const layer of this.map.layers) {
            if (layer.type === "feature") {
                // ArcGIS OnlineのFeatureLayerをオブジェクトに格納
                this.setFeatureLayer(layer);
            }
        }

        // ヒートポンプ(2D)と採熱経路を追加
        this.map.add(this.graphicHeatPumpLayer);
        this.map.add(this.graphicLineLayer);
        this.map.add(this.graphicTextLayer);
        this.map.add(this.graphicsSelectionLayer);
    }

    /** 初期化 */
    async initialize() {
        /** ArcGIS Online公開の家屋(lod0)レイヤ */
        this.buildingLod0FeatureLayer = null;
        /** ArcGIS Online公開の管渠レイヤ */
        this.drainPipeFeatureLayer = null;
        /** ArcGIS Online公開の人孔レイヤ */
        this.manholeFeatureLayer = null;
        /** (ライン)採熱経路レイヤ */
        this.graphicLineLayer = new GraphicsLayer({
            title: AppSettings.constants.graphicLineLayerName,
        });
        /** (テキスト)採熱経路レイヤ */
        this.graphicTextLayer = new GraphicsLayer({
            title: AppSettings.constants.graphicTextLayerName
        });
        /** (2Dポリゴン)ヒートポンプレイヤ */
        this.graphicHeatPumpLayer = new GraphicsLayer({
            title: AppSettings.constants.heatPumpLayerName,
        });
        /** マッチング結果ラベル(家屋) */
        this.buildingLod0LabelLayer = null;
        /** マッチング結果ラベル(管渠) */
        this.drainPipeLabelLayer = null;
        /** 選択済みフィーチャ */
        this.selectedFeatures = [];
        /** 採熱経路の作成・位置調整用 */
        this.sketchViewModel = null;
        /** マップクリックのイベントハンドラ */
        this.mapClickHandle = null;
        /** Actionの起動モード(default/report) */
        this.mode = "default";
        /** 起動中のAction */
        this.currentAction = null;

        // ハイライト(枠線)の透過度を変更
        this.mapView.highlightOptions.haloOpacity = AppSettings.constants.highlightHaloOpacity;
        // ハイライト(塗りつぶし)の透過度を変更
        this.mapView.highlightOptions.fillOpacity = AppSettings.constants.highlightFillOpacity;

        this.graphicsSelectionLayer = new GraphicsLayer({ title: "graphicsSelectionLayer", visible: false });

        const highlightColor = this.mapView.highlightOptions.color;
        this.selectionLineSymbol = new SimpleLineSymbol({
            style: "solid", color: new Color([
                highlightColor.r,
                highlightColor.g,
                highlightColor.b,
                this.mapView.highlightOptions.haloOpacity])
            , width: 3
        });

        this.selectionFillSymbol = new SimpleFillSymbol({
            style: "solid",
            outline: this.selectionLineSymbol,
            color: new Color([
                highlightColor.r,
                highlightColor.g,
                highlightColor.b,
                this.mapView.highlightOptions.fillOpacity]),
        });

        this.initializeLayers();
        this.initializeLegend();
        this.initializeQuery();
        this.initializePopup();
        this.initializeFilter();
        this.initializeEvents();
        this.addDisabledElems();
    }

    /** オブジェクトの初期化 */
    async init() {
        var portal = new Portal();
        portal.authMode = "immediate";
        await portal.load();

        let itemTitle = "公開用マップ";
        let queryParams = {
            filter: 'type:"Web Map" AND title:"' + itemTitle + '" NOT access:public'
        };
        let items = await portal.queryItems(queryParams);
        if (items.results.length === 0) {
            throw new Error('ArcGIS Onlineから公開用マップが参照できません。');
        }

        const webMap = new WebMap({
            portalItem: {
                id: items.results[0].id
            }
        });

        /** WebMap (ArcGIS) */
        this.map = webMap;

        /** MapView (ArcGIS) */
        this.mapView = new MapView({
            map: webMap,
            container: "mapViewDiv",
            center: AppSettings.settings.center,
            zoom: AppSettings.settings.zoom,
            constraints: {
                maxZoom: AppSettings.constants.maxZoom,
                minZoom: AppSettings.constants.minZoom,
            }
        });

        this.map.when(() => {
            this.initialize();
        });
    }
};

/** 2D地図 */
const MapObj = new Map();

export { MapObj };